// utils/identity.js
// -----------------------------------------------------------------------------
// Institutional email identity rules.
//
// Accounts no longer carry a free-text email. The address is derived from the
// account's display name plus the institution's email domain, with a
// role-specific subdomain in front:
//
//   student     -> <slug>@students.<domain>    alex.kamau@students.strathmore.edu
//   firm        -> <slug>@hr.<domain>          nexus.labs@hr.strathmore.edu
//   university  -> <slug>@registrar.<domain>    jane.doe@registrar.strathmore.edu
//
// The institution domain is recovered from a university's own registrar address
// (registrar@strathmore.edu, or someone@registrar.strathmore.edu -> strathmore.edu),
// so no extra column is needed and the derived value can never drift from what
// the seed/registration data already contains.
//
// The same rules are mirrored in frontend/src/config/identity.js so the signup
// forms can preview the read-only address the API will assign.
// -----------------------------------------------------------------------------

export const ROLE_EMAIL_SUBDOMAIN = {
  student: 'students',
  firm: 'hr',
  university: 'registrar'
};

// Deterministic local-part slug. Lowercase, every run of non-alphanumerics
// becomes a single dot, leading/trailing dots stripped. "Alex Kamau" ->
// "alex.kamau". Diacritics are folded so "Ngoû" -> "ngou". Falls back to "user"
// so the result is never empty.
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

// Tidy a user-supplied domain: trim, lowercase, drop a pasted scheme / path /
// leading '@' and any trailing dot. "https://Strathmore.EDU/" -> "strathmore.edu".
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

// Recover the institution's own domain from one of its email addresses by
// dropping a leading role subdomain ("students." / "hr." / "registrar.").
export function institutionDomainFromEmail(email) {
  const domain = String(email || '').split('@')[1] || '';
  return normalizeDomain(domain.replace(/^(students|hr|registrar)\./, ''));
}

// Build the institutional address for a new account. Throws on an unknown role
// or an unusable domain — callers translate that into a 400.
export function buildAccountEmail({ role, name, domain }) {
  const subdomain = ROLE_EMAIL_SUBDOMAIN[role];
  if (!subdomain) throw new Error(`No email identity rule for role: ${role}`);
  const clean = normalizeDomain(domain);
  if (!isValidDomain(clean)) throw new Error(`Invalid institution domain: ${domain}`);
  return `${slugifyName(name)}@${subdomain}.${clean}`;
}
