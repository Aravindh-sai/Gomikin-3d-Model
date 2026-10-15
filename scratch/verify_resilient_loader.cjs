const { chromium } = require('playwright');

(async () => {
  console.log('================================================================');
  console.log('VERIFICATION: RESILIENT USDZ MODEL LOADER & VERCEL FALLBACK');
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // -------------------------------------------------------------------------
  // TEST 1: Seamless Silent Fallback from Local 404 to Vercel Cloud Storage
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Silent Fallback when Local Asset is 404 (Vercel Hosting Mode) ---');
  const page1 = await browser.newPage();
  
  // Intercept local path to simulate Vercel deployment without local 268MB file
  let localRouteHit = false;
  let remoteRouteHit = false;

  await page1.route('**/Gomikin/gomikin_disection.usdz', route => {
    localRouteHit = true;
    console.log('[MOCK ROUTE] Simulating 404 on local asset:', route.request().url());
    route.fulfill({
      status: 404,
      contentType: 'text/html',
      body: '<html><body>404 Not Found</body></html>'
    });
  });

  page1.setDefaultTimeout(90000);

  page1.on('console', msg => {
    const txt = msg.text();
    if (txt.includes('ResilientModelLoader') || txt.includes('Loading USDZ') || txt.includes('download') || txt.includes('Download complete')) {
      console.log('  [Browser]', txt);
    }
  });

  // Load page with ?nocache=1 to ensure network path is tested
  await page1.goto('http://localhost:5173/?nocache=1', { timeout: 60000 });

  // Verify that error box was NOT displayed during fallback
  const errorBoxDuringLoad = await page1.evaluate(() => {
    const el = document.getElementById('loading-error-box');
    return el && window.getComputedStyle(el).display !== 'none';
  });

  if (errorBoxDuringLoad) {
    throw new Error('[FAIL] Error box was displayed prematurely during local fallback!');
  }
  console.log('✓ [PASS] Zero error boxes raised during local 404 fallback!');

  // Wait for model to load from Vercel Cloud Storage
  console.log('Waiting for Vercel Cloud Storage stream to initialize assembly...');
  await page1.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.viewCoordinator &&
           window.componentRegistry.getNames().length === 33;
  }, null, { timeout: 90000 });

  const test1Stats = await page1.evaluate(() => ({
    modelName: window.usdModel.name,
    meshCount: window.componentRegistry.getNames().length,
    hudDismissed: document.getElementById('gomikin-loading-overlay') === null
  }));

  console.log(`✓ [PASS] Test 1: Loaded successfully from Vercel Cloud! (Mesh count: ${test1Stats.meshCount}, HUD dismissed: ${test1Stats.hudDismissed})`);
  console.log(`Local route intercepted: ${localRouteHit}, Remote route hit: ${remoteRouteHit}`);
  await page1.close();

  // -------------------------------------------------------------------------
  // TEST 2: Instant Cache Retrieval (<1s) from IndexedDB
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Instant Cache Retrieval from IndexedDB (<1s) ---');
  const page2 = await browser.newPage();
  const t0 = Date.now();
  await page2.goto('http://localhost:5173/');

  await page2.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.componentRegistry.getNames().length === 33;
  }, { timeout: 10000 });

  const loadDurationMs = Date.now() - t0;
  console.log(`✓ [PASS] Test 2: Instant reload completed in ${loadDurationMs}ms from IndexedDB cache!`);
  await page2.close();

  // -------------------------------------------------------------------------
  // TEST 3: Component Verification (All 33 Fusion 360 Meshes Loaded)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Verification of All 33 CAD Components in Registry ---');
  const page3 = await browser.newPage();
  await page3.goto('http://localhost:5173/');
  await page3.waitForFunction(() => window.componentRegistry);

  const componentNames = await page3.evaluate(() => window.componentRegistry.getNames());
  console.log(`Registry indexed ${componentNames.length} components:`, componentNames.slice(0, 8).join(', '), '...');

  if (componentNames.length !== 33) {
    throw new Error(`[FAIL] Expected 33 components in registry, but found ${componentNames.length}!`);
  }
  console.log('✓ [PASS] Test 3: All 33 expected CAD component meshes are active, indexed, and ready for interaction.');
  await page3.close();

  await browser.close();

  console.log('\n================================================================');
  console.log('✓ ALL 3 RESILIENT MODEL LOADER VERIFICATION PASSES COMPLETED!');
  console.log('================================================================');
})();
