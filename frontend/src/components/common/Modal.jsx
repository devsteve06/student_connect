import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, size = 'md' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widths[size]} animate-scale-in overflow-hidden rounded-2xl border border-line bg-surface shadow-pop`}
      >
        {(title || subtitle) && (
          <header className="flex items-start justify-between gap-4 border-b border-line-2 bg-surface-2/60 px-6 py-4">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-ink">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-ink-5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-lg p-1.5 text-ink-5 transition-colors hover:bg-surface-4/60 hover:text-ink-3"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </header>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-line-2 bg-surface-2/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}