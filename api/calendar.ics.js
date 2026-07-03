import { kv } from '@vercel/kv';

const KEY = 'deadline-tracker:tasks';
const PRIORITY_NUM = { HIGH: 1, MED: 5, LOW: 9 };
const PRIORITY_LABEL = { HIGH: 'High', MED: 'Medium', LOW: 'Low' };

function icsEscape(str) {
  return String(str).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
}

function buildIcs(tasks) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Deadline Tracker//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Deadline Tracker',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H'
  ];

  tasks.forEach(t => {
    if (t.done && !t.repeat) return; // skip completed one-off tasks

    let startLine, endLine, alarmTrigger;
    if (t.time) {
      const compact = t.deadline.replace(/-/g, '') + 'T' + t.time.replace(':', '') + '00';
      const endDt = new Date(t.deadline + 'T' + t.time + ':00');
      endDt.setMinutes(endDt.getMinutes() + 30);
      const endCompact = endDt.toISOString().slice(0, 19).replace(/[-:]/g, '');
      startLine = `DTSTART:${compact}`;
      endLine = `DTEND:${endCompact}`;
      alarmTrigger = '-PT30M';
    } else {
      const dateCompact = t.deadline.replace(/-/g, '');
      const nextDay = new Date(t.deadline + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const endCompact = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
      startLine = `DTSTART;VALUE=DATE:${dateCompact}`;
      endLine = `DTEND;VALUE=DATE:${endCompact}`;
      alarmTrigger = '-P1D';
    }

    const icsPriority = PRIORITY_NUM[t.priority || 'MED'];
    const priorityPrefix = t.priority === 'HIGH' ? '[High] ' : t.priority === 'LOW' ? '[Low] ' : '';

    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.id}@deadline-tracker`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      startLine,
      endLine,
      `PRIORITY:${icsPriority}`,
      `SUMMARY:${icsEscape(priorityPrefix + t.name + (t.society ? ' — ' + t.society : ''))}`,
      `DESCRIPTION:${icsEscape('Priority: ' + PRIORITY_LABEL[t.priority || 'MED'] + (t.society ? ' | Society: ' + t.society : ''))}`
    );

    if (t.repeat && t.repeat.freq) {
      let rrule = `FREQ=${t.repeat.freq};INTERVAL=${t.repeat.interval || 1}`;
      if (t.repeat.until) {
        rrule += `;UNTIL=${t.repeat.until.replace(/-/g, '')}T235959Z`;
      }
      lines.push(`RRULE:${rrule}`);
      if (t.completedDates && t.completedDates.length) {
        const exDates = t.time
          ? t.completedDates.map(d => d.replace(/-/g, '') + 'T' + t.time.replace(':', '') + '00')
          : t.completedDates.map(d => d.replace(/-/g, ''));
        lines.push(t.time ? `EXDATE:${exDates.join(',')}` : `EXDATE;VALUE=DATE:${exDates.join(',')}`);
      }
    }

    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Deadline reminder',
      `TRIGGER:${alarmTrigger}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default async function handler(req, res) {
  const requiredToken = process.env.CAL_TOKEN;
  if (requiredToken && req.query.token !== requiredToken) {
    return res.status(403).send('Forbidden: missing or invalid token');
  }

  const tasks = (await kv.get(KEY)) || [];
  const ics = buildIcs(tasks);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(ics);
}
