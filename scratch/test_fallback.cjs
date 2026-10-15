const { chromium } = require('playwright');

(async () => {
  console.log('Testing ResilientModelLoader FALLBACK to Vercel Cloud Storage...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  // Intercept local path and return 404 to simulate Vercel deployment where local asset is absent
  await page.route('**/Gomikin/gomikin_disection.usdz', route => {
    console.log('[MOCK ROUTE] Simulating 404 on local asset:', route.request().url());
    route.fulfill({
      status: 404,
      contentType: 'text/html',
      body: '<html><body>404 Not Found</body></html>'
    });
  });

  await page.goto('http://localhost:5173/');

  const testResult = await page.evaluate(async () => {
    const { ResilientModelLoader } = await import('/src/utils/resilientModelLoader.js');

    // Bypass cache for clean network fallback test
    const loader = new ResilientModelLoader({
      chunkSize: 32 * 1024 * 1024
    });

    const events = [];
    const buffer = await loader.loadModelBuffer({
      onProgress: (p) => {
        events.push({ type: 'progress', source: p.sourceLabel, pct: p.percent });
      },
      onStatus: (s) => {
        events.push({ type: 'status', text: s });
      }
    });

    return {
      byteLength: buffer.byteLength,
      eventsCount: events.length,
      sampleEvents: events.slice(0, 10)
    };
  });

  console.log('\n--- Fallback Test Result ---');
  console.log(JSON.stringify(testResult, null, 2));
  await browser.close();
})();
