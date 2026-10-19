// utils/format.js

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Formats a DB date value into the "May 22, 2026" shape the frontend renders.
// Accepts a JS Date, an ISO string, or a 'YYYY-MM-DD' string (tz-safe).
export function formatDate(value) {
  if (value == null) return null;

  let year, month, day;
  if (value instanceof Date) {
    year = value.getUTCFullYear();
    month = value.getUTCMonth();
    day = value.getUTCDate();
  } else {
    const s = String(value);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      year = +m[1];
      month = +m[2] - 1;
      day = +m[3];
    } else {
      const dt = new Date(s);
      if (Number.isNaN(dt.getTime())) return s;
      year = dt.getUTCFullYear();
      month = dt.getUTCMonth();
      day = dt.getUTCDate();
    }
  }
  return `${MONTHS[month]} ${String(day).padStart(2, '0')}, ${year}`;
}

// Returns today's date as 'YYYY-MM-DD' for inserting into DATE columns.
export function todayISO() {
  return toDateOnly(new Date());
}

// Normalises a DATE column to 'YYYY-MM-DD'.
// node-postgres parses DATE as *local* midnight, so feeding that Date to
// formatDate (which reads UTC parts, correctly for TIMESTAMPTZ) lands on the
// previous day on hosts east of UTC — Nairobi applications showed up a day
// early. Local parts are the right answer for a date without a time.
export function toDateOnly(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

// Returns the date `days` from today as 'YYYY-MM-DD', in the server's local
// calendar (matching how DATE columns are read back, see toDateOnly). Used to
// stamp the interview slot when a firm moves an application to 'Interviewing' —
// the applicant gets a week's notice.
export function isoInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}
