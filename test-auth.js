const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  console.log('Page loaded');
  await browser.close();
})();
