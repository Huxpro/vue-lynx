/**
 * Full-bleed iframe hosting the GenUI playground (examples/genui-playground),
 * whose static build is copied to docs/public/genui-playground by
 * scripts/prepare-playground.mjs.
 *
 * Trailing slash is required: Vercel `cleanUrls` would otherwise serve the app
 * at `/genui-playground` (no slash), and relative `static/...` asset URLs
 * would resolve against the site root and 404.
 */
export function PlaygroundEmbed() {
  return (
    <iframe
      title="Vue Lynx GenUI Playground"
      src="/genui-playground/"
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
