const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

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

  // In-depth inspection of Three.js objects, hierarchy, and userData
  const sceneData = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    if (!env) return { error: 'window.gomikinEnvelope not found' };

    function summarizeObject(obj) {
      if (!obj) return null;
      obj.geometry?.computeBoundingBox?.();
      const bb = obj.geometry?.boundingBox;
      return {
        name: obj.name,
        type: obj.type,
        visible: obj.visible,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        userData: obj.userData,
        boundingBox: bb ? {
          min: { x: bb.min.x, y: bb.min.y, z: bb.min.z },
          max: { x: bb.max.x, y: bb.max.y, z: bb.max.z },
        } : null,
      };
    }

    const hierarchy = [];
    env.children.forEach(c => {
      hierarchy.push({
        name: c.name,
        type: c.type,
        visible: c.visible,
        children: c.children.map(ch => ({
          name: ch.name,
          type: ch.type,
          visible: ch.visible,
          userData: ch.userData,
        })),
      });
    });

    const inorganicSection = env.getObjectByName('InorganicSection');
    const inorganicDrawer = env.getObjectByName('InorganicOutputDrawerEnvelope');
    const leftoverFoodSection = env.getObjectByName('LeftoverFoodSection');
    const foodOuterDrawer = env.getObjectByName('LeftoverFoodOuterDrawerEnvelope');
    const foodBasket = env.getObjectByName('RemovableStrainerBasketEnvelope');
    const organicChambers = env.getObjectByName('OrganicChambers');
    const orgStorage = env.getObjectByName('OrganicStorageChamber');
    const orgDecomp = env.getObjectByName('OrganicDecompositionChamber');
    const orgGap = env.getObjectByName('OrganicStorageDecompositionGap');

    return {
      hierarchy,
      inorganicSection: summarizeObject(inorganicSection),
      inorganicDrawer: summarizeObject(inorganicDrawer),
      leftoverFoodSection: summarizeObject(leftoverFoodSection),
      foodOuterDrawer: summarizeObject(foodOuterDrawer),
      foodBasket: summarizeObject(foodBasket),
      organicStorage: summarizeObject(orgStorage),
      organicDecomp: summarizeObject(orgDecomp),
      orgGap: summarizeObject(orgGap),
    };
  });

  console.log('=== SCENE HIERARCHY & DATA ===');
  console.log(JSON.stringify(sceneData, null, 2));

  // UI readouts check
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
  console.log('=== UI READOUTS ===');
  console.log(JSON.stringify(uiReadouts, null, 2));

  const artifactDir = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // Screenshot 1: Isometric View with translucent shell
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_isometric.png` });

  // Screenshot 2: Front View (+Z)
  await page.click('#cam-front');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_front_food.png` });

  // Screenshot 3: Internal view - Hide shell
  await page.click('#btn-shell-hidden');
  await page.waitForTimeout(500);
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_internal_all_chambers.png` });

  // Screenshot 4: Top View
  await page.click('#cam-top');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_top_sector_boundaries.png` });

  // Screenshot 5: Hide Organic chambers to inspect only Inorganic & Leftover Food
  await page.click('#chk-organic-chambers');
  await page.waitForTimeout(500);
  await page.click('#cam-iso');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${artifactDir}/phase2c_non_organic_drawers_only.png` });

  await browser.close();
  console.log('Verification finished successfully!');
})();
