const { chromium } = require('playwright');

(async () => {
  console.log('Testing IndexedDB CACHE retrieval with Blob storage...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('[BROWSER]', msg.text()));

  await page.goto('http://localhost:5173/');

  // Step 1: Prime cache by loading
  console.log('1. Loading to ensure cache is populated...');
  await page.evaluate(async () => {
    const { ResilientModelLoader } = await import('/src/utils/resilientModelLoader.js');
    const loader = new ResilientModelLoader({ chunkSize: 32 * 1024 * 1024 });
    await loader.loadModelBuffer();
  });

  // Step 2: Test second load which should hit cache instantly!
  console.log('2. Testing second load (should hit cache)...');
  const cacheHitResult = await page.evaluate(async () => {
    const { ResilientModelLoader } = await import('/src/utils/resilientModelLoader.js');
    const loader = new ResilientModelLoader();
    const t0 = performance.now();
    let hitCache = false;
    const buf = await loader.loadModelBuffer({
      onProgress: (p) => {
        if (p.phase === 'cache') hitCache = true;
      }
    });
    const durationMs = performance.now() - t0;
    return {
      hitCache,
      durationMs,
      byteLength: buf.byteLength
    };
  });

  console.log('\n--- Cache Hit Result ---');
  console.log(JSON.stringify(cacheHitResult, null, 2));

  await browser.close();
})();
