import { useEffect, useMemo, useState } from 'react';
import ThemeContext, { THEME_MODES, THEME_STORAGE_KEY } from './themeContext';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function resolveDark(mode) {
  return mode === 'dark' || (mode === 'system' && prefersDark());
}

function applyTheme(mode) {
  const dark = resolveDark(mode);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#0b1120' : '#7c3aed');
}

export default function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      return THEME_MODES.includes(saved) ? saved : 'system';
    } catch {
      return 'system';
    }
  });

  useEffect(() => {
    applyTheme(mode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}