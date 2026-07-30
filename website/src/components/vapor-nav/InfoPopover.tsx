import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface InfoPopoverProps {
  /** Accessible name for the trigger button. */
  label: string;
  /** Where the panel opens relative to the trigger. */
  direction?: 'down' | 'up';
  /** Extra content rendered inside the trigger before the ⓘ glyph. */
  trigger?: ReactNode;
  /** Panel contents. */
  children: ReactNode;
  className?: string;
}

/**
 * Shared ⓘ affordance: a small trigger (optionally carrying extra content,
 * e.g. the coverage count) that toggles an explanatory popover. Closes on
 * outside pointerdown and Escape. Works on touch, where `title` tooltips
 * don't exist.
 */
export function InfoPopover({
  label,
  direction = 'down',
  trigger,
  children,
  className,
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={`info-popover${className ? ` ${className}` : ''}`}
      data-direction={direction}
    >
      <button
        type="button"
        className="info-popover__button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
        <svg
          className="info-popover__glyph"
          width="12"
          height="12"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
          <rect x="7.25" y="6.8" width="1.5" height="5" rx="0.75" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="info-popover__panel" role="note">
          {children}
        </div>
      )}
    </span>
  );
}

export default InfoPopover;
