import { useEffect, useSyncExternalStore, Children, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { renderModeStore, type RenderMode } from './render-mode-store';
import { useModePulse } from './use-mode-pulse';

interface ModeTabProps {
  mode: RenderMode;
  children?: ReactNode;
}

/** One panel of a <ModeTabs> group. */
export function ModeTab({ children }: ModeTabProps) {
  return <>{children}</>;
}

interface ModeTabsProps {
  children?: ReactNode;
}

/**
 * Mode-aware code tabs: a VDOM/Vapor tab group wired to the global renderer
 * preference. The nav switch drives the active tab, and clicking a tab
 * drives the global preference — one state, two handles. Mounted groups
 * register with the store so the nav control knows this page has
 * mode-aware content.
 *
 * ```mdx
 * <ModeTabs>
 *   <ModeTab mode="vdom">…</ModeTab>
 *   <ModeTab mode="vapor">…</ModeTab>
 * </ModeTabs>
 * ```
 */
export function ModeTabs({ children }: ModeTabsProps) {
  const mode = useSyncExternalStore(
    renderModeStore.subscribe,
    renderModeStore.getSnapshot,
    renderModeStore.getServerSnapshot,
  );
  const pulse = useModePulse(mode);

  useEffect(() => renderModeStore.registerModeTabs(), []);

  const panels = Children.toArray(children).filter(
    (child): child is ReactElement<ModeTabProps> =>
      isValidElement(child) && Boolean((child.props as ModeTabProps).mode),
  );
  const active = panels.find((panel) => panel.props.mode === mode) ?? panels[0];

  return (
    <div className="mode-tabs" data-mode={mode} data-pulse={pulse || undefined}>
      <div className="mode-tabs__header" role="tablist" aria-label="Renderer">
        {(['vdom', 'vapor'] as const).map((candidate) => (
          <button
            type="button"
            role="tab"
            key={candidate}
            aria-selected={mode === candidate}
            onClick={() => renderModeStore.setMode(candidate)}
          >
            {candidate === 'vdom' ? 'VDOM' : 'Vapor'}
          </button>
        ))}
      </div>
      <div className="mode-tabs__panel" role="tabpanel">
        {active}
      </div>
    </div>
  );
}

export default ModeTabs;
