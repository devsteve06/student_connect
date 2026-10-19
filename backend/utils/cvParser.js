// utils/cvParser.js
// -----------------------------------------------------------------------------
// Best-effort parser that maps the text extracted from an uploaded CV onto the
// `student_cvs` JSON shape. It is intentionally heuristic and dependency-free:
// CVs are laid out in wildly different ways, so the goal is a useful draft the
// student can correct in the wizard — not a perfect transcription.
//
// Strategy: find the standard section headings, then treat the lines under each
// heading as that section's content, with small per-section heuristics for the
// structured fields (year, company, dates, ...).
// -----------------------------------------------------------------------------

// Heading text -> canonical section id. Matching is case-insensitive and
// tolerant of trailing punctuation ("Education:", "WORK EXPERIENCE").
const HEADINGS = [
  [/(professional\s+)?summary|^profile|^objective|^about( me)?$/, 'summary'],
  [/^educations?$|^academic|^qualifications?$/, 'education'],
  [/^(work\s+)?experience$|^employment|^work history$|^internships?$/, 'experience'],
  [/^skills?$|^technical skills$|^core competencies$|^competencies$|^technologies$/, 'skills'],
  [/^projects?$|^personal projects$|^key projects$/, 'projects'],
  [/^certifications?$|^certificates?$|^licen[cs]es?$|^awards?$|^achievements?$/, 'certifications']
];

const DEGREE = /\b(b\.?sc|b\.?a|b\.?eng|b\.?com|bachelor[a-z]*|m\.?sc|m\.?a|m\.?eng|mba|master[a-z]*|ph\.?d|doctor[a-z]*|diploma|hnd|higher diploma|certificate|kcse|ksce|form (four|4))\b/i;
const INSTITUTION = /\b(university|college|institute|school|polytechnic|academy|campus)\b/i;
const YEAR = /\b(19|20)\d{2}\b/;
const DATE_RANGE = /\b((19|20)\d{2})\s*[-–—to]+\s*((19|20)\d{2}|present|current|now|date)\b/i;
const EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const URL = /https?:\/\/\S+/i;

const BULLET = /^[•▪◦‣·*\-–—]\s*/;

// A line is a heading when, after trimming punctuation and case, it matches one
// of the known phrases and is short enough to be a label rather than a sentence.
export function headingFor(line) {
  const cleaned = line
    .replace(BULLET, '')
    .replace(/[:\s]+$/g, '')
    .trim()
    .toLowerCase();
  if (!cleaned || cleaned.length > 32 || cleaned.split(/\s+/).length > 4) return null;
  for (const [pattern, id] of HEADINGS) {
    if (pattern.test(cleaned)) return id;
  }
  return null;
}

function cleanLine(line) {
  return line.replace(BULLET, '').replace(/\s+/g, ' ').trim();
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word.length <= 2 && word === word.toLowerCase()
        ? word
        : word[0].toUpperCase() + word.slice(1)
    )
    .join(' ');
}

