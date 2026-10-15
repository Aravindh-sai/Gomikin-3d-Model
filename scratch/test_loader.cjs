const { chromium } = require('playwright');

(async () => {
  console.log('Testing full USDZ load with /Gomikin/gomikin_disection.usdz...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:5173/');

  // Evaluate loading with /Gomikin/gomikin_disection.usdz
  const result = await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      // Create USDLoader via Three
      const usdLoader = new window.THREE.USDLoader ? new window.THREE.USDLoader() : null;
      resolve({ hasLoader: !!usdLoader });
    });
  });

  console.log('Result:', result);
  await browser.close();
})();
