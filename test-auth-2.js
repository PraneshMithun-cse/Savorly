const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create a promise to wait for specific console messages
  page.on('console', async msg => {
    const text = msg.text()
    if (text.includes('auth-state.js')) {
      console.log('Firebase loaded correctly by layout -> auth-state.');
    } else {
        console.log('BROWSER LOG:', text);
    }
  });

  await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
  console.log('Homepage Loaded Check Completed.');
  
  await browser.close();
})();
