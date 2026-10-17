// src/config/regNumber.js
// -----------------------------------------------------------------------------
// Mirror of backend/utils/regNumber.js. The signup form previews the admission
// number the API will assign (e.g. CS/0001/2026), so the course-code rule must
// match the server exactly. Keep the two files in step.
//
//   <COURSE CODE>/<4-digit sequence>/<YEAR>
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
  const letters = (significant.length > 0 ? significant : words)
    .map((w) => w[0].toUpperCase())
    .join('');
  return letters || 'STU';
}

// Example number for the hint shown on the form. The real sequence is chosen
// server-side at signup, so this is only ever labelled as an example.
export function previewRegNumber(course, year = new Date().getFullYear()) {
  return `${courseCode(course)}/0001/${year}`;
}
