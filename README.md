# Deadline Tracker (hosted, with live Apple Calendar sync)

A tiny hosted version of the tracker: a real webpage (so mobile taps actually
work — Quick Look and the chat preview don't run JavaScript, a real deployed
site does) plus a live calendar feed you subscribe to once in Apple Calendar.

## What you get after deploying

- `https://your-app.vercel.app/` — the tracker, works like a normal website.
- `https://your-app.vercel.app/api/calendar.ics` — a live feed. Subscribing to
  this (not importing it) means Apple Calendar re-fetches it automatically
  (roughly hourly) and picks up new/edited/completed tasks without you doing
  anything.

## Using it

1. Open `https://your-app.vercel.app` on your phone — this is a real page now,
   so all the buttons and checkboxes work normally.
2. Add your tasks (with priority, deadline, time, and repeat if needed).
3. In the "Apple Calendar sync" panel, tap **Open in Calendar app** — this
   uses the `webcal://` link, which iOS recognizes and offers to add as a
   **subscribed calendar** directly.
   - Alternative manual route: Settings → Calendar → Accounts → Add Account →
     Other → **Add Subscribed Calendar** → paste the link shown in the app.
4. From now on, anything you add or check off in the tracker shows up in
   Apple Calendar within about an hour (subscribed calendars refresh
   periodically — Apple doesn't allow instant push for third-party feeds).

## Notes

- Recurring tasks use standard iCalendar `RRULE`s, so Apple Calendar expands
  them itself — daily/weekly/monthly/yearly repeats show up correctly without
  the server doing anything special per-occurrence.
- Marking a recurring task's specific date "done" in this simple hosted UI
  isn't wired up per-occurrence (unlike the in-chat artifact version) — done
  here just applies to the whole task. If you want that finer-grained
  behavior on the hosted version too, let me know and I'll port it over.
