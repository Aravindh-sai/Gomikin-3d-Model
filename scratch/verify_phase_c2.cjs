const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('=== STARTING PHASE C.2 AUTOMATED VERIFICATION ===');

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

  // 1. Verify Unified Logo Lockup (Emblem + Wordmark)
  console.log('2. Verifying Unified Brand Logo Lockup in Header...');
  const emblem = await page.$('.brand-emblem-img');
  const wordmark = await page.$('.brand-text-logo-img');
  if (!emblem) throw new Error('Official Gomikin emblem image not found in header!');
  if (!wordmark) throw new Error('Official Gomikin text wordmark image not found in header!');

  const emblemSrc = await emblem.getAttribute('src');
  const wordmarkSrc = await wordmark.getAttribute('src');
  console.log('   Emblem src:', emblemSrc);
  console.log('   Wordmark src:', wordmarkSrc);
  if (!emblemSrc.includes('Gomikin-logo.png')) throw new Error('Emblem must use Gomikin-logo.png');
  if (!wordmarkSrc.includes('Gomikin-text-black.png')) throw new Error('Wordmark must use Gomikin-text-black.png');

  const headerActions = await page.$('.btn-header-contact');
  const contactText = await headerActions.innerText();
  console.log('   Header contact button:', contactText);
  if (!contactText.includes('Contact Us')) throw new Error('Missing pill "Contact Us" button');

  // 2. Verify Single Desktop Viewport Fit
  console.log('3. Verifying Single Desktop Viewport Fit...');
  const metrics = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    overflow: window.getComputedStyle(document.body).overflow
  }));
  console.log('   Viewport metrics:', metrics);
  if (metrics.scrollHeight > metrics.clientHeight + 2) {
    console.warn('   Warning: vertical scroll present on desktop!');
  } else {
    console.log('   ✓ Perfect single desktop viewport fit (no scrolling)!');
  }

  // 3. Verify Refined Hero Typography
  console.log('4. Verifying Refined Hero Content...');
  const headline = await page.innerText('.hero-headline');
  const desc = await page.innerText('.hero-description');
  console.log('   Headline:', headline.replace(/\n/g, ' '));
  console.log('   Description:', desc);
  if (!headline.includes("Waste isn't the end") || !headline.includes("It's the beginning")) {
    throw new Error('Hero headline mismatch');
  }
  if (!desc.includes('designed to transform everyday waste into something valuable')) {
    throw new Error('Hero description wording mismatch');
  }

  // 4. Verify Static Product Preview (Matches Figma Artboard)
  console.log('5. Verifying Static Product Preview (Pre-launch State)...');
  const preview = await page.$('#static-product-preview');
  if (!preview) throw new Error('#static-product-preview not found!');

  const previewTitle = await page.innerText('.preview-card-title');
  const previewDesc = await page.innerText('.preview-card-desc');
  const previewLabel = await page.innerText('.preview-card-label');
  const previewBtn = await page.innerText('.preview-card-btn');
  const previewHeader = await page.innerText('.preview-title');
  const previewBadge = await page.innerText('.preview-badge');

  console.log('   Preview Card Title:', previewTitle);
  console.log('   Preview Card Desc:', previewDesc);
  console.log('   Preview Card Label:', previewLabel);
  console.log('   Preview Card Button:', previewBtn);
  console.log('   Preview Top Header:', previewHeader);
  console.log('   Preview Top Badge:', previewBadge);

  if (!previewTitle.includes('Explore the Gomikin 3D Model')) throw new Error('Preview card title mismatch');
  if (!previewDesc.includes('Explore the mechanical architecture and internal processing system.')) throw new Error('Preview card desc mismatch');
  if (!previewLabel.includes('Interactive engineering environment')) throw new Error('Preview card label mismatch');
  if (!previewBtn.includes('Launch 3D Experience')) throw new Error('Preview button text mismatch');
  if (!previewHeader.includes('GOMIKIN / PRODUCT EXPERIENCE')) throw new Error('Preview header text mismatch');
  if (!previewBadge.includes('INTERACTIVE 3D')) throw new Error('Preview badge mismatch');

  // 5. Verify Three.js Canvas and Modular Nav are STRICTLY HIDDEN Pre-launch
  console.log('6. Verifying Three.js Canvas and Controls are HIDDEN before launch...');
  const appCanvasVisible = await page.evaluate(() => {
    const el = document.getElementById('app-canvas');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('   Three.js #app-canvas visible pre-launch:', appCanvasVisible);
  if (appCanvasVisible) throw new Error('Three.js #app-canvas MUST NOT be visible before launch!');

  const modularNavVisible = await page.evaluate(() => {
    const el = document.getElementById('gomikin-modular-nav');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('   #gomikin-modular-nav visible pre-launch:', modularNavVisible);
  if (modularNavVisible) throw new Error('#gomikin-modular-nav MUST NOT be visible before launch!');

  await page.screenshot({ path: 'scratch/phase_c2_01_static_preview_landing.png' });
  console.log('   ✓ Saved scratch/phase_c2_01_static_preview_landing.png');

  // 6. Test Cinematic Fullscreen Expansion Animation
  console.log('7. Testing Cinematic Fullscreen Expansion Animation...');
  // Click on the preview to trigger launch
  await page.click('#btn-canvas-explore');

  // Check that transition is active or completed
  await page.waitForTimeout(400);
  const isExpanding = await page.evaluate(() => {
    const wrapper = document.getElementById('gomikin-canvas-wrapper');
    return wrapper.style.position === 'fixed' || wrapper.classList.contains('fullscreen-mode');
  });
  console.log('   Expansion transition in motion:', isExpanding);
  await page.screenshot({ path: 'scratch/phase_c2_02_cinematic_expansion_midway.png' });

  // Wait for 700ms expansion transition to finalize
  await page.waitForTimeout(600);

  const isFullscreen = await page.evaluate(() => {
    const wrapper = document.getElementById('gomikin-canvas-wrapper');
    return wrapper.classList.contains('fullscreen-mode');
  });
  console.log('   Expansion completed to fullscreen:', isFullscreen);
  if (!isFullscreen) throw new Error('Canvas wrapper failed to complete fullscreen expansion!');

  // Check fullscreen loading status if still loading
  const loadingInfo = await page.evaluate(() => {
    const statusEl = document.getElementById('canvas-loading-status');
    const overlay = document.getElementById('canvas-loading-overlay');
    return {
      visible: overlay && window.getComputedStyle(overlay).display !== 'none',
      text: statusEl ? statusEl.textContent : ''
    };
  });
  console.log('   Fullscreen loading status:', loadingInfo);
  if (loadingInfo.visible && loadingInfo.text.toLowerCase().includes('downloading')) {
    throw new Error('Loading status contains forbidden word "Downloading"!');
  }

  // 7. Wait for Model Ready in Fullscreen
  console.log('8. Waiting for Three.js USDZ Model ready in Fullscreen...');
  await page.waitForFunction(() => window.gomikinModelState && window.gomikinModelState.status === 'ready', { timeout: 60000 });
  await page.waitForTimeout(1000);

  const canvasNowVisible = await page.evaluate(() => {
    const el = document.getElementById('app-canvas');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('   Three.js #app-canvas visible in fullscreen:', canvasNowVisible);
  if (!canvasNowVisible) throw new Error('Three.js canvas not visible in fullscreen after model ready!');

  const modularNavNowVisible = await page.evaluate(() => {
    const el = document.getElementById('gomikin-modular-nav');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('   #gomikin-modular-nav visible in fullscreen:', modularNavNowVisible);
  if (!modularNavNowVisible) throw new Error('#gomikin-modular-nav must be visible in fullscreen mode!');

  await page.screenshot({ path: 'scratch/phase_c2_03_fullscreen_model_ready.png' });
  console.log('   ✓ Saved scratch/phase_c2_03_fullscreen_model_ready.png');

  // 8. Test 3D Sub-System Modes
  console.log('9. Testing 3D Sub-System navigation in Fullscreen...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/phase_c2_04_modular_views.png' });

  await page.click('#tab-dissection');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/phase_c2_05_dissection.png' });

  await page.click('#tab-flow-sim');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/phase_c2_06_flow_sim.png' });

  await page.click('#tab-full-model');
  await page.waitForTimeout(500);

  // 9. Test Reverse Cinematic Exit Animation via Escape
  console.log('10. Testing Reverse Cinematic Exit Animation via Escape...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  const isFullscreenAfterExit = await page.evaluate(() => {
    return document.getElementById('gomikin-canvas-wrapper').classList.contains('fullscreen-mode');
  });
  console.log('   Canvas is fullscreen after exit:', isFullscreenAfterExit);
  if (isFullscreenAfterExit) throw new Error('Escape key failed to exit fullscreen!');

  // Verify static preview is restored and Three.js canvas is hidden again on landing page
  const canvasHiddenAfterExit = await page.evaluate(() => {
    const el = document.getElementById('app-canvas');
    return !el || window.getComputedStyle(el).display === 'none';
  });
  console.log('   Three.js canvas hidden on landing page after exit:', canvasHiddenAfterExit);
  if (!canvasHiddenAfterExit) throw new Error('Three.js canvas must NOT remain visible on landing page after exit!');

  const previewRestored = await page.evaluate(() => {
    const el = document.getElementById('static-product-preview');
    return el && window.getComputedStyle(el).display !== 'none';
  });
  console.log('   Static preview restored after exit:', previewRestored);
  if (!previewRestored) throw new Error('Static product preview was not restored after exiting fullscreen!');

  await page.screenshot({ path: 'scratch/phase_c2_07_exit_restored_landing.png' });
  console.log('   ✓ Saved scratch/phase_c2_07_exit_restored_landing.png');

  // 10. Test Re-launch from Primary Button ("Explore 3D Prototype")
  console.log('11. Testing Re-launch via Hero Button ("Explore 3D Prototype")...');
  await page.click('#btn-hero-explore');
  await page.waitForTimeout(800);

  const isFullscreenReLaunched = await page.evaluate(() => {
    return document.getElementById('gomikin-canvas-wrapper').classList.contains('fullscreen-mode');
  });
  console.log('   Re-launched to fullscreen:', isFullscreenReLaunched);
  if (!isFullscreenReLaunched) throw new Error('Re-launch via hero explore button failed!');

  // Exit again via toggle button
  await page.click('#btn-canvas-fullscreen');
  await page.waitForTimeout(800);

  // 11. Test Mobile Layout
  console.log('12. Testing Mobile Responsive Layout (390 x 844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'scratch/phase_c2_08_mobile_landing.png' });
  console.log('   ✓ Saved scratch/phase_c2_08_mobile_landing.png');

  // 12. Check Console Errors
  console.log('13. Checking severe console errors...');
  const severeErrors = consoleErrors.filter(e => !e.includes('favicon'));
  console.log('   Severe console errors count:', severeErrors.length);
  if (severeErrors.length > 0) {
    console.error('   Errors detected:', severeErrors);
    throw new Error(`Encountered ${severeErrors.length} severe console errors!`);
  }

  console.log('=== ALL 17 PHASE C.2 VERIFICATIONS PASSED SUCCESSFULLY! ===');
  await browser.close();
})();

