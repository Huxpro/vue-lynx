// Cold select/update probe: fresh app → create1k → measure ONE select and
// ONE update10th via the same pointerdown→rAF-predicate method as cross.mjs.
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webCoreClientJs = require.resolve('@lynx-js/web-core/client.prod.js');
const webCoreRoot = path.resolve(path.dirname(webCoreClientJs), '../..');
const MIME = { '.js': 'text/javascript', '.css': 'text/css', '.bundle': 'application/octet-stream', '.wasm': 'application/wasm', '.json': 'application/json' };
const APP = { react: 'ui-react', vdom: 'ui-vdom', vapor: 'ui-vapor' };
const HTML = `<!doctype html><html><head><meta charset="utf-8">
<script type="module" src="/webcore/static/js/client.js"></script>
<link rel="stylesheet" href="/webcore/static/css/client.css"></head><body>
<script>
const hasClass = (el, cls) => ((el.getAttribute && el.getAttribute('class')) || '').split(/\\s+/).includes(cls);
const byClass = (cls) => { const out=[]; const walk=(n)=>{ if(!n) return; if(n.nodeType===1){ if(hasClass(n,cls)) out.push(n); if(n.shadowRoot) walk(n.shadowRoot);} for(const c of n.childNodes||[]) walk(c); }; walk(document.body); return out; };
let rowsEl = null;
const rows = () => { if(!rowsEl || !rowsEl.isConnected) rowsEl = byClass('rows')[0] ?? null; return rowsEl; };
const rowEls = () => { const c = rows(); if(!c) return []; const out=[]; for(const ch of c.children) if(hasClass(ch,'row')) out.push(ch); return out; };
const cellOf = (r, cls) => { for(const ch of r.children) if(hasClass(ch,cls)) return ch; return null; };
globalThis.mk = (u)=>{const v=document.createElement('lynx-view');v.setAttribute('url',u);v.style.cssText='display:block;width:800px;height:640px;';document.body.appendChild(v);return true;};
globalThis.rowCount = () => rowEls().length;
globalThis.labelAt = (i) => { const r = rowEls()[i]; return r ? cellOf(r,'col-label')?.textContent ?? null : null; };
globalThis.btnRect = (label)=>{ for(const el of byClass('btn-text')) if(el.textContent===label){const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};} return null; };
globalThis.cellRect = (i, cls)=>{ const r = rowEls()[i]; const cell = r && cellOf(r, cls); if(!cell) return null; const rect=cell.getBoundingClientRect(); return {x:rect.x+Math.min(20,rect.width/2), y:rect.y+rect.height/2}; };
globalThis.arm = (spec) => new Promise((resolve,reject)=>{
  let t0=null;
  window.addEventListener('pointerdown',()=>{t0=performance.now();},{capture:true,once:true});
  const deadline = performance.now()+60000;
  const check = () => spec.type==='dangerAt' ? (rowEls()[spec.index] && hasClass(rowEls()[spec.index],'danger'))
    : spec.type==='labelAt' ? labelAt(spec.index)===spec.equals
    : rowCount()===spec.value;
  const tick=()=>{ if(t0!=null && check()) return resolve(performance.now()-t0);
    if(performance.now()>deadline) return reject(new Error('timeout '+JSON.stringify(spec)));
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
globalThis.settle = () => new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,50))));
</script></body></html>`;
const server = http.createServer((req,res)=>{
  const url = new URL(req.url,'http://x');
  if(url.pathname==='/'){res.writeHead(200,{'content-type':'text/html'});res.end(HTML);return;}
  let fp=null;
  if(url.pathname.startsWith('/webcore/')) fp=path.join(webCoreRoot,url.pathname.slice(9));
  else for(const m of Object.keys(APP)){ const p='/'+m+'/'; if(url.pathname.startsWith(p)) fp=path.join(root,'apps',APP[m],'dist',url.pathname.slice(p.length)); }
  if(!fp||!fs.existsSync(fp)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':MIME[path.extname(fp)]??'application/octet-stream'});
  fs.createReadStream(fp).pipe(res);
});
await new Promise(r=>server.listen(8322,r));
const browser = await chromium.launch({headless:true, executablePath:'/opt/pw-browsers/chromium'});

async function probe(mode, round) {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8322/',{waitUntil:'load'});
  await page.evaluate((u)=>globalThis.mk(u),`http://127.0.0.1:8322/${mode}/main.web.bundle`);
  await page.waitForFunction(()=>globalThis.btnRect('Create 1,000 rows')!=null,undefined,{timeout:30000});
  await page.evaluate(()=>globalThis.settle());
  // create 1k (unmeasured)
  const b = await page.evaluate(()=>globalThis.btnRect('Create 1,000 rows'));
  await page.mouse.click(b.x,b.y);
  await page.waitForFunction(()=>globalThis.rowCount()===1000,undefined,{timeout:30000});
  await page.evaluate(()=>globalThis.settle());
  // cold select on row 2
  const armedSel = page.evaluate((s)=>globalThis.arm(s),{type:'dangerAt',index:1});
  const c = await page.evaluate(()=>globalThis.cellRect(1,'col-label'));
  await page.mouse.click(c.x,c.y);
  const selMs = await armedSel;
  await page.evaluate(()=>globalThis.settle());
  // cold update10th
  const before = await page.evaluate(()=>globalThis.labelAt(0));
  const armedUpd = page.evaluate((s)=>globalThis.arm(s),{type:'labelAt',index:0,equals:before+' !!!'});
  const u = await page.evaluate(()=>globalThis.btnRect('Update every 10th row'));
  await page.mouse.click(u.x,u.y);
  const updMs = await armedUpd;
  await page.close();
  console.log(`[cold ${round}] ${mode}: select=${selMs.toFixed(1)}ms update10th=${updMs.toFixed(1)}ms`);
}
for (let round = 1; round <= 3; round++) {
  for (const mode of ['react','vdom','vapor']) await probe(mode, round);
}
await browser.close(); server.close();
