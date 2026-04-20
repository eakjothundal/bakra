function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatLocal(d: Date) {
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function formatUTC(d: Date) {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

export interface CalendarEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  tzid?: string;
}

export function buildICS(ev: CalendarEvent): string {
  const tz = ev.tzid ?? 'America/Los_Angeles';
  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bakra Party//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${formatUTC(new Date())}`,
    `DTSTART;TZID=${tz}:${formatLocal(ev.start)}`,
    `DTEND;TZID=${tz}:${formatLocal(ev.end)}`,
    `SUMMARY:${esc(ev.title)}`,
  ];
  if (ev.location) lines.push(`LOCATION:${esc(ev.location)}`);
  if (ev.description) lines.push(`DESCRIPTION:${esc(ev.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(ev: CalendarEvent, filename: string) {
  const ics = buildICS(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const BAKRA_PARTY_EVENT: CalendarEvent = {
  uid: 'bakra-party-2026@eakjot.dev',
  title: 'Bakra Party 2026',
  description:
    "Eakjot's bakra party. Wear your GOAT's jersey — any sport. eakjot.dev/bakra",
  location: '2177 Donovan Dr, Lincoln, CA 95648',
  start: new Date(2026, 4, 19, 18, 0, 0),
  end: new Date(2026, 4, 20, 0, 0, 0),
  tzid: 'America/Los_Angeles',
};
