/**
 * Full-bleed iframe hosting the GenUI playground (examples/genui-playground),
 * whose static build is copied to docs/public/genui-playground by
 * scripts/prepare-playground.mjs.
 */
export function PlaygroundEmbed() {
  return (
    <iframe
      title="Vue Lynx GenUI Playground"
      src="/genui-playground/index.html"
      style={{
        display: 'block',
        width: '100%',
        height: 'calc(100vh - var(--rp-nav-height, 72px))',
        border: 'none',
      }}
      allow="clipboard-write"
    />
  );
}

export default PlaygroundEmbed;
