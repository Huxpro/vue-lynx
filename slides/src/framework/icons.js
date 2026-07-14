// Minimal lucide-style inline icons (stroke = currentColor) shared by the
// command palette and devtool. Returns SVG strings.
const S = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

export const ICONS = {
  search: S('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  slash: S('<path d="M8 20 16 4"/>'),
  arrowRight: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowLeft: S('<path d="M19 12H5M11 18l-6-6 6-6"/>'),
  first: S('<path d="M18 6 8 12l10 6zM6 5v14"/>'),
  last: S('<path d="M6 6l10 6L6 18zM18 5v14"/>'),
  present: S('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  grid: S('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  moon: S('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  languages: S('<path d="M4 5h7M9 3v2c0 4-2.5 7-6 8M5 9c0 2.6 2.6 5 6 6M12 20l4-9 4 9M14.5 16h5"/>'),
  bug: S('<rect x="8" y="6" width="8" height="12" rx="4"/><path d="M8 10H4M8 14H4M20 10h-4M20 14h-4M9 4l1.5 2M15 4l-1.5 2M12 18v3"/>'),
  eye: S('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="2.5"/>'),
  maximize: S('<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>'),
  layers: S('<path d="m12 3 9 5-9 5-9-5 9-5zM3 14l9 5 9-5"/>'),
  hash: S('<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>'),
  smartphone: S('<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2"/>'),
  tablet: S('<rect x="4.5" y="3.5" width="15" height="17" rx="2.2"/><path d="M11 17.5h2"/>'),
  monitor: S('<rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8.5 20h7M12 16v4"/>'),
  chevronRight: S('<path d="m9 6 6 6-6 6"/>'),
  x: S('<path d="M18 6 6 18M6 6l12 12"/>'),
  sparkles: S('<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.3L22 18l-2.1.7L19 21l-.9-2.3L16 18l2.1-.7z"/>'),
};

/** Wrap an icon string in a span for inline use. */
export function icon(name) {
  return `<span class="sys-ic">${ICONS[name] || ''}</span>`;
}
