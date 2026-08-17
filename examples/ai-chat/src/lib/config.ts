/**
 * Base URL of the example's API server (`pnpm dev:server`).
 *
 * The Lynx bundle is served by rspeedy on :3000 while the API lives on
 * :3210 — there is no same-origin relative fetch on Lynx, so the base must
 * be absolute. When testing on a device in LynxExplorer, replace
 * `localhost` with your machine's LAN address.
 */
export const API_BASE = 'http://localhost:3210';
