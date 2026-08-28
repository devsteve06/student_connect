import { Moon, Monitor, Sun } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function ThemeToggle({ compact = false }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-0.5 rounded-xl border border-line bg-surface-2 p-0.5 shadow-soft"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mode === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={label}
            onClick={() => setMode(value)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150 ${
              active ? 'bg-surface text-ink shadow-soft' : 'text-ink-4 hover:text-ink-2'
            }`}
          >
            <Icon className="h-4 w-4" />
            {!compact && <span className="hidden sm:inline">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}