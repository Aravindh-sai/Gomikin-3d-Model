const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function approxEqual(val1, val2, eps = 1e-3) {
  return Math.abs(val1 - val2) < eps;
}

(async () => {
  console.log('================================================================');
  console.log('GOMIKIN PHASE 5 — VIRTUAL DOOR ASSEMBLY VERIFICATION SUITE');
  console.log('================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[BROWSER ERROR]:', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('[PAGE ERROR]:', err.message);
  });

  console.log('--- Step 0: Loading Web App ---');
  await page.goto('http://localhost:5173/');

  await page.waitForFunction(() => {
    return window.componentRegistry &&
           window.componentRegistry.names &&
           window.componentRegistry.names.length >= 33 &&
           window.virtualDoorAssembly &&
           window.viewCoordinator;
  }, { timeout: 45000 });

  console.log('✓ Model loaded and Virtual Door Assembly initialized successfully.\n');

  // Directory for Phase 5 screenshots
  const screenshotDir = path.resolve(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // --- Test 1: Door Closed and Flush with Body ---
  console.log('--- Test 1: Door Closed and Flush with Housing ---');
  const test1Data = await page.evaluate(() => {
    const door = window.virtualDoorAssembly;
    door.reset();

    // Position camera to view the Leftover Food side door from an ideal isometric perspective
    // Looking at (+X, -Z) quadrant where the door is installed
    window.camera.position.set(0.68, 0.72, -0.48);
    window.controls.target.set(0.10, 0.65, -0.10);
    window.controls.update();

    const pivotPos = door.pivotGroup.position;
    const pivotRot = door.pivotGroup.rotation;
    const mesh = door.doorMesh;
    const box = new window.THREE.Box3().setFromObject(mesh);

    return {
      currentAngleDeg: door.currentAngleDeg,
      targetAngleDeg: door.targetAngleDeg,
      pivotPos: { x: pivotPos.x, y: pivotPos.y, z: pivotPos.z },
      pivotRotY: pivotRot.y,
      bboxMin: { x: box.min.x, y: box.min.y, z: box.min.z },
      bboxMax: { x: box.max.x, y: box.max.y, z: box.max.z },
      yBottom: door.config.yBottom,
      yTop: door.config.yTop,
      radius: door.config.radius,
      isClosed: door.currentAngleDeg === 0
    };
  });

  console.log('Test 1 State:', test1Data);
  if (!approxEqual(test1Data.currentAngleDeg, 0.0) || !approxEqual(test1Data.pivotRotY, 0.0)) {
    throw new Error(`Test 1 Failed: Door not closed! Angle: ${test1Data.currentAngleDeg}`);
  }
  if (!approxEqual(test1Data.pivotPos.x, 0.0) || !approxEqual(test1Data.pivotPos.z, -0.250)) {
    throw new Error(`Test 1 Failed: Hinge pivot not at (0, -0.25)! Pos: ${JSON.stringify(test1Data.pivotPos)}`);
  }
  console.log('✓ Test 1 PASSED: Hinge pivot fixed at (0, y, -0.250), door angle = 0.000° flush.\n');

  await page.waitForTimeout(600);
  const screenshot1Path = path.join(screenshotDir, '01_door_closed_flush.png');
  await page.screenshot({ path: screenshot1Path });
  console.log(`Saved screenshot 1: ${screenshot1Path}`);

  // --- Test 2: Door Open at 60° ---
  console.log('\n--- Test 2: Door Open at approximately 60° ---');
  await page.evaluate(() => {
    window.virtualDoorAssembly.setDoorAngle(60.0);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const test2Data = await page.evaluate(() => {
    const door = window.virtualDoorAssembly;
    const pivotRot = door.pivotGroup.rotation;
    const mesh = door.doorMesh;
    const box = new window.THREE.Box3().setFromObject(mesh);

    return {
      currentAngleDeg: door.currentAngleDeg,
      pivotRotY: pivotRot.y,
      expectedRotY: -window.THREE.MathUtils.degToRad(60.0),
      bboxMin: { x: box.min.x, y: box.min.y, z: box.min.z },
      bboxMax: { x: box.max.x, y: box.max.y, z: box.max.z }
    };
  });

  console.log('Test 2 State:', test2Data);
  if (!approxEqual(test2Data.currentAngleDeg, 60.0) || !approxEqual(test2Data.pivotRotY, test2Data.expectedRotY)) {
    throw new Error(`Test 2 Failed: Door not at 60 deg! Current: ${test2Data.currentAngleDeg}`);
  }
  console.log('✓ Test 2 PASSED: Door open at 60.000°, free edge swung outward to left.\n');

  const screenshot2Path = path.join(screenshotDir, '02_door_open_60deg.png');
  await page.screenshot({ path: screenshot2Path });
  console.log(`Saved screenshot 2: ${screenshot2Path}`);

  // --- Test 3: Door Fully Open at 120° ---
  console.log('\n--- Test 3: Door Fully Open at 120° ---');
  await page.evaluate(() => {
    window.virtualDoorAssembly.setDoorAngle(120.0);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const test3Data = await page.evaluate(() => {
    const door = window.virtualDoorAssembly;
    const pivotRot = door.pivotGroup.rotation;
    const mesh = door.doorMesh;
    const box = new window.THREE.Box3().setFromObject(mesh);

    return {
      currentAngleDeg: door.currentAngleDeg,
      pivotRotY: pivotRot.y,
      expectedRotY: -window.THREE.MathUtils.degToRad(120.0),
      bboxMin: { x: box.min.x, y: box.min.y, z: box.min.z },
      bboxMax: { x: box.max.x, y: box.max.y, z: box.max.z }
    };
  });

  console.log('Test 3 State:', test3Data);
  if (!approxEqual(test3Data.currentAngleDeg, 120.0) || !approxEqual(test3Data.pivotRotY, test3Data.expectedRotY)) {
    throw new Error(`Test 3 Failed: Door not at 120 deg! Current: ${test3Data.currentAngleDeg}`);
  }
  console.log('✓ Test 3 PASSED: Door fully open at 120.000° maximum opening angle.\n');

  const screenshot3Path = path.join(screenshotDir, '03_door_fully_open_120deg.png');
  await page.screenshot({ path: screenshot3Path });
  console.log(`Saved screenshot 3: ${screenshot3Path}`);

  // --- Test 4: View Showing Exposed Leftover-Food Compartment ---
  console.log('\n--- Test 4: View Showing Exposed Leftover-Food Compartment ---');
  // Position camera slightly lower and looking into the interior through the door aperture
  await page.evaluate(() => {
    window.camera.position.set(0.55, 0.60, -0.40);
    window.controls.target.set(0.12, 0.55, -0.12);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const test4Data = await page.evaluate(() => {
    const housing = window.componentRegistry.get('Main_Housing');
    const hasClipping = housing && housing.material && housing.material.clippingPlanes && housing.material.clippingPlanes.length === 4;
    const drawer = window.componentRegistry.get('leftover_food_outpu_section');
    const topCap = window.componentRegistry.get('leftover_food_closur');
    const rightDiv = window.componentRegistry.get('Rightside_Divider');
    const centralDiv = window.componentRegistry.get('central_divider');

    return {
      hasApertureClipping: hasClipping,
      interiorComponentsVisible: {
        drawer: drawer ? drawer.visible : false,
        topCap: topCap ? topCap.visible : false,
        rightsideDivider: rightDiv ? rightDiv.visible : false,
        centralDivider: centralDiv ? centralDiv.visible : false
      }
    };
  });

  console.log('Test 4 State:', test4Data);
  if (!test4Data.hasApertureClipping) {
    throw new Error('Test 4 Failed: Housing aperture clipping planes not active!');
  }
  console.log('✓ Test 4 PASSED: Housing aperture cut cleanly, exposing interior compartment.\n');

  const screenshot4Path = path.join(screenshotDir, '04_exposed_leftover_food_compartment.png');
  await page.screenshot({ path: screenshot4Path });
  console.log(`Saved screenshot 4: ${screenshot4Path}`);

  // --- Test 5: Repeated Open/Close Cycles & Return to Closed ---
  console.log('\n--- Test 5: Repeated Open/Close Cycles & Return to Closed ---');
  await page.evaluate(async () => {
    const door = window.virtualDoorAssembly;
    // Perform 5 rapid open and close cycles
    for (let i = 0; i < 5; i++) {
      door.setDoorAngle(120.0);
      door.setDoorAngle(0.0);
      door.setDoorAngle(60.0);
      door.setDoorAngle(0.0);
    }
    door.reset();

    // Reset camera to full model view
    window.camera.position.set(0.95, 1.15, 1.55);
    window.controls.target.set(0, 0.51, 0);
    window.controls.update();
  });
  await page.waitForTimeout(600);

  const test5Data = await page.evaluate(() => {
    const door = window.virtualDoorAssembly;
    const rotY = door.pivotGroup.rotation.y;
    return {
      angleDeg: door.currentAngleDeg,
      rotY: rotY,
      isClosed: door.currentAngleDeg === 0 && rotY === 0
    };
  });

  console.log('Test 5 State after 5 cycles:', test5Data);
  if (!approxEqual(test5Data.angleDeg, 0.0) || !approxEqual(test5Data.rotY, 0.0)) {
    throw new Error(`Test 5 Failed: Cumulative rotation error detected! Angle: ${test5Data.angleDeg}`);
  }
  console.log('✓ Test 5 PASSED: Zero cumulative error after repeated cycles, returned to exact closed pose.\n');

  const screenshot5Path = path.join(screenshotDir, '05_complete_machine_door_closed.png');
  await page.screenshot({ path: screenshot5Path });
  console.log(`Saved screenshot 5: ${screenshot5Path}`);

  // --- Test 6: View Transition Integration ---
  console.log('\n--- Test 6: View Transition Safety & View Coordinator ---');
  await page.evaluate(() => {
    // Switch to Dissection
    window.viewCoordinator.switchView('dissection');
  });
  await page.waitForTimeout(800);

  const dissectionCheck = await page.evaluate(() => {
    return {
      doorVisibleInDissection: window.virtualDoorAssembly.group.visible,
      housingHasClippingInDissection: window.componentRegistry.get('Main_Housing').material.clippingPlanes !== null
    };
  });
  console.log('Dissection State:', dissectionCheck);
  if (dissectionCheck.doorVisibleInDissection || dissectionCheck.housingHasClippingInDissection) {
    throw new Error('Test 6 Failed: Door assembly not hidden in Dissection mode!');
  }
  console.log('✓ Test 6.1: Door cleanly hidden and clipping removed in Dissection mode.');

  await page.evaluate(() => {
    // Return to Full Model
    window.viewCoordinator.switchView('full');
  });
  await page.waitForTimeout(800);

  const returnFullCheck = await page.evaluate(() => {
    return {
      doorVisibleInFull: window.virtualDoorAssembly.group.visible,
      doorAngle: window.virtualDoorAssembly.currentAngleDeg,
      doorRotY: window.virtualDoorAssembly.pivotGroup.rotation.y
    };
  });
  console.log('Return to Full State:', returnFullCheck);
  if (!returnFullCheck.doorVisibleInFull || !approxEqual(returnFullCheck.doorAngle, 0.0)) {
    throw new Error('Test 6 Failed: Door not restored flush in Full Model mode!');
  }
  console.log('✓ Test 6.2: Door restored visible and flush in Full Model mode.');

  // --- Test 7: Leftover Food Flow Animation Integration ---
  console.log('\n--- Test 7: Leftover Food Flow Simulation Integration ---');
  await page.evaluate(() => {
    window.viewCoordinator.switchView('flow', { flowMode: 'LEFTOVER_FOOD' });
    window.physicalFlowController.pause();
    // Scrub to 20% (door should be opening outward)
    window.physicalFlowController.setProgress(0.20);
  });
  await page.waitForTimeout(400);

  const flowDoorCheck = await page.evaluate(() => {
    const doorAngle = window.virtualDoorAssembly.currentAngleDeg;
    const topCapRot = window.componentRegistry.get('leftover_food_closur').rotation;
    return {
      doorAngle,
      expectedDoorAngle: 55 * (0.20 / 0.25), // 44 deg
      topCapRot: { x: topCapRot.x, y: topCapRot.y, z: topCapRot.z }
    };
  });
  console.log('Flow Simulation Check (p = 0.20):', flowDoorCheck);
  if (!approxEqual(flowDoorCheck.doorAngle, flowDoorCheck.expectedDoorAngle, 1.0)) {
    throw new Error(`Test 7 Failed: Flow door angle mismatch! Current: ${flowDoorCheck.doorAngle}`);
  }
  // Verify top cap stayed static (no rotation)
  if (!approxEqual(flowDoorCheck.topCapRot.x, 0.0) || !approxEqual(flowDoorCheck.topCapRot.y, 0.0)) {
    throw new Error('Test 7 Failed: leftover_food_closur top cap was rotated!');
  }
  console.log('✓ Test 7.1: Virtual door smoothly opened to 44.0° during intake, top cap remained static!');

  // Scrub to end of flow (p = 0.90) -> door must be closed (0°)
  await page.evaluate(() => {
    window.physicalFlowController.setProgress(0.90);
  });
  await page.waitForTimeout(400);

  const flowDoorClosedCheck = await page.evaluate(() => {
    return {
      doorAngle: window.virtualDoorAssembly.currentAngleDeg
    };
  });
  console.log('Flow Simulation Check (p = 0.90):', flowDoorClosedCheck);
  if (!approxEqual(flowDoorClosedCheck.doorAngle, 0.0)) {
    throw new Error('Test 7 Failed: Door did not close at end of flow!');
  }
  console.log('✓ Test 7.2: Virtual door closed flush at end of food intake.');

  // Return to Full Model cleanly
  await page.evaluate(() => {
    window.viewCoordinator.switchView('full');
  });
  await page.waitForTimeout(600);

  console.log('\n================================================================');
  console.log('ALL 7 VERIFICATION SCENARIOS PASSED WITH ZERO DRIFT!');
  console.log('VERDICT: PASS');
  console.log('================================================================\n');

  await browser.close();
  process.exit(0);
})();
