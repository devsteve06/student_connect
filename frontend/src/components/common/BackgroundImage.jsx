// Decorative, non-semantic background photo layer.
// Renders a lazy-loaded <img> plus an optional scrim/overlay on top, both
// absolutely positioned to fill a `relative overflow-hidden` parent. It is
// aria-hidden and pointer-events-none so it never affects layout, focus or
// screen readers. A failed remote image hides itself, leaving the parent's
// own background/gradients as a graceful fallback.

export default function BackgroundImage({
  src,
  position = 'center',
  overlayClassName = '',
  priority = false,
  className = '',
}) {
  if (!src) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <img
        src={src}
        alt=""
        draggable={false}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
        className="h-full w-full select-none object-cover"
        style={{ objectPosition: position }}
      />
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}
