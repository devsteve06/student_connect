// Single source of truth for decorative background imagery.
// Photos are served from Unsplash (free to use, no attribution required)
// and sized on the fly by appending query params, so the repo carries no
// binary assets. Each role gets a distinct image that matches its accent
// colour in roleTheme.js; public pages share the landing/auth images.
//
// Swap any `photo-...` id for another Unsplash image to re-skin a surface.

const sized = (id, w = 1920) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const roleBackgrounds = {
  student: { url: sized('photo-1523240795612-9a054b0db644'), position: 'center' },
  firm: { url: sized('photo-1497366754035-f200968a6e72'), position: 'center' },
  university: { url: sized('photo-1521587760476-6c12a4b040da'), position: 'center' },
  admin: { url: sized('photo-1550751827-4bd374c3f58b'), position: 'center' },
};

export const publicBackgrounds = {
  landing: { url: sized('photo-1521737604893-d14cc237f11d', 2000), position: 'center' },
  auth: { url: sized('photo-1541339907198-e08756dedf3f', 1280), position: 'center' },
};

export function getRoleBackground(role) {
  return roleBackgrounds[role] || roleBackgrounds.student;
}
