import BackgroundImage from './BackgroundImage';
import { getRoleBackground } from '../../config/backgrounds';

// Image-backed page header used across the role dashboards. Wraps the
// existing eyebrow/title/subtitle markup and paints the role's background
// photo behind it. The scrim is built from the semantic `surface` token, so
// it is a light wash in light mode and a dark wash in dark mode — the same
// photo stays legible in both without a second asset.

export default function PageBanner({ role = 'student', children, className = '' }) {
  const bg = getRoleBackground(role);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-soft ${className}`}
    >
      <BackgroundImage src={bg.url} position={bg.position} priority />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-surface/45"
        aria-hidden="true"
      />
      <div className="relative z-10 p-5 sm:p-6">{children}</div>
    </div>
  );
}
