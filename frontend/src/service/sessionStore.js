// src/service/sessionStore.js
// Single source of truth for client-side session persistence. Every portal
// (student, firm, university, admin) writes through here so the storage layout
// is uniform: 'token' + 'profile'. Legacy keys from older builds are wiped on
// clear so stale sessions can't linger.
//
// 'preview' is the admin's cross-portal preview ("view as") target. It rides
// beside the admin session — the token stays the admin's — and apiClient turns
// it into the X-View-As-* headers the API reads.
const TOKEN_KEY = 'token';
const PROFILE_KEY = 'profile';
const PREVIEW_KEY = 'preview';
const LEGACY_KEYS = ['admin'];

const safeParse = (raw) => {
  try {
    return JSON.parse(raw) || null;
  } catch {
    return null;
  }
};

export const sessionStore = {
  save(data) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(
      PROFILE_KEY,
      JSON.stringify({ id: data._id, name: data.name, email: data.email, role: data.role })
    );
  },

  clear() {
    [TOKEN_KEY, PROFILE_KEY, PREVIEW_KEY, ...LEGACY_KEYS].forEach((key) => localStorage.removeItem(key));
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  getProfile: () => safeParse(localStorage.getItem(PROFILE_KEY)),

  // Preview target: { role, id, name } of the account an admin is viewing.
  savePreview: (preview) => localStorage.setItem(PREVIEW_KEY, JSON.stringify(preview)),
  getPreview: () => safeParse(localStorage.getItem(PREVIEW_KEY)),
  clearPreview: () => localStorage.removeItem(PREVIEW_KEY),

  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY))
};

export default sessionStore;
