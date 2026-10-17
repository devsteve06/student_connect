// src/config/identity.js
// -----------------------------------------------------------------------------
// Mirror of backend/utils/identity.js. The signup and admin forms preview the
// read-only institutional address the API will assign, so the slug/domain rules
// must match the server exactly. Keep the two files in step.
//
//   student     -> <slug>@students.<domain>
//   firm        -> <slug>@hr.<domain>
//   university  -> <slug>@registrar.<domain>
// -----------------------------------------------------------------------------

export const ROLE_EMAIL_SUBDOMAIN = {
  student: 'students',
  firm: 'hr',
  university: 'registrar'
};

export const EMAIL_HINTS = {
  student: 'alex.kamau@students.strathmore.edu',
  firm: 'nexus.labs@hr.strathmore.edu',
  university: 'jane.doe@registrar.strathmore.edu'
};

export function slugifyName(name) {
  const slug = String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return slug || 'user';
}

export function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
    .replace(/^\.+|\.+$/g, '');
}

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function isValidDomain(domain) {
  return DOMAIN_REGEX.test(normalizeDomain(domain));
}

export function institutionDomainFromEmail(email) {
  const domain = String(email || '').split('@')[1] || '';
  return normalizeDomain(domain.replace(/^(students|hr|registrar)\./, ''));
}

// Returns the previewed address, or '' when it cannot be built yet (no name or
// no domain chosen) so the form can show a placeholder instead.
export function previewAccountEmail({ role, name, domain }) {
  const subdomain = ROLE_EMAIL_SUBDOMAIN[role];
  const clean = normalizeDomain(domain);
  if (!subdomain || !name || !isValidDomain(clean)) return '';
  return `${slugifyName(name)}@${subdomain}.${clean}`;
}
