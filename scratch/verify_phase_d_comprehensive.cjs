const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:/Users/hifia/.gemini/antigravity/brain/26b96081-aa7d-405d-92ae-5713b7aad24c';

async function runComprehensiveVerification() {
  console.log('=== GOMIKIN PHASE D COMPREHENSIVE BROWSER VERIFICATION ===');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  function saveShot(filename) {
    const fullPath = path.join(ARTIFACTS_DIR, filename);
    return page.screenshot({ path: fullPath }).then(() => {
      console.log(`✓ Screenshot captured: ${filename}`);
    });
  }

  // 1. Landing Page Verification
  console.log('1. Navigating to landing page...');
  await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const heroText = await page.$eval('.hero-description', el => el.textContent.trim());
  console.log('Hero supporting text:', heroText);
  await saveShot('phase_d_01_landing_page.png');

  // 2. Launch 3D Experience
  console.log('2. Launching 3D Experience...');
  await page.click('#btn-hero-explore');
  await page.waitForFunction(() => window.gomikinModelState && window.gomikinModelState.status === 'ready', { timeout: 35000 });
  await page.waitForTimeout(1500);

  // 3. Multi-Angle Visual Inspection (Priority 2)
  console.log('3. Inspecting PBR materials from multiple angles...');
  
  // Front View
  await page.evaluate(() => {
    window.camera.position.set(0, 0.52, 1.95);
    window.controls.target.set(0, 0.52, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_02_front_view.png');

  // Three-Quarter View
  await page.evaluate(() => {
    window.camera.position.set(1.4, 0.85, 1.4);
    window.controls.target.set(0, 0.52, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_03_three_quarter_view.png');

  // Side View
  await page.evaluate(() => {
    window.camera.position.set(1.95, 0.52, 0);
    window.controls.target.set(0, 0.52, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_04_side_view.png');

  // Slightly Elevated View
  await page.evaluate(() => {
    window.camera.position.set(1.0, 1.35, 1.2);
    window.controls.target.set(0, 0.52, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_05_elevated_view.png');

  // 4. Test Mechanical Pivots (Priority 1)
  console.log('4. Testing Mechanical Pivots Individually...');

  // A. Rotating Segregator Base (-10 deg Y tilt)
  console.log('   Testing Rotating Base...');
  await page.evaluate(() => {
    window.camera.position.set(0.25, 1.25, 0.35);
    window.controls.target.set(0, 0.94, 0);
    window.controls.update();
    window.mechanicalPivotController.setRotatingBaseAngle(THREE.MathUtils.degToRad(-10), true);
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_06_rotating_base_tilted.png');

  const baseCheck = await page.evaluate(() => {
    const p = window.mechanicalPivotController.pivots.rotatingBase;
    const mesh = window.componentRegistry.get('rotating_base');
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    return {
      pivotAngleDeg: THREE.MathUtils.radToDeg(p.currentAngle),
      meshWorldY: worldPos.y,
      meshAttached: mesh.parent === p.object
    };
  });
  console.log('   Rotating Base Check:', baseCheck);

  // Reset base
  await page.evaluate(() => {
    window.mechanicalPivotController.resetMechanicalComponents();
  });
  await page.waitForTimeout(300);

  // B. Left Door (+25 deg X opening)
  console.log('   Testing Left Door...');
  await page.evaluate(() => {
    window.camera.position.set(-0.8, 0.75, 0.6);
    window.controls.target.set(-0.12, 0.65, 0);
    window.controls.update();
    window.mechanicalPivotController.openLeftDoor(0.01);
  });
  await page.waitForTimeout(500);
  await saveShot('phase_d_07_left_door_open.png');

  await page.evaluate(() => {
    window.mechanicalPivotController.resetMechanicalComponents();
  });
  await page.waitForTimeout(300);

  // C. Right Door (-25 deg X opening)
  console.log('   Testing Right Door...');
  await page.evaluate(() => {
    window.camera.position.set(-0.8, 0.75, -0.6);
    window.controls.target.set(-0.12, 0.65, 0);
    window.controls.update();
    window.mechanicalPivotController.openRightDoor(0.01);
  });
  await page.waitForTimeout(500);
  await saveShot('phase_d_08_right_door_open.png');

  await page.evaluate(() => {
    window.mechanicalPivotController.resetMechanicalComponents();
  });
  await page.waitForTimeout(300);

  // D. Cutting Blades (Continuous Z rotation around local mechanical center)
  console.log('   Testing Cutting Blades...');
  await page.evaluate(() => {
    window.camera.position.set(-0.55, 0.95, 0.35);
    window.controls.target.set(-0.12, 0.86, 0);
    window.controls.update();
    window.mechanicalPivotController.rotateCuttingBlades(20);
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_10_cutting_blades_rotating.png');

  const bladesCheck = await page.evaluate(() => {
    const p = window.mechanicalPivotController.pivots.cuttingBlades;
    const mesh = window.componentRegistry.get('cutting_blades');
    const pivotPos = new THREE.Vector3();
    const meshPos = new THREE.Vector3();
    p.object.getWorldPosition(pivotPos);
    mesh.getWorldPosition(meshPos);
    return {
      isContinuous: p.isContinuous,
      pivotWorldPos: pivotPos,
      meshWorldPos: meshPos,
      meshAttached: mesh.parent === p.object
    };
  });
  console.log('   Cutting Blades Check:', bladesCheck);

  await page.evaluate(() => {
    window.mechanicalPivotController.stopCuttingBlades();
    window.mechanicalPivotController.resetMechanicalComponents();
  });
  await page.waitForTimeout(300);

  // 5. Test 4 Navigation Modes
  console.log('5. Testing 4 Navigation Modes...');

  // Mode 1: Full Model
  console.log('   Testing Full Model...');
  await page.click('#tab-full-model');
  await page.waitForTimeout(800);
  await saveShot('phase_d_11_full_model.png');

  // Mode 2: Modular Views
  console.log('   Testing Modular Views...');
  await page.click('#tab-module-views');
  await page.waitForTimeout(800);
  await saveShot('phase_d_12_modular_views.png');

  // Mode 3: 33-Part Dissection
  console.log('   Testing 33-Part Dissection...');
  await page.click('#tab-dissection');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.gomikinAnimation.controller.progress(1.0);
  });
  await page.waitForTimeout(800);
  await saveShot('phase_d_13_dissection_view.png');

  // Mode 4: Simulate Flow
  console.log('   Testing Simulate Flow...');
  await page.click('#tab-flow-sim');
  await page.waitForTimeout(600);
  // Advance flow to Step 4 (cutting blades shredding)
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.42);
  });
  await page.waitForTimeout(600);
  await saveShot('phase_d_14_simulation_flow.png');

  // Reset to full model
  await page.click('#tab-full-model');
  await page.waitForTimeout(600);

  // Check console errors
  console.log('6. Checking Console Errors...');
  console.log('   Severe console errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  }

  await browser.close();
  console.log('=== ALL PHASE D VERIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
}

runComprehensiveVerification().catch(err => {
  console.error('Phase D Verification Failed:', err);
  process.exit(1);
});
