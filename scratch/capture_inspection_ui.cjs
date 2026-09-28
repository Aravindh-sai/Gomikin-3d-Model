const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('Connecting to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#gomikin-right-panel', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const artifactDir = 'c:/Users/ARAVINDH/.gemini/antigravity-ide/brain/772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // 1. Verify UI cleanliness: ensure bottom dock and top-left buttons are NOT present
  const hasBottomDock = await page.$('#presentation-dock');
  const hasLegacyToggle = await page.$eval('#ui-toggle-btn', el => window.getComputedStyle(el).display !== 'none').catch(() => false);
  console.log(`Bottom dock present: ${!!hasBottomDock} (Expect false)`);
  console.log(`Legacy top-left button visible: ${hasLegacyToggle} (Expect false)`);

  // 2. Full Apparatus Default View
  await page.evaluate(() => {
    window.inspectionController?.selectModule('all');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_1_full_apparatus.png` });
  console.log('Saved inspection_1_full_apparatus.png');

  // 3. Input & Segregation Module Selected
  await page.evaluate(() => {
    window.inspectionController?.selectModule('input');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_2_input_module.png` });
  console.log('Saved inspection_2_input_module.png');

  // 4. Organic Preprocessing & Cutting Selected
  await page.evaluate(() => {
    window.inspectionController?.selectModule('cutting');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_3_cutting_module.png` });
  console.log('Saved inspection_3_cutting_module.png');

  // 5. Decomposition Module Selected
  await page.evaluate(() => {
    window.inspectionController?.selectModule('decomposition');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_4_decomposition_module.png` });
  console.log('Saved inspection_4_decomposition_module.png');

  // 6. Leftover Food Module Selected
  await page.evaluate(() => {
    window.inspectionController?.selectModule('leftover_food');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_5_leftover_food_module.png` });
  console.log('Saved inspection_5_leftover_food_module.png');

  // 7. Waste Workflows Tab View
  await page.evaluate(() => {
    window.unifiedUI?.setTab('workflows');
    window.workflowController?.setMode('organic');
    window.workflowController?.setProgress(0.65);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_6_workflow_tab.png` });
  console.log('Saved inspection_6_workflow_tab.png');

  // 8. Return to Full Apparatus
  await page.evaluate(() => {
    window.unifiedUI?.setTab('modules');
    window.inspectionController?.selectModule('all');
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/inspection_7_reset_full.png` });
  console.log('Saved inspection_7_reset_full.png');

  await browser.close();
  console.log('All static component inspection visual captures completed successfully!');
})();
