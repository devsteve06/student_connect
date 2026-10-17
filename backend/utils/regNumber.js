// utils/regNumber.js
// -----------------------------------------------------------------------------
// Admission / registration numbers are assigned by the server, never typed in.
// Format (matches the seeded convention, e.g. IT/0788/2023):
//
//   <COURSE CODE>/<4-digit sequence>/<YEAR>     e.g. CS/0001/2026
//
// The course code is the uppercase initials of the significant course words
// ("BSc. in Computer Science" -> CS). The sequence counts upwards per
// (university, course code, year), so consecutive students on the same course
// at the same institution in the same year get consecutive numbers.
//
// Generation takes a query function (pool or transaction client) so the read
// of the current maximum runs inside the caller's transaction, atomically with
// the insert that consumes the number.
// -----------------------------------------------------------------------------

// Degree prefixes and conjunctions carry no identity — dropped so
// "BSc. in Computer Science" and "Computer Science" both become "CS".
const FILLER_WORDS = new Set([
  'b',
  'ba',
  'bsc',
  'bachelors',
  'm',
  'ma',
  'msc',
  'masters',
  'in',
  'of',
  'and',
  'the'
]);

export function courseCode(course) {
  const words = String(course || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const significant = words.filter((w) => !FILLER_WORDS.has(w.toLowerCase()));
  // Fall back to every word when the course is nothing but fillers ("BSc").
  const letters = (significant.length > 0 ? significant : words)
    .map((w) => w[0].toUpperCase())
    .join('');
  return letters || 'STU';
}

export function formatRegNumber({ code, seq, year }) {
  return `${code}/${String(seq).padStart(4, '0')}/${year}`;
}

// Next free number for (university, course, year). Sequence numbers already in
// the database are read through `run` so callers can supply a transaction
// client; the UNIQUE constraint on students.reg_number remains the
// authoritative guard if two registrations race.
export async function generateRegNumber(run, { universityId, course, year = new Date().getFullYear() }) {
  const code = courseCode(course);
  const rows = (
    await run('SELECT reg_number FROM students WHERE university_id = $1 AND reg_number LIKE $2', [
      universityId,
      `${code}/%/${year}`
    ])
  ).rows;

  let max = 0;
  for (const row of rows) {
    const seq = Number.parseInt(String(row.reg_number).split('/')[1], 10);
    if (Number.isInteger(seq) && seq > max) max = seq;
  }
  return formatRegNumber({ code, seq: max + 1, year });
}
