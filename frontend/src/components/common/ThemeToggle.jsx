import { Moon, Monitor, Sun } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();

  const index = Math.max(
    0,
    OPTIONS.findIndex((option) => option.value === mode)
  );
  const current = OPTIONS[index];
  const next = OPTIONS[(index + 1) % OPTIONS.length];
  const Icon = current.Icon;

  return (
    <button
      type="button"
      onClick={() => setMode(next.value)}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}.`}
      title={`${current.label} theme — click for ${next.label}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink-3 shadow-soft transition-colors hover:text-ink max-sm:h-8 max-sm:w-8"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
