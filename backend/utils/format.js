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
  return new Date().toISOString().slice(0, 10);
}
