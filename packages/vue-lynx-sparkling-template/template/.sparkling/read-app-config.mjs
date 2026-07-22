const url = "file:///Users/bytedance/github/sparkling/template/sparkling-app-template/app.config.ts";
const mod = await import(url);
const cfg = (mod.default ?? mod);
const out = { lynxConfig: cfg.lynxConfig ?? {}, platform: cfg.platform ?? {}, paths: cfg.paths ?? {}, appName: cfg.appName };
process.stdout.write(JSON.stringify(out));