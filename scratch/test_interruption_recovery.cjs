const { chromium } = require('playwright');

(async () => {
  console.log('Testing ResilientModelLoader INTERRUPTION & RESUMPTION...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  // Intercept chunk 3 and drop it once
  let droppedChunk3 = false;
  await page.route('**/Gomikin/gomikin_disection.usdz', async route => {
    const range = route.request().headers()['range'];
    // Chunk 3 in 32MB chunks is ~67108864
    if (range && range.includes('bytes=67108864-') && !droppedChunk3) {
      droppedChunk3 = true;
      console.log(`[NETWORK MOCK] Intentionally dropping chunk 3 (${range}) to simulate network drop...`);
      route.abort('failed');
      return;
    }
    route.continue();
  });

  await page.goto('http://localhost:5173/?nocache=1');

  const recoveryResult = await page.evaluate(async () => {
    const { ResilientModelLoader } = await import('/src/utils/resilientModelLoader.js');
    const loader = new ResilientModelLoader({
      chunkSize: 32 * 1024 * 1024,
      maxRetriesPerChunk: 3
    });

    let retryObserved = false;
    let resumeStatusObserved = false;

    const buf = await loader.loadModelBuffer({
      onProgress: (p) => {
        if (p.retrying) retryObserved = true;
      },
      onStatus: (s) => {
        if (s.includes('Resuming at')) resumeStatusObserved = true;
      }
    });

    return {
      retryObserved,
      resumeStatusObserved,
      byteLength: buf.byteLength
    };
  });

  console.log('\n--- Recovery Test Result ---');
  console.log(JSON.stringify(recoveryResult, null, 2));

  await browser.close();
})();
