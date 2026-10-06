const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  console.log('Opening page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.gomikinAnimation && !!window.componentRegistry, { timeout: 60000 });
  console.log('App loaded!');

  // Wait a moment for render
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.resolve('scratch', 'page_01_assembled.png') });
  console.log('Captured page_01_assembled.png');

  // Trigger dissection
  await page.evaluate(() => {
    const btn = document.getElementById('btn-dissect-gomikin');
    if (btn) btn.click();
  });

  // Wait 4 seconds for mid-dissection
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.resolve('scratch', 'page_02_mid_dissection.png') });
  console.log('Captured page_02_mid_dissection.png');

  // Fast forward to end of animation (seek 1.0)
  await page.evaluate(() => {
    window.gomikinAnimation.controller.seek(1.0);
    window.gomikinAnimation.controller.update(0.016);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.resolve('scratch', 'page_03_catalogue_with_labels.png') });
  console.log('Captured page_03_catalogue_with_labels.png');

  // Reset
  await page.evaluate(() => {
    const btn = document.getElementById('btn-dissect-gomikin');
    if (btn) btn.click();
  });
  await page.waitForTimeout(500);
  // Fast forward reset
  await page.evaluate(() => {
    window.gomikinAnimation.controller.seek(0.0);
    window.gomikinAnimation.controller.update(0.016);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.resolve('scratch', 'page_04_restored.png') });
  console.log('Captured page_04_restored.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
