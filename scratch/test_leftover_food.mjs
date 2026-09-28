import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  console.log('Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Evaluate the Three.js scene hierarchy
  const audit = await page.evaluate(() => {
    const scene = window.scene;
    if (!scene) return { error: 'window.scene not found' };

    let topClosure = null;
    let doorHinge = null;
    let accessDoor = null;
    let hingeAxis = null;
    let topBadge = null;
    let doorBadge = null;

    scene.traverse((obj) => {
      if (obj.name === 'LeftoverFoodTopClosure') topClosure = obj;
      if (obj.name === 'LeftoverFoodAccessDoor_Hinge') doorHinge = obj;
      if (obj.name === 'LeftoverFoodAccessDoor') accessDoor = obj;
      if (obj.name === 'LeftoverFoodAccessDoor_HingeAxis') hingeAxis = obj;
      if (obj.name === 'LeftoverFoodTopClosure_Badge') topBadge = obj;
      if (obj.name === 'LeftoverFoodAccessDoor_Badge') doorBadge = obj;
    });

    return {
      topClosure: topClosure ? {
        name: topClosure.name,
        position: topClosure.position,
        visible: topClosure.visible,
        userData: topClosure.userData,
      } : null,
      doorHinge: doorHinge ? {
        name: doorHinge.name,
        position: doorHinge.position,
        visible: doorHinge.visible,
        userData: doorHinge.userData,
        childrenCount: doorHinge.children.length,
      } : null,
      accessDoor: accessDoor ? {
        name: accessDoor.name,
        position: accessDoor.position,
        visible: accessDoor.visible,
        userData: accessDoor.userData,
        parentName: accessDoor.parent ? accessDoor.parent.name : null,
      } : null,
      hingeAxis: hingeAxis ? {
        name: hingeAxis.name,
        parentName: hingeAxis.parent ? hingeAxis.parent.name : null,
      } : null,
      topBadge: topBadge ? {
        name: topBadge.name,
        isEngineeringLabel: topBadge.userData ? topBadge.userData.isEngineeringLabel : null,
        visible: topBadge.visible,
      } : null,
      doorBadge: doorBadge ? {
        name: doorBadge.name,
        isEngineeringLabel: doorBadge.userData ? doorBadge.userData.isEngineeringLabel : null,
        visible: doorBadge.visible,
      } : null,
    };
  });

  console.log('Hierarchy Audit Result:');
  console.log(JSON.stringify(audit, null, 2));

  // Capture Screenshot 1: Default Isometric
  const artifactDir = 'C:\\Users\\ARAVINDH\\.gemini\\antigravity-ide\\brain\\772ebe41-7f11-48bc-8649-67c1b64aafaa';
  await page.screenshot({ path: path.join(artifactDir, 'leftover_food_iso.png') });
  console.log('Saved leftover_food_iso.png');

  // Click "Food (90°)" camera preset
  const btnFoodCam = await page.$('#cam-food-door');
  if (btnFoodCam) {
    await btnFoodCam.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'leftover_food_closeup.png') });
    console.log('Saved leftover_food_closeup.png');
  }

  // Hide Shell to get crystal clear view of internal structure
  const btnHideShell = await page.$('#btn-shell-hidden');
  if (btnHideShell) {
    await btnHideShell.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'leftover_food_no_shell.png') });
    console.log('Saved leftover_food_no_shell.png');
  }

  // Click Top view camera preset
  const btnTopCam = await page.$('#cam-top');
  if (btnTopCam) {
    await btnTopCam.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(artifactDir, 'leftover_food_top_view.png') });
    console.log('Saved leftover_food_top_view.png');
  }

  // Test label toggle
  const labelToggleResult = await page.evaluate(() => {
    const btn = document.getElementById('btn-toggle-labels');
    if (btn) btn.click(); // Hide labels
    const scene = window.scene;
    let topBadgeVis = null;
    let doorBadgeVis = null;
    scene.traverse((obj) => {
      if (obj.name === 'LeftoverFoodTopClosure_Badge') topBadgeVis = obj.visible;
      if (obj.name === 'LeftoverFoodAccessDoor_Badge') doorBadgeVis = obj.visible;
    });
    return { topBadgeVis, doorBadgeVis };
  });
  console.log('Label Toggle Test (hidden):', labelToggleResult);

  // Restore labels
  await page.evaluate(() => {
    const btn = document.getElementById('btn-toggle-labels');
    if (btn) btn.click(); // Show labels
  });

  await browser.close();
  console.log('Done!');
})();
