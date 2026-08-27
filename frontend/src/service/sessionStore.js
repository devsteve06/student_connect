// src/service/sessionStore.js
// Single source of truth for client-side session persistence.
// Every portal (student, firm, university, admin) writes through here so
// the storage layout is uniform: 'token' + 'profile'. Legacy keys from
// older builds are wiped on clear so stale sessions can't linger.
const TOKEN_KEY = 'token';
const PROFILE_KEY = 'profile';
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
    [TOKEN_KEY, PROFILE_KEY, ...LEGACY_KEYS].forEach((key) => localStorage.removeItem(key));
  },

  getToken: () => localStorage.getItem(TOKEN_KEY),

  getProfile: () => safeParse(localStorage.getItem(PROFILE_KEY)),

  isAuthenticated: () => Boolean(localStorage.getItem(TOKEN_KEY))
};

export default sessionStore;