// Split the raw CV text into a header block (before the first heading) and one
// entry per recognised section.
export function splitCvSections(text) {
  const lines = String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const header = [];
  const sections = {};
  let current = null;
  for (const line of lines) {
    const heading = headingFor(line);
    if (heading) {
      current = heading;
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (current) sections[current].push(cleanLine(line));
    else header.push(cleanLine(line));
  }
  return { header, sections };
}

// One entry per non-bulleted line; following bullet lines attach to it as
// description text. Enough to make "Institution — Degree (2021)" and a couple
// of bullet points read correctly.
function groupEntries(lines) {
  const entries = [];
  for (const line of lines) {
    const isBullet = BULLET.test(line);
    if (isBullet && entries.length > 0) {
      const last = entries[entries.length - 1];
      last.description = last.description ? `${last.description}\n${cleanLine(line)}` : cleanLine(line);
    } else {
      entries.push({ raw: cleanLine(line), description: '' });
    }
  }
  return entries;
}

function parseEducation(lines) {
  return groupEntries(lines).map(({ raw, description }) => {
    const year = (raw.match(YEAR) || [])[0] ?? '';
    const institution = raw.match(INSTITUTION);
    const degree = raw.match(DEGREE);
    // Keep the whole line when the heuristics cannot split it cleanly, so the
    // student never loses text they typed.
    let school = institution ? raw : '';
    let degreeText = degree ? (degree[0] ?? '') : '';
    if (school && degreeText) {
      // Trim the matched fragments out of the raw line for the other field.
      school = raw.replace(/\s*[|,\-–—]\s*.*$/, '') || raw;
      degreeText = degreeText.trim();
    }
    return {
      school: school || raw,
      degree: degreeText,
      year,
      description: description || (school ? '' : raw)
    };
  });
}

function parseExperience(lines) {
  return groupEntries(lines).map(({ raw, description }) => {
    const range = raw.match(DATE_RANGE);
    const start = range ? range[1] : (raw.match(YEAR) || [])[0] ?? '';
    const end = range ? range[3] : '';
    let company = '';
    let role = raw;
    const at = raw.match(/^(.*?)\s+(?:at|@)\s+(.*)$/i);
    const split = raw.split(/\s+[|–—]\s+|\s+-\s+/);
    if (at) {
      role = at[1].trim();
      company = at[2].trim();
    } else if (split.length > 1) {
      role = split[0].trim();
      company = split.slice(1).join(' — ').replace(DATE_RANGE, '').replace(YEAR, '').trim();
    }
    return {
      company: company.replace(/[,;]+$/, ''),
      role: role.replace(/[,;]+$/, ''),
      start: start || '',
      end: end || '',
      description
    };
  });
}

function parseSkills(lines) {
  const categories = [];
  const loose = [];
  for (const line of lines) {
    const labelled = line.match(/^([^:]{2,30}):\s*(.+)$/);
    if (labelled) {
      categories.push({
        category: labelled[1].trim(),
        items: labelled[2]
          .split(/[,;|]/)
          .map((item) => item.trim())
          .filter(Boolean)
      });
    } else {
      loose.push(
        ...line
          .split(/[,;|]/)
          .map((item) => cleanLine(item))
          .filter(Boolean)
      );
    }
  }
  if (loose.length > 0) {
    categories.push({ category: 'General', items: loose });
  }
  return categories;
}

function parseProjects(lines) {
  return groupEntries(lines).map(({ raw, description }) => {
    const link = (raw.match(URL) || [])[0] ?? '';
    return {
      name: raw.replace(URL, '').replace(/[,;]+$/, '').trim() || 'Project',
      link,
      description
    };
  });
}

function parseCertifications(lines) {
  return groupEntries(lines).map(({ raw, description }) => {
    const year = (raw.match(YEAR) || [])[0] ?? '';
    const issuer = raw.match(/\b(issued by|by)\b\s+(.+)$/i);
    return {
      title: raw.replace(/\s*\bby\b.*$/i, '').replace(YEAR, '').replace(/[,;()]+/g, ' ').trim() || raw,
      issuer: issuer ? issuer[2].replace(/[,;()]+/g, '').trim() : '',
      year,
      description
    };
  });
}

// Text the student typed before the first heading is usually their name and
// contact details, sometimes with a one-line headline.
function parseHeader(header, fallbackName) {
  const joined = header.join(' | ');
  const email = (joined.match(EMAIL) || [])[0] ?? '';
  const phone = (joined.match(PHONE) || [])[0] ?? '';
  const links = (joined.match(URL) || [])[0] ?? '';
  const nameLine = header.find(
    (line) =>
      !EMAIL.test(line) &&
      !PHONE.test(line) &&
      !URL.test(line) &&
      line.replace(BULLET, '').trim().split(/\s+/).length <= 5
  );
  const name = nameLine ? titleCase(nameLine.replace(BULLET, '').trim()) : fallbackName;
  return {
    name,
    email,
    phone: phone.replace(/\s+/g, ''),
    location: '',
    links
  };
}

// Public entry point: text + original filename -> CV payload for the DB.
export function parseCvText(rawText, filename = '') {
  const { header, sections } = splitCvSections(rawText);
  const fallbackName = filename
    ? titleCase(filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '))
    : '';

  const personalInfo = parseHeader(header, fallbackName);
  const education = sections.education ? parseEducation(sections.education) : [];
  const experience = sections.experience ? parseExperience(sections.experience) : [];
  const skills = sections.skills ? parseSkills(sections.skills) : [];
  const projects = sections.projects ? parseProjects(sections.projects) : [];
  const certifications = sections.certifications
    ? parseCertifications(sections.certifications)
    : [];

  // Paragraphs that never reached a recognised section are kept as the
  // summary so no readable text is silently dropped.
  let professionalSummary = sections.summary ? sections.summary.join(' ') : '';
  const unstructured = Object.keys(sections).length === 0;
  if (!professionalSummary && unstructured) {
    professionalSummary = header.slice(1).join(' ');
  }

  const title = personalInfo.name
    ? `${personalInfo.name} — CV`
    : filename || 'Uploaded CV';

  return {
    title,
    personalInfo,
    professionalSummary,
    education,
    experience,
    skills,
    projects,
    certifications
  };
}
