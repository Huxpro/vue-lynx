// Allow side-effect CSS imports from library modules. Bundlers (rspeedy /
// webpack) handle the actual CSS; vitest treats them as empty modules.
declare module '*.css' {}
