import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Position camera to match user's screenshot angle
  const diag = await page.evaluate(() => {
    const scene = window.scene;
    const camera = window.camera;
    const controls = window.controls;

    // Check all objects in LeftoverFoodSection
    let lfSection = null;
    scene.traverse((obj) => {
      if (obj.name === 'LeftoverFoodSection') lfSection = obj;
    });

    const childrenInfo = lfSection ? lfSection.children.map(c => ({
      name: c.name,
      type: c.type,
      visible: c.visible,
      position: c.position,
      children: c.children.map(cc => ({ name: cc.name, type: cc.type, visible: cc.visible, position: cc.position })),
      material: c.material ? {
        color: c.material.color ? c.material.color.getHexString() : null,
        opacity: c.material.opacity,
        transparent: c.material.transparent,
        depthWrite: c.material.depthWrite,
        side: c.material.side,
        visible: c.material.visible,
      } : null,
    })) : null;

    // Hide labels like in user screenshot
    const chkLabels = document.getElementById('chk-engineering-labels');
    if (chkLabels && chkLabels.checked) {
      const btn = document.getElementById('btn-toggle-labels');
      if (btn) btn.click();
    }

    // Set camera to view from +X, +Z looking slightly down (user view)
    camera.position.set(0.8, 1.1, 1.2);
    controls.target.set(0, 0.45, 0);
    controls.update();

    return {
      childrenInfo,
      cameraPos: camera.position,
      target: controls.target,
    };
  });

  console.log('Diagnostic info:', JSON.stringify(diag, null, 2));

  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';
  await page.screenshot({ path: path.join(artifactDir, 'debug_user_view.png') });
  console.log('Saved debug_user_view.png');

  // Now try from angle (1.2, 1.1, 0.5)
  await page.evaluate(() => {
    const camera = window.camera;
    const controls = window.controls;
    camera.position.set(1.1, 1.0, 0.5);
    controls.target.set(0, 0.45, 0);
    controls.update();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'debug_user_view_2.png') });
  console.log('Saved debug_user_view_2.png');

  // Now try from angle (0.5, 1.0, 1.1)
  await page.evaluate(() => {
    const camera = window.camera;
    const controls = window.controls;
    camera.position.set(0.5, 1.0, 1.1);
    controls.target.set(0, 0.45, 0);
    controls.update();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(artifactDir, 'debug_user_view_3.png') });
  console.log('Saved debug_user_view_3.png');

  await browser.close();
})();
