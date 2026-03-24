const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let failed = false;

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('overlay unavailable') && !text.includes('NYI: profile')) {
      console.log('BROWSER ERROR (console):', text);
      failed = true;
    } else {
      console.log('BROWSER LOG:', text);
    }
  });
  page.on('pageerror', err => {
    console.log('BROWSER ERROR (pageerror):', err.toString());
    failed = true;
  });

  try {
    console.log("Navigating...");
    const timeout = new Promise((_, r) => setTimeout(() => r(new Error("Timeout waiting for load")), 5000));
    const nav = page.goto('http://127.0.0.1:3000/__web_preview?casename=main.web.bundle', { waitUntil: 'networkidle2' });
    await Promise.race([nav, timeout]);
    console.log("Page loaded!");
    
    // Check if lynx-view shadow root rendered something
    const lynxViewHTML = await page.$eval('lynx-view', el => el.shadowRoot ? el.shadowRoot.innerHTML : el.innerHTML).catch(() => null);
    
    if (lynxViewHTML === null || lynxViewHTML.length < 10) {
      console.log("RESULT: BROKEN (empty lynx-view)");
    } else if (failed) {
      console.log("RESULT: BROKEN (has errors)");
    } else {
      console.log("RESULT: OK");
    }
  } catch (e) {
    console.log("Exception:", e.message);
    console.log("RESULT: HANGING OR TIMEOUT");
  } finally {
    await browser.close();
  }
})();
