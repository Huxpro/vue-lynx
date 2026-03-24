const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = `<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>`;
const dom = new JSDOM(html, { runScripts: "dangerously" });

// Polyfill fetch and other browser APIs if necessary
dom.window.fetch = () => Promise.resolve({ json: () => Promise.resolve({}) });
dom.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
dom.window.cancelAnimationFrame = (id) => clearTimeout(id);
dom.window.console.log = console.log;
dom.window.console.error = console.error;

const bundleCode = fs.readFileSync('bundle.js', 'utf8');

try {
  console.log("Evaluating bundle...");
  const script = new dom.window.document.createElement("script");
  script.textContent = bundleCode;
  dom.window.document.body.appendChild(script);
  console.log("Evaluation completed.");
} catch (e) {
  console.error("Error evaluating bundle:", e);
}
