const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('BROWSER LOG:', msg.type().toUpperCase(), msg.text());
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://127.0.0.1:8080/workspace.html', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.log('GOTO ERROR:', err.message);
  }

  await browser.close();
})();
