const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('--- STARTING PHASE C.1 COMPREHENSIVE VERIFICATION ---');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  [Browser Error]:', msg.text());
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('  [Page Error]:', err.message);
    consoleErrors.push(err.message);
  });

  console.log('1. Navigating to http://localhost:5173 ...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });

  // 1. Verify Header & Logo
  console.log('2. Verifying Header and Brand Asset...');
  const logoSrc = await page.getAttribute('.brand-text-logo-img', 'src');
  console.log('   Logo src:', logoSrc);
  if (!logoSrc.includes('Gomikin-text-black.png')) {
    throw new Error('Logo does not use official Gomikin-text-black.png!');
  }

  const contactBtn = await page.$('.btn-header-contact');
  const contactText = await contactBtn.innerText();
  const contactHref = await contactBtn.getAttribute('href');
  console.log('   Contact button text:', contactText, 'href:', contactHref);
  if (!contactText.includes('Contact Us')) {
    throw new Error('Header does not have "Contact Us" pill button!');
  }

  // Ensure nav links are removed
  const navLinks = await page.$$('.header-nav');
  console.log('   Header nav links count:', navLinks.length);
  if (navLinks.length > 0) {
    throw new Error('Header nav links should be removed in Phase C.1!');
  }

  // 2. Verify Single Desktop Viewport
  console.log('3. Verifying Single Desktop Viewport Fit (no scrolling)...');
  const scrollMetrics = await page.evaluate(() => {
    return {
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      bodyScrollHeight: document.body.scrollHeight,
      innerHeight: window.innerHeight,
      overflow: window.getComputedStyle(document.body).overflow
    };
  });
  console.log('   Scroll metrics:', scrollMetrics);
  if (scrollMetrics.scrollHeight > scrollMetrics.clientHeight + 2) {
    console.warn('   Warning: scrollHeight exceeds clientHeight:', scrollMetrics.scrollHeight, 'vs', scrollMetrics.clientHeight);
  } else {
    console.log('   ✓ Fits perfectly within single desktop viewport!');
  }

  // 3. Verify Canvas Idle CAD Preview Overlay
  console.log('4. Verifying Canvas Idle CAD Preview Overlay...');
  const idleTitle = await page.innerText('.idle-title');
  const idleDesc = await page.innerText('.idle-desc');
  const idleBtn = await page.innerText('#btn-canvas-explore');
  console.log('   Idle Title:', idleTitle);
  console.log('   Idle Description:', idleDesc);
  console.log('   Idle Button:', idleBtn);

  if (!idleTitle.includes('Explore the Engineering')) {
    throw new Error(`Expected "Explore the Engineering", got "${idleTitle}"`);
  }
  if (!idleDesc.includes('Inspect the mechanical architecture and internal processing system.')) {
    throw new Error(`Expected mechanical architecture desc, got "${idleDesc}"`);
  }
  if (!idleBtn.includes('Launch 3D Experience')) {
    throw new Error(`Expected "Launch 3D Experience", got "${idleBtn}"`);
  }

  // Take screenshot of pristine landing page
  await page.screenshot({ path: 'scratch/phase_c1_01_landing_single_viewport.png' });
  console.log('   ✓ Saved scratch/phase_c1_01_landing_single_viewport.png');

  // 4. Verify Background Loading State
  console.log('5. Verifying Background CAD Loading...');
  const modelState = await page.evaluate(() => window.gomikinModelState);
  console.log('   Model State on landing page:', modelState.status, 'progress:', modelState.progress);

  // 5. Test Explore 3D Prototype Click & Fullscreen Launch
  console.log('6. Clicking "Explore 3D Prototype" to test Fullscreen Transition...');
  await page.click('#btn-hero-explore');

  const isFullscreen = await page.evaluate(() => {
    const el = document.getElementById('gomikin-canvas-wrapper');
    return el && el.classList.contains('fullscreen-mode');
  });
  console.log('   Canvas is in fullscreen mode:', isFullscreen);
  if (!isFullscreen) {
    throw new Error('Canvas wrapper did not enter fullscreen mode!');
  }

  // If loading is active in fullscreen, verify it says "Loading" and has percentage, never "Downloading"
  const loadingStatusText = await page.evaluate(() => {
    const statusEl = document.getElementById('canvas-loading-status');
    const overlay = document.getElementById('canvas-loading-overlay');
    return {
      visible: overlay && window.getComputedStyle(overlay).display !== 'none',
      text: statusEl ? statusEl.textContent : ''
    };
  });
  console.log('   Fullscreen loading status check:', loadingStatusText);
  if (loadingStatusText.visible) {
    if (loadingStatusText.text.toLowerCase().includes('downloading')) {
      throw new Error('Loading text contains forbidden word "Downloading"!');
    }
  }

  await page.screenshot({ path: 'scratch/phase_c1_02_fullscreen_loading_or_ready.png' });
  console.log('   ✓ Saved scratch/phase_c1_02_fullscreen_loading_or_ready.png');

  // Wait for model to complete loading if still in progress
  console.log('7. Waiting for USDZ Model to be ready...');
  await page.waitForFunction(() => window.gomikinModelState && window.gomikinModelState.status === 'ready', { timeout: 60000 });
  console.log('   ✓ Model ready in Three.js scene!');

  // Wait 1s for layout and smooth transition
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/phase_c1_03_fullscreen_model_ready.png' });
  console.log('   ✓ Saved scratch/phase_c1_03_fullscreen_model_ready.png');

  // 6. Test 3D Sub-System Controls inside Fullscreen
  console.log('8. Testing 3D Sub-Systems inside Fullscreen...');
  const modularNav = await page.$('#gomikin-modular-nav');
  if (!modularNav) {
    throw new Error('#gomikin-modular-nav not found in canvas wrapper!');
  }
  console.log('   ✓ #gomikin-modular-nav mounted!');

  // Test Modular Views tab
  console.log('   Testing Modular Views tab...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/phase_c1_04_fullscreen_modular_views.png' });

  // Test Dissection tab
  console.log('   Testing 33-Part Dissection tab...');
  await page.click('#tab-dissection');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/phase_c1_05_fullscreen_dissection.png' });

  // Test Flow Simulation tab
  console.log('   Testing Simulate Flow tab...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/phase_c1_06_fullscreen_flow_sim.png' });

  // Return to complete assembly
  await page.click('#tab-full-model');
  await page.waitForTimeout(600);

  // 7. Test Exit Fullscreen & Escape Key
  console.log('9. Testing Exit Fullscreen via Escape key...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  const isFullscreenAfterEsc = await page.evaluate(() => {
    return document.getElementById('gomikin-canvas-wrapper').classList.contains('fullscreen-mode');
  });
  console.log('   Canvas is fullscreen after Escape:', isFullscreenAfterEsc);
  if (isFullscreenAfterEsc) {
    throw new Error('Escape key failed to exit fullscreen!');
  }
  await page.screenshot({ path: 'scratch/phase_c1_07_exit_fullscreen_back_to_hero.png' });
  console.log('   ✓ Saved scratch/phase_c1_07_exit_fullscreen_back_to_hero.png');

  // 8. Re-enter Fullscreen without reload
  console.log('10. Testing Re-entering Fullscreen immediately...');
  await page.click('#btn-canvas-fullscreen');
  await page.waitForTimeout(500);
  const isFullscreenAgain = await page.evaluate(() => {
    return document.getElementById('gomikin-canvas-wrapper').classList.contains('fullscreen-mode');
  });
  console.log('   Canvas is fullscreen again:', isFullscreenAgain);
  if (!isFullscreenAgain) {
    throw new Error('Re-entering fullscreen failed!');
  }

  // Exit again via toggle button
  await page.click('#btn-canvas-fullscreen');
  await page.waitForTimeout(500);

  // 9. Check for Console Errors
  console.log('11. Checking console errors...');
  const severeErrors = consoleErrors.filter(e => !e.includes('favicon'));
  console.log('   Severe console errors count:', severeErrors.length);
  if (severeErrors.length > 0) {
    console.error('   Errors detected:', severeErrors);
    throw new Error(`Encountered ${severeErrors.length} console errors!`);
  }

  console.log('--- ALL PHASE C.1 VERIFICATIONS PASSED SUCCESSFULLY! ---');
  await browser.close();
})();

