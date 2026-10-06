const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/ARAVINDH/.gemini/antigravity-ide/brain/34958df2-adc3-4852-9428-dec5da174ea9';

(async () => {
  console.log('--- Diagnosing Gomikin Dissection Animation Flow ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  page.setDefaultTimeout(90000);
  page.setDefaultNavigationTimeout(90000);

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Gomikin') || text.includes('Error') || text.includes('USDZ')) {
      console.log(`[Browser Console]:`, text);
    }
  });
  page.on('pageerror', err => console.error('[Browser Error]:', err));

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 90000 });

  await page.waitForFunction(() => {
    return window.gomikinAnimation && 
           window.gomikinAnimation.controller && 
           window.componentRegistry && 
           window.componentRegistry.getNames &&
           window.componentRegistry.getNames().length === 33;
  }, { timeout: 90000 });

  console.log('USDZ ready. Initial state:');
  const cdp = await page.context().newCDPSession(page);
  async function snap(name) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const filepath = path.join(ARTIFACT_DIR, `${name}.png`);
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`Saved screenshot: ${name}.png`);
  }

  await snap('flow_00_initial');

  console.log('Triggering DISSECT GOMIKIN animation...');
  await page.evaluate(() => {
    window.gomikinAnimation.play(1.0);
  });

  // Monitor over 12 seconds
  for (let sec = 1; sec <= 12; sec++) {
    await page.waitForTimeout(1000);
    const stateInfo = await page.evaluate(() => {
      const anim = window.gomikinAnimation.controller;
      const reg = window.componentRegistry;
      const cam = window.camera;
      const housing = reg.get('Main_Housing');
      const sensor = reg.get('ultrasonic_sensor');
      return {
        progress: anim._progress,
        isPlaying: anim.isPlaying,
        state: anim._state,
        camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
        housingPos: housing ? { x: housing.position.x, y: housing.position.y, z: housing.position.z } : null,
        housingScale: housing ? housing.scale.x : null,
        sensorPos: sensor ? { x: sensor.position.x, y: sensor.position.y, z: sensor.position.z } : null,
        sensorScale: sensor ? sensor.scale.x : null
      };
    });
    console.log(`[t = ${sec}s]`, JSON.stringify(stateInfo));
    if (sec === 3 || sec === 6 || sec === 9 || sec === 12) {
      await snap(`flow_0${sec}_sec`);
    }
  }

  console.log('--- Done diagnosis ---');
  await browser.close();
})();
