const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Opening http://localhost:5174/ ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const c = env.getObjectByName('CentralDivider');
    const r = env.getObjectByName('RadialDivider');
    const lid = env.getObjectByName('TopClosure_TopLid');
    const wall = env.getObjectByName('TopClosure_RearWall');
    const fascia = env.getObjectByName('TopClosure_Fascia');
    const display = env.getObjectByName('UserInteractionDisplay');
    const screen = env.getObjectByName('UserInteractionDisplay_Screen');

    function summarize(obj) {
      if (!obj) return null;
      obj.geometry?.computeBoundingBox?.();
      const bb = obj.geometry?.boundingBox;
      return {
        name: obj.name,
        pos: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rot: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        bb: bb ? {
          min: { x: bb.min.x, y: bb.min.y, z: bb.min.z },
          max: { x: bb.max.x, y: bb.max.y, z: bb.max.z },
        } : null,
        userData: obj.userData,
      };
    }

    return {
      central: summarize(c),
      radial: summarize(r),
      lid: summarize(lid),
      fascia: summarize(fascia),
      display: summarize(display),
      screen: summarize(screen),
    };
  });

  console.log('=== DATA ===');
  console.log(JSON.stringify(data, null, 2));

  // Turn off labels to take clean captures
  await page.click('#btn-toggle-labels');
  await page.waitForTimeout(300);

  // Top view
  await page.click('#cam-top');
  await page.waitForTimeout(800);
  const ssTop = path.resolve('scratch/10_top_ortho_corrected.png');
  await page.screenshot({ path: ssTop });
  console.log('Saved:', ssTop);

  // Input bay view
  await page.click('#cam-input');
  await page.waitForTimeout(800);
  const ssInput = path.resolve('scratch/11_input_bay_corrected.png');
  await page.screenshot({ path: ssInput });
  console.log('Saved:', ssInput);

  // ISO view
  await page.click('#cam-iso');
  await page.waitForTimeout(800);
  const ssIso = path.resolve('scratch/12_iso_corrected.png');
  await page.screenshot({ path: ssIso });
  console.log('Saved:', ssIso);

  // Front view
  await page.click('#cam-front');
  await page.waitForTimeout(800);
  const ssFront = path.resolve('scratch/13_front_corrected.png');
  await page.screenshot({ path: ssFront });
  console.log('Saved:', ssFront);

  await browser.close();
  console.log('Verification finished successfully!');
})();
