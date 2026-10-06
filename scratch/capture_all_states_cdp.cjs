const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureAll() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
  const page = await context.newPage();

  console.log('Navigating to app...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.gomikinAnimation && !!window.componentRegistry, { timeout: 60000 });
  console.log('Model and animation loaded!');

  const cdp = await page.context().newCDPSession(page);

  async function snap(filename) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const dest = path.resolve('scratch', filename);
    fs.writeFileSync(dest, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${dest}`);
  }

  // 1. Assembled state
  await page.waitForTimeout(1000);
  await snap('full_assembled_state.png');

  // 2. Trigger Dissection and wait to mid
  console.log('Progressing to mid-dissection (p=0.35)...');
  await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.progress(0.35);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
  });
  await page.waitForTimeout(1000);
  await snap('full_mid_dissection.png');

  // 3. Fast forward to final catalogue with labels
  console.log('Progressing to full catalogue...');
  await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.progress(1.0);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
  });

  await page.waitForTimeout(1000);
  await snap('full_final_catalogue.png');

  // 4. Test Reset
  console.log('Triggering Reset...');
  await page.evaluate(() => {
    const anim = window.gomikinAnimation;
    anim.progress(0.0);
    if (window.renderer && window.scene && window.camera) {
      window.renderer.render(window.scene, window.camera);
    }
  });
  await page.waitForTimeout(1000);
  await snap('full_restored_assembled.png');

  await browser.close();
  console.log('All full screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
