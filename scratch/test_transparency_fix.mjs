import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);

  // Set camera to the exact user view
  await page.evaluate(() => {
    const camera = window.camera;
    const controls = window.controls;
    camera.position.set(0.8, 1.1, 1.2);
    controls.target.set(0, 0.45, 0);
    controls.update();

    // Turn off labels
    const btnLabels = document.getElementById('btn-toggle-labels');
    if (btnLabels) btnLabels.click();
  });

  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';

  // Test 1: Baseline view (current)
  await page.screenshot({ path: path.join(artifactDir, 'test_current.png') });

  // Test 2: Set shell depthWrite = false, opacity = 0.4
  await page.evaluate(() => {
    const scene = window.scene;
    let shellOuter = null;
    let shellInner = null;
    scene.traverse((obj) => {
      if (obj.name === 'ShellOuterWall') shellOuter = obj;
      if (obj.name === 'ShellInnerWall') shellInner = obj;
    });
    if (shellOuter && shellOuter.material) {
      shellOuter.material.depthWrite = false;
      shellOuter.material.opacity = 0.35;
      shellOuter.material.needsUpdate = true;
    }
    if (shellInner && shellInner.material) {
      shellInner.material.depthWrite = false;
      shellInner.material.opacity = 0.35;
      shellInner.material.needsUpdate = true;
    }
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'test_shell_depthwrite_false.png') });

  // Test 3: What if door has thickness or slight offset from shell inner wall?
  // e.g. doorRadius = inner_radius - 0.001 (1 mm clearance so it doesn't z-fight with inner wall)
  await page.evaluate(() => {
    const scene = window.scene;
    const door = scene.getObjectByName('LeftoverFoodAccessDoor');
    const hinge = scene.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    const topClosure = scene.getObjectByName('LeftoverFoodTopClosure');
    console.log('Door found:', !!door, 'Hinge found:', !!hinge, 'TopClosure found:', !!topClosure);
  });

  await browser.close();
  console.log('Done testing!');
})();
