import { createContext } from 'react';

export const THEME_MODES = ['system', 'light', 'dark'];
export const THEME_STORAGE_KEY = 'student-connect-theme';

const ThemeContext = createContext(null);

export default ThemeContext;