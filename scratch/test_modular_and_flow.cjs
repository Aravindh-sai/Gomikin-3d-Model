const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('--- Testing Gomikin Modular UI & Flow Simulator ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('[BROWSER ERROR]:', msg.text());
    }
  });
  page.on('pageerror', err => {
    console.error('[PAGE ERROR]:', err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => {
    return window.usdModel &&
           window.componentRegistry &&
           window.moduleViewController &&
           window.physicalFlowController;
  }, { timeout: 45000 });

  console.log('Model and controllers ready!');
  await page.waitForTimeout(1500);

  // 1. Initial Full Model View
  await page.screenshot({ path: 'scratch/ui_01_full_model.png' });
  console.log('Saved scratch/ui_01_full_model.png');

  // 2. Click "Modular Views" tab
  console.log('Clicking Modular Views tab...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/ui_02_modular_views_tab.png' });
  console.log('Saved scratch/ui_02_modular_views_tab.png');

  // 3. Click "Cutting" module pill
  console.log('Clicking Cutting module pill...');
  await page.click('.mod-pill-btn[data-mod="cutting"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/ui_03_cutting_selected.png' });
  console.log('Saved scratch/ui_03_cutting_selected.png');

  // 4. Click "Explode Module" button
  console.log('Clicking Explode Module button...');
  await page.click('#btn-explode-module');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/ui_04_cutting_exploded.png' });
  console.log('Saved scratch/ui_04_cutting_exploded.png');

  // 5. Click "Toggle Ghost Housing"
  console.log('Clicking Toggle Ghost Housing...');
  await page.click('#btn-toggle-ghost');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/ui_05_cutting_with_ghost.png' });
  console.log('Saved scratch/ui_05_cutting_with_ghost.png');

  // 6. Click "Simulate Flow" tab
  console.log('Clicking Simulate Flow tab...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'scratch/ui_06_simulate_flow_organic.png' });
  console.log('Saved scratch/ui_06_simulate_flow_organic.png');

  // 7. Scrubber drag to 50%
  console.log('Dragging flow scrubber to 50%...');
  await page.evaluate(() => {
    window.physicalFlowController.pause();
    window.physicalFlowController.setProgress(0.50);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'scratch/ui_07_flow_scrubbed_50.png' });
  console.log('Saved scratch/ui_07_flow_scrubbed_50.png');

  // 8. Click "Inorganic Flow" mode
  console.log('Switching to Inorganic Flow...');
  await page.click('.flow-mode-btn[data-flow="INORGANIC"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/ui_08_flow_inorganic.png' });
  console.log('Saved scratch/ui_08_flow_inorganic.png');

  // 9. Back to "Full Model" tab
  console.log('Clicking Full Model tab...');
  await page.click('#tab-full-model');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/ui_09_back_to_full.png' });
  console.log('Saved scratch/ui_09_back_to_full.png');

  await browser.close();
  console.log('--- UI Verification Complete! ---');
})();
