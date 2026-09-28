const { chromium } = require('c:/Dev/Gomikin-3d/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

  console.log('Connecting to app at http://localhost:5174/ ...');
  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
  } catch (e) {
    console.log('5174 failed, trying 5173...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  }
  await page.waitForTimeout(1000);

  const report = await page.evaluate(() => {
    const env = window.gomikinEnvelope;
    const THREE = window.THREE || window.__THREE__;

    const lid = env.getObjectByName('TopClosure_TopLid');
    const display = env.getObjectByName('UserInteractionDisplay');
    const pedestal = env.getObjectByName('UserInteractionDisplay_Pedestal');
    const foot = env.getObjectByName('UserInteractionDisplay_Pedestal_Foot');
    const riser = env.getObjectByName('UserInteractionDisplay_Pedestal_Riser');
    const head = env.getObjectByName('UserInteractionDisplay_Head');
    const bezel = env.getObjectByName('UserInteractionDisplay_Bezel');
    const screen = env.getObjectByName('UserInteractionDisplay_Screen');

    function getWorldBox(mesh) {
      if (!mesh) return null;
      mesh.updateWorldMatrix(true, true);
      const box = new window.THREE.Box3().setFromObject(mesh);
      return {
        min: { x: box.min.x * 1000, y: box.min.y * 1000, z: box.min.z * 1000 },
        max: { x: box.max.x * 1000, y: box.max.y * 1000, z: box.max.z * 1000 },
        center: {
          x: ((box.min.x + box.max.x) / 2) * 1000,
          y: ((box.min.y + box.max.y) / 2) * 1000,
          z: ((box.min.z + box.max.z) / 2) * 1000,
        },
        size: {
          x: (box.max.x - box.min.x) * 1000,
          y: (box.max.y - box.min.y) * 1000,
          z: (box.max.z - box.min.z) * 1000,
        }
      };
    }

    const lidBox = getWorldBox(lid);
    const displayBox = getWorldBox(display);
    const footBox = getWorldBox(foot);
    const riserBox = getWorldBox(riser);
    const bezelBox = getWorldBox(bezel);
    const screenBox = getWorldBox(screen);

    // Compute screen normal in world coordinates
    let screenNormal = null;
    if (screen) {
      const normal = new window.THREE.Vector3(0, 0, 1);
      normal.applyQuaternion(screen.getWorldQuaternion(new window.THREE.Quaternion()));
      screenNormal = { x: normal.x, y: normal.y, z: normal.z };
    }

    return {
      lidBox,
      displayBox,
      footBox,
      riserBox,
      bezelBox,
      screenBox,
      screenNormal,
      displayUserData: display?.userData,
      pedestalUserData: pedestal?.userData,
    };
  });

  console.log('=== VERIFICATION REPORT ===');
  console.log(JSON.stringify(report, null, 2));

  // Turn off labels to take clean captures
  await page.click('#btn-toggle-labels');
  await page.waitForTimeout(300);

  // Capture cam-input
  await page.click('#cam-input');
  await page.waitForTimeout(800);
  const ssInput = path.resolve('scratch/20_display_cam_input.png');
  await page.screenshot({ path: ssInput });
  console.log('Saved:', ssInput);

  // Capture cam-iso
  await page.click('#cam-iso');
  await page.waitForTimeout(800);
  const ssIso = path.resolve('scratch/21_display_cam_iso.png');
  await page.screenshot({ path: ssIso });
  console.log('Saved:', ssIso);

  // Position camera directly for an extreme close-up of the display mounted on the lid
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    // Set target to display center (0, 0.915, -0.177)
    controls.target.set(0, 0.915, -0.177);
    // Camera positioned in front and slightly above, looking down-back at display
    camera.position.set(0.12, 0.97, -0.02);
    controls.update();
  });
  await page.waitForTimeout(600);
  const ssCloseupFront = path.resolve('scratch/22_display_closeup_front.png');
  await page.screenshot({ path: ssCloseupFront });
  console.log('Saved:', ssCloseupFront);

  // Position camera for side-profile close-up to clearly show mounting bracket connection to lid
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    controls.target.set(0, 0.915, -0.177);
    // Side profile from +X
    camera.position.set(0.20, 0.92, -0.177);
    controls.update();
  });
  await page.waitForTimeout(600);
  const ssCloseupSide = path.resolve('scratch/23_display_closeup_side.png');
  await page.screenshot({ path: ssCloseupSide });
  console.log('Saved:', ssCloseupSide);

  // Position camera from slightly above rear looking at the mounting on the lid
  await page.evaluate(() => {
    const controls = window.controls;
    const camera = window.camera;
    controls.target.set(0, 0.915, -0.177);
    camera.position.set(0, 1.05, -0.32);
    controls.update();
  });
  await page.waitForTimeout(600);
  const ssCloseupRearTop = path.resolve('scratch/24_display_closeup_rear_top.png');
  await page.screenshot({ path: ssCloseupRearTop });
  console.log('Saved:', ssCloseupRearTop);

  await browser.close();
  console.log('Finished visual inspection script.');
})();
