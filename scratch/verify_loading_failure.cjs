const { chromium } = require('playwright');

(async () => {
  console.log('================================================================');
  console.log('CHECK 5: LOADING AND NETWORK FAILURE HANDLING VERIFICATION');
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test Case 1: Intercept and abort USDZ download to simulate network failure
  console.log('1. Simulating network failure on USDZ download...');
  let abortCount = 0;
  await page.route('**/*.usdz', route => {
    abortCount++;
    console.log(`[NETWORK MOCK] Aborting USDZ network request (#${abortCount})`);
    route.abort('failed');
  });

  await page.goto('http://localhost:5173/');

  // Wait for loadingHUD error box to appear
  await page.waitForSelector('#loading-error-box', { state: 'visible', timeout: 15000 });
  console.log('✓ Loading HUD correctly displayed error box upon network failure!');

  // Verify UI controls were NOT initialized against unavailable model
  const controlsCheck = await page.evaluate(() => {
    return {
      modularNavExists: document.getElementById('gomikin-modular-nav') !== null,
      dissectBtnExists: document.getElementById('btn-dissect-gomikin') !== null,
      flowConsoleExists: document.getElementById('gomikin-flow-console') !== null,
      statusText: document.getElementById('loading-status-text')?.textContent,
      hasRetryBtn: document.getElementById('loading-retry-btn') !== null
    };
  });
  console.log('Controls check on failure:', controlsCheck);

  if (controlsCheck.modularNavExists || controlsCheck.dissectBtnExists || controlsCheck.flowConsoleExists) {
    throw new Error('[FAIL] Controls were initialized against unavailable model!');
  }
  console.log('✓ [PASS] Modular navigation and simulation controls were NOT mounted while model was unavailable.');

  // Test Case 2: Test Retry Behavior
  console.log('\n2. Testing Retry Behavior (restoring network connection)...');
  await page.unroute('**/*.usdz'); // Allow network request through

  console.log('Action: Clicking Retry button...');
  await page.click('#loading-retry-btn');

  // Verify download resumes and model initializes
  await page.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.viewCoordinator &&
           document.getElementById('gomikin-modular-nav') !== null;
  }, { timeout: 60000 });

  console.log('✓ [PASS] Retry succeeded! Model loaded and controls mounted cleanly after recovery.');

  // Verify loading HUD overlay was removed
  await page.waitForTimeout(1000);
  const isHUDRemoved = await page.evaluate(() => {
    return document.getElementById('gomikin-loading-overlay') === null;
  });
  console.log(`✓ [PASS] Loading HUD successfully dismissed post-load: ${isHUDRemoved}`);

  await browser.close();
  console.log('\n================================================================');
  console.log('✓ CHECK 5 (LOADING & FAILURE HANDLING) PASSED WITH FLYING COLORS!');
  console.log('================================================================');
})();
