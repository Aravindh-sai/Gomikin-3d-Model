const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Run in-browser inspection of Three.js objects, userData, and geometry
  const inspection = await page.evaluate(() => {
    // Traverse the scene
    const results = {
      envelopeChildren: [],
      inorganic: null,
      foodOuter: null,
      foodBasket: null,
      organicStorage: null,
      organicDecomp: null,
      centralDivider: null,
      radialDivider: null,
    };

    window.__scene = null;
    // Find Three.js scene from canvas or global
    // In main.js, let's search for objects
    // We can traverse from window if exposed, or let's inspect DOM and search scene
    return results;
  });

  // Let's inspect using DOM or UI readouts
  const uiReadouts = await page.evaluate(() => {
    return {
      planeTop: document.getElementById('lbl-plane-top')?.textContent,
      planeInput: document.getElementById('lbl-plane-input')?.textContent,
      planeDatum: document.getElementById('lbl-plane-datum')?.textContent,
      planeLeachate: document.getElementById('lbl-plane-leachate')?.textContent,
      planeBase: document.getElementById('lbl-plane-base')?.textContent,
      orgCutting: document.getElementById('lbl-org-cutting')?.textContent,
      orgStorage: document.getElementById('lbl-org-storage')?.textContent,
      orgGap: document.getElementById('lbl-org-gap')?.textContent,
      orgDecomp: document.getElementById('lbl-org-decomp')?.textContent,
      inorgDrawer: document.getElementById('lbl-inorg-drawer')?.textContent,
      foodOuter: document.getElementById('lbl-food-outer')?.textContent,
      foodBasket: document.getElementById('lbl-food-basket')?.textContent,
      foodSump: document.getElementById('lbl-food-sump')?.textContent,
      valBox: document.getElementById('env-val-box')?.textContent?.replace(/\s+/g, ' ')?.trim(),
    };
  });
  console.log('UI READOUTS:', JSON.stringify(uiReadouts, null, 2));

  // Capture Screenshot 1: Isometric View with translucent shell
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  const shotIsoPath = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa/phase2c_isometric.png';
  await page.screenshot({ path: shotIsoPath });
  console.log('Saved:', shotIsoPath);

  // Capture Screenshot 2: Front View (+Z) looking directly at Leftover Food sector
  await page.click('#cam-front');
  await page.waitForTimeout(600);
  const shotFrontPath = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa/phase2c_front_food.png';
  await page.screenshot({ path: shotFrontPath });
  console.log('Saved:', shotFrontPath);

  // Capture Screenshot 3: Hide shell to clearly inspect internal chambers & drawers
  await page.click('#btn-shell-hidden');
  await page.waitForTimeout(500);
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  const shotInternalPath = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa/phase2c_internal_all_chambers.png';
  await page.screenshot({ path: shotInternalPath });
  console.log('Saved:', shotInternalPath);

  // Capture Screenshot 4: Top View looking straight down to verify 180° / 90° / 90° boundaries
  await page.click('#cam-top');
  await page.waitForTimeout(600);
  const shotTopPath = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa/phase2c_top_sector_boundaries.png';
  await page.screenshot({ path: shotTopPath });
  console.log('Saved:', shotTopPath);

  // Capture Screenshot 5: Hide Organic chambers to inspect only Inorganic & Leftover Food
  await page.click('#chk-organic-chambers');
  await page.waitForTimeout(500);
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  const shotNonOrgPath = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa/phase2c_non_organic_drawers_only.png';
  await page.screenshot({ path: shotNonOrgPath });
  console.log('Saved:', shotNonOrgPath);

  await browser.close();
  console.log('Verification finished successfully!');
})();
