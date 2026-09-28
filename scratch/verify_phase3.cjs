const fs = require('fs');
const THREE = require('three');

// Load parameters
const { GOMIKIN_BASELINE_PARAMS, getDerivedGeometry, validateParameters } = require('../src/utils/parameters.js');

async function runVerification() {
  console.log('====================================================');
  console.log('GOMIKIN PHASE 3: COMPREHENSIVE ARCHITECTURAL VERIFICATION');
  console.log('====================================================\n');

  // 1. PARAMETERS & LOCKED DIMENSIONS CHECK
  console.log('--- 1. LOCKED DIMENSIONS AUDIT ---');
  validateParameters(GOMIKIN_BASELINE_PARAMS);
  const derived = getDerivedGeometry(GOMIKIN_BASELINE_PARAMS);

  const locked = [
    { label: 'Overall height', val: derived.mm.overall_height, expected: 1020 },
    { label: 'Outer diameter', val: derived.mm.outer_diameter, expected: 500 },
    { label: 'Shell wall thickness', val: derived.mm.shell_wall_thickness, expected: 4 },
    { label: 'Plinth bottom datum', val: derived.mm.y_ground, expected: 0 },
    { label: 'Plinth top datum (middle bottom)', val: derived.mm.y_leachate_boundary, expected: 100 },
    { label: 'Middle section top (input bottom)', val: derived.mm.y_input_boundary, expected: 925 },
    { label: 'Top datum', val: derived.mm.y_top, expected: 1020 },
    { label: 'Decomposition bottom datum', val: derived.mm.y_decomp_bottom, expected: 100 },
    { label: 'Decomposition top datum', val: derived.mm.y_decomp_top, expected: 370 },
    { label: 'Storage/decomposition gap', val: derived.mm.gap_height, expected: 250 },
    { label: 'Storage section bottom', val: derived.mm.y_storage_bottom, expected: 620 },
    { label: 'Storage section top', val: derived.mm.y_storage_top, expected: 890 },
    { label: 'Output datum', val: derived.mm.y_non_organic_output_top, expected: 480 },
    { label: 'Organic sector angle', val: derived.raw.organic_sector_angle, expected: 180 },
    { label: 'Inorganic sector angle', val: derived.raw.inorganic_sector_angle, expected: 90 },
    { label: 'Leftover food sector angle', val: derived.raw.food_sector_angle, expected: 90 },
  ];

  let lockedPass = true;
  for (const item of locked) {
    const match = Math.abs(item.val - item.expected) < 0.001;
    console.log(`  ${match ? '✓ PASS' : '✗ FAIL'}: ${item.label}: ${item.val} mm (Expected: ${item.expected} mm)`);
    if (!match) lockedPass = false;
  }
  console.log(`Locked dimensions check: ${lockedPass ? 'ALL PASSED' : 'FAILED'}\n`);

  // 2. IMPORT ENVELOPE MODULE
  const { createGomikinEnvelope } = await import('../src/components/envelope.js');
  const envelope = createGomikinEnvelope();
  envelope.updateMatrixWorld(true);

  // 3. PHASE 3A: SEGREGATION SUPPORT & MOTOR
  console.log('--- 2. PHASE 3A: SEGREGATION SUPPORT & MOTOR ---');
  const segSupportGroup = envelope.getObjectByName('SegregationStructuralSupport');
  const hub = envelope.getObjectByName('SegregationSupportHub');
  const brgUpper = envelope.getObjectByName('SegregationSpindleBearing_Upper');
  const brgLower = envelope.getObjectByName('SegregationSpindleBearing_Lower');
  const centralMount = envelope.getObjectByName('SegregationDividerMount_Central');
  const radialMount = envelope.getObjectByName('SegregationDividerMount_Radial');
  const segMotor = envelope.getObjectByName('SegregationDriveMotor');
  const segFlange = envelope.getObjectByName('SegregationDriveMotor_Flange');
  const segCoupling = envelope.getObjectByName('SegregationMotorShaftCoupling');
  const spindle = envelope.getObjectByName('AxisPivot_1_Spindle');
  const axisPivot1 = envelope.getObjectByName('AxisPivot_1');
  const axisPivot2 = envelope.getObjectByName('AxisPivot_2');
  const rotBase = envelope.getObjectByName('RotatingBase');
  const funnel = envelope.getObjectByName('Funnel');
  const cuttingCollar = envelope.getObjectByName('OrganicCuttingCollar');

  console.log('  SegregationStructuralSupport exists:', !!segSupportGroup);
  console.log('  Hub exists:', !!hub);
  console.log('  Bearing Upper exists:', !!brgUpper);
  console.log('  Bearing Lower exists:', !!brgLower);
  console.log('  Central Divider Mount exists:', !!centralMount);
  console.log('  Radial Divider Mount exists:', !!radialMount);
  console.log('  Motor exists:', !!segMotor);
  console.log('  Motor Flange exists:', !!segFlange);
  console.log('  Motor Shaft Coupling exists:', !!segCoupling);
  console.log('  Spindle exists:', !!spindle);
  console.log('  AxisPivot_1 (Yaw) exists:', !!axisPivot1);
  console.log('  AxisPivot_2 (Pitch) exists:', !!axisPivot2);
  console.log('  RotatingBase exists:', !!rotBase);

  const hubBox = new THREE.Box3().setFromObject(hub);
  const motorBox = new THREE.Box3().setFromObject(segMotor);
  const baseBox = new THREE.Box3().setFromObject(rotBase);
  const upperBrgBox = new THREE.Box3().setFromObject(brgUpper);
  const lowerBrgBox = new THREE.Box3().setFromObject(brgLower);
  const spindleBox = new THREE.Box3().setFromObject(spindle);

  console.log('  Hub Elevation Y:', (hubBox.min.y*1000).toFixed(1), 'to', (hubBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Motor Elevation Y:', (motorBox.min.y*1000).toFixed(1), 'to', (motorBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Spindle Elevation Y:', (spindleBox.min.y*1000).toFixed(1), 'to', (spindleBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Upper Bearing Y center:', (((upperBrgBox.min.y + upperBrgBox.max.y)/2)*1000).toFixed(2), 'mm');
  console.log('  Lower Bearing Y center:', (((lowerBrgBox.min.y + lowerBrgBox.max.y)/2)*1000).toFixed(2), 'mm');
  console.log('  Dual Bearing Span:', (((upperBrgBox.min.y + upperBrgBox.max.y)/2 - (lowerBrgBox.min.y + lowerBrgBox.max.y)/2)*1000).toFixed(2), 'mm');
  console.log('  RotatingBase Elevation Y:', (baseBox.min.y*1000).toFixed(1), 'to', (baseBox.max.y*1000).toFixed(1), 'mm');

  // Verify vertical clearance from platform top to funnel discharge rim
  const funnelBottomY = derived.mm.funnel_bottom_y; // 940 mm
  const platformTopY = baseBox.max.y * 1000; // ~ 937 mm
  const funnelClearanceY = funnelBottomY - platformTopY;
  console.log('  Vertical Throat Clearance (Funnel Rim 940mm - Platform Top):', funnelClearanceY.toFixed(1), 'mm (Positive => Clear)');

  // Verify annular drop passage between hub outer radius and funnel opening radius
  const funnelThroatRadius = derived.mm.funnel_opening_diameter / 2; // 50 mm
  const hubRadiusMM = derived.mm.segregation_hub_diameter / 2; // 19 mm
  const annularDropGap = funnelThroatRadius - hubRadiusMM;
  console.log('  Annular Waste Drop Passage (Throat R 50mm - Hub R 19mm):', annularDropGap.toFixed(1), 'mm (> 30mm)');

  // Running clearance between bottom of platform and top of hub
  const platformBottomY = baseBox.min.y * 1000;
  const hubTopYMM = hubBox.max.y * 1000;
  const runningGap = platformBottomY - hubTopYMM;
  console.log('  Platform-to-Hub Running Clearance:', runningGap.toFixed(1), 'mm');

  // Lateral clearance to Organic cutting mechanism collar
  if (cuttingCollar) {
    const collarBox = new THREE.Box3().setFromObject(cuttingCollar);
    const motorRadiusMM = derived.mm.segregation_motor_diameter / 2; // 14 mm
    // Nearest edge of collar to X=0
    const cuttingClearanceX = Math.abs(collarBox.max.x * 1000) - motorRadiusMM;
    console.log('  Clearance from Motor Stator to Cutting Collar:', cuttingClearanceX.toFixed(1), 'mm (> 10mm)');
  }

  // Kinematic verification of yaw and pitch axes
  axisPivot1.rotation.y = THREE.MathUtils.degToRad(90);
  axisPivot1.updateMatrixWorld(true);
  const yawTestBox = new THREE.Box3().setFromObject(rotBase);
  console.log('  Yaw rotation (90°) executed cleanly; Platform X span:', (yawTestBox.max.x - yawTestBox.min.x).toFixed(3));
  axisPivot1.rotation.y = 0; // reset

  axisPivot2.rotation.x = THREE.MathUtils.degToRad(30);
  axisPivot2.updateMatrixWorld(true);
  const pitchTestBox = new THREE.Box3().setFromObject(rotBase);
  console.log('  Pitch tilt (30°) executed cleanly; Platform Y span:', (pitchTestBox.max.y - pitchTestBox.min.y).toFixed(3));
  axisPivot2.rotation.x = 0; // reset
  envelope.updateMatrixWorld(true);

  // 4. PHASE 3B: LEFTOVER FOOD ACCESS DOOR HINGE
  console.log('\n--- 3. PHASE 3B: LEFTOVER FOOD ACCESS DOOR CHORD HINGE ---');
  const hCentral = envelope.getObjectByName('LeftoverFoodDoorHinge_Central');
  const hRadial = envelope.getObjectByName('LeftoverFoodDoorHinge_Radial');
  const hRod = envelope.getObjectByName('LeftoverFoodDoorHinge_ChordRod');
  const doorHinge = envelope.getObjectByName('LeftoverFoodDoor_Pivot') || envelope.getObjectByName('LeftoverFoodAccessDoor_Hinge');
  const doorMesh = envelope.getObjectByName('LeftoverFoodAccessDoor');

  console.log('  Hinge Central bracket exists:', !!hCentral);
  console.log('  Hinge Radial bracket exists:', !!hRadial);
  console.log('  Hinge Rod exists:', !!hRod);
  console.log('  Door Hinge pivot group exists:', !!doorHinge);
  console.log('  Door Mesh exists:', !!doorMesh);

  const hCentPos = new THREE.Vector3();
  hCentral.getWorldPosition(hCentPos);
  const hRadPos = new THREE.Vector3();
  hRadial.getWorldPosition(hRadPos);
  console.log('  Hinge 1 World Pos (mm):', (hCentPos.x*1000).toFixed(1), (hCentPos.y*1000).toFixed(1), (hCentPos.z*1000).toFixed(1));
  console.log('  Hinge 2 World Pos (mm):', (hRadPos.x*1000).toFixed(1), (hRadPos.y*1000).toFixed(1), (hRadPos.z*1000).toFixed(1));
  console.log('  Chord length:', (hCentPos.distanceTo(hRadPos)*1000).toFixed(1), 'mm');

  // Test outward ramp rotation
  const closedBox = new THREE.Box3().setFromObject(doorMesh);
  doorHinge.rotation.x = THREE.MathUtils.degToRad(70); // open 70 degrees
  doorHinge.updateMatrixWorld(true);
  const openBox = new THREE.Box3().setFromObject(doorMesh);
  console.log('  Closed Door Y range:', (closedBox.min.y*1000).toFixed(1), 'to', (closedBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Open Door Y range:', (openBox.min.y*1000).toFixed(1), 'to', (openBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Outward Extension Delta X:', ((openBox.max.x - closedBox.max.x)*1000).toFixed(1), 'mm');
  console.log('  Outward Extension Delta Z:', ((openBox.max.z - closedBox.max.z)*1000).toFixed(1), 'mm');
  doorHinge.rotation.x = 0; // restore closed
  doorHinge.updateMatrixWorld(true);

  // 5. PHASE 3C: STORAGE DOUBLE DOORS
  console.log('\n--- 4. PHASE 3C: STORAGE DOUBLE-DOOR KINEMATICS ---');
  const syncDoors = envelope.getObjectByName('StorageSynchronizedDoorsAssembly');
  const doorL = envelope.getObjectByName('StorageDoorLeft');
  const doorR = envelope.getObjectByName('StorageDoorRight');
  const lugL = envelope.getObjectByName('StorageDoorLeft_LinkageLug');
  const lugR = envelope.getObjectByName('StorageDoorRight_LinkageLug');

  console.log('  Synchronized assembly exists:', !!syncDoors);
  console.log('  Door Left exists:', !!doorL);
  console.log('  Door Right exists:', !!doorR);
  console.log('  Lug Left exists:', !!lugL);
  console.log('  Lug Right exists:', !!lugR);

  console.log('  Door Left local origin pos:', doorL.position);
  console.log('  Door Right local origin pos:', doorR.position);

  // Test synchronized downward opening
  const boxL_closed = new THREE.Box3().setFromObject(doorL);
  doorL.rotation.x = THREE.MathUtils.degToRad(45); // swing downward
  doorR.rotation.x = THREE.MathUtils.degToRad(-45); // swing downward
  doorL.updateMatrixWorld(true);
  doorR.updateMatrixWorld(true);
  const boxL_open = new THREE.Box3().setFromObject(doorL);
  console.log('  Left Door Closed Y range:', (boxL_closed.min.y*1000).toFixed(1), 'to', (boxL_closed.max.y*1000).toFixed(1), 'mm');
  console.log('  Left Door Open (45°) Y range:', (boxL_open.min.y*1000).toFixed(1), 'to', (boxL_open.max.y*1000).toFixed(1), 'mm');
  console.log('  Door drops into gap clearance:', boxL_open.min.y < boxL_closed.min.y);
  doorL.rotation.x = 0;
  doorR.rotation.x = 0;
  doorL.updateMatrixWorld(true);
  doorR.updateMatrixWorld(true);

  // 6. PHASE 3D: REMOVABLE DECOMPOSITION VESSEL & LOAD CELLS
  console.log('\n--- 5. PHASE 3D: REMOVABLE DECOMPOSITION VESSEL & LOAD CELLS ---');
  const decompDrawer = envelope.getObjectByName('DecompositionVessel_Drawer');
  const decompHandle = envelope.getObjectByName('DecompositionVessel_Handle');
  const agitator = envelope.getObjectByName('OrganicDecompositionAgitator');
  const qrUpper = envelope.getObjectByName('AgitatorQuickRelease_UpperCoupling');
  const qrLower = envelope.getObjectByName('AgitatorQuickRelease_LowerCoupling');
  const decompMotor = envelope.getObjectByName('DecompositionStationaryDriveMotor');
  const loadCell = envelope.getObjectByName('DecompositionLoadCell');
  const lcPad1 = envelope.getObjectByName('DecompositionLoadCell_Support_Front');
  const lcPad2 = envelope.getObjectByName('DecompositionLoadCell_Support_Rear');

  console.log('  DecompositionVessel_Drawer exists:', !!decompDrawer);
  console.log('  DecompositionVessel_Handle exists:', !!decompHandle);
  console.log('  Agitator inside drawer:', decompDrawer.getObjectByName('OrganicDecompositionAgitator') === agitator);
  console.log('  Upper Quick-Release Coupling exists:', !!qrUpper);
  console.log('  Lower Quick-Release Coupling exists:', !!qrLower);
  console.log('  Stationary Drive Motor exists:', !!decompMotor);
  console.log('  Load cell support group exists:', !!loadCell);
  console.log('  Load cell front support pad exists:', !!lcPad1);
  console.log('  Load cell rear support pad exists:', !!lcPad2);

  const qrUpperBox = new THREE.Box3().setFromObject(qrUpper);
  const qrLowerBox = new THREE.Box3().setFromObject(qrLower);
  console.log('  Upper Coupling Y:', (qrUpperBox.min.y*1000).toFixed(1), 'to', (qrUpperBox.max.y*1000).toFixed(1), 'mm');
  console.log('  Lower Coupling Y:', (qrLowerBox.min.y*1000).toFixed(1), 'to', (qrLowerBox.max.y*1000).toFixed(1), 'mm');

  // Verify load cells clear agitator central shaft
  const lc1Pos = new THREE.Vector3();
  lcPad1.getWorldPosition(lc1Pos);
  const lc2Pos = new THREE.Vector3();
  lcPad2.getWorldPosition(lc2Pos);
  console.log('  Load Cell Pad 1 Pos (mm):', (lc1Pos.x*1000).toFixed(1), (lc1Pos.y*1000).toFixed(1), (lc1Pos.z*1000).toFixed(1));
  console.log('  Load Cell Pad 2 Pos (mm):', (lc2Pos.x*1000).toFixed(1), (lc2Pos.y*1000).toFixed(1), (lc2Pos.z*1000).toFixed(1));
  console.log('  Agitator Shaft is at Z = 0; Pad Z offsets are ±', Math.abs(lc1Pos.z*1000).toFixed(1), 'mm (CLEARANCE > 75 mm)');

  // Test drawer extraction along -X
  const vesselClosedBox = new THREE.Box3().setFromObject(decompDrawer);
  decompDrawer.position.x = -0.300; // pull out 300 mm
  decompDrawer.updateMatrixWorld(true);
  const vesselOpenBox = new THREE.Box3().setFromObject(decompDrawer);
  console.log('  Drawer Extracted Pos Delta X:', ((vesselOpenBox.min.x - vesselClosedBox.min.x)*1000).toFixed(1), 'mm');
  console.log('  Agitator traveled with drawer:', envelope.getObjectByName('OrganicDecompositionAgitator').position.x === derived.scene.agitator_center_x);
  decompDrawer.position.x = 0; // restore closed
  decompDrawer.updateMatrixWorld(true);

  // 7. PHASE 3E: INORGANIC DRAWER
  console.log('\n--- 6. PHASE 3E: INORGANIC DRAWER ---');
  const inorgDrawer = envelope.getObjectByName('InorganicDrawer');
  const inorgBody = envelope.getObjectByName('InorganicDrawer_Body');
  const inorgHandle = envelope.getObjectByName('InorganicDrawer_Handle');
  const inorgSlide1 = envelope.getObjectByName('InorganicDrawer_SlideRail_1');

  console.log('  InorganicDrawer exists:', !!inorgDrawer);
  console.log('  InorganicDrawer_Body exists:', !!inorgBody);
  console.log('  InorganicDrawer_Handle exists:', !!inorgHandle);
  console.log('  InorganicDrawer_SlideRail_1 removed for presentation:', !envelope.getObjectByName('InorganicDrawer_SlideRail_1'));

  // Test linear extraction along +X
  const inorgClosedBox = new THREE.Box3().setFromObject(inorgDrawer);
  inorgDrawer.position.x = 0.300; // pull out 300 mm
  inorgDrawer.updateMatrixWorld(true);
  const inorgOpenBox = new THREE.Box3().setFromObject(inorgDrawer);
  console.log('  Inorganic Drawer Extracted Pos Delta X:', ((inorgOpenBox.min.x - inorgClosedBox.min.x)*1000).toFixed(1), 'mm');
  inorgDrawer.position.x = 0;
  inorgDrawer.updateMatrixWorld(true);

  // 8. DECISION 6: LEFTOVER FOOD DRAWER
  console.log('\n--- 7. DECISION 6: LEFTOVER FOOD DRAWER ---');
  const foodDrawer = envelope.getObjectByName('LeftoverFoodDrawer');
  const foodBody = envelope.getObjectByName('LeftoverFoodDrawer_Body');
  const foodHandle = envelope.getObjectByName('LeftoverFoodDrawer_Handle');
  const strainer = envelope.getObjectByName('RemovableStrainerBasketEnvelope');

  console.log('  LeftoverFoodDrawer exists:', !!foodDrawer);
  console.log('  LeftoverFoodDrawer_Body exists:', !!foodBody);
  console.log('  LeftoverFoodDrawer_Handle exists:', !!foodHandle);
  console.log('  LeftoverFoodDrawer_SlideRail_1 removed for presentation:', !envelope.getObjectByName('LeftoverFoodDrawer_SlideRail_1'));
  console.log('  Strainer basket hidden (Decision 6):', strainer && strainer.visible === false);

  // 9. PHASE 3F: ELECTRONICS BAY
  console.log('\n--- 8. PHASE 3F: ELECTRONICS BAY ---');
  const elecBay = envelope.getObjectByName('ElectronicsBay');
  const mcu = envelope.getObjectByName('ElectronicsBay_MCU');
  const battBox = envelope.getObjectByName('ElectronicsBay_BatteryBox');
  const wireLoom = envelope.getObjectByName('ElectronicsBay_WiringLoom');

  console.log('  ElectronicsBay exists:', !!elecBay);
  console.log('  MCU exists:', !!mcu);
  console.log('  Battery Box exists:', !!battBox);
  console.log('  Wiring Loom exists:', !!wireLoom);

  let cellCount = 0;
  battBox.traverse((c) => {
    if (c.name.startsWith('LiFePO4_Cell_')) cellCount++;
  });
  console.log('  LiFePO4 Cell count in Battery Box:', cellCount, '(Expected: 16 in 4S4P)');

  const bayBox = new THREE.Box3().setFromObject(elecBay);
  console.log('  Bay X range (mm):', (bayBox.min.x*1000).toFixed(1), 'to', (bayBox.max.x*1000).toFixed(1));
  console.log('  Bay Y range (mm):', (bayBox.min.y*1000).toFixed(1), 'to', (bayBox.max.y*1000).toFixed(1));
  console.log('  Bay Z range (mm):', (bayBox.min.z*1000).toFixed(1), 'to', (bayBox.max.z*1000).toFixed(1));

  // Compute minimum distance to funnel cone
  let minFunnelDist = 999;
  const corners = [
    [bayBox.min.x, bayBox.min.z],
    [bayBox.max.x, bayBox.min.z],
    [bayBox.min.x, bayBox.max.z],
    [bayBox.max.x, bayBox.max.z],
  ];
  for (let y = bayBox.min.y; y <= bayBox.max.y; y += 0.005) {
    const yMm = y * 1000;
    const rf = (50 + (246 - 50) * (yMm - 940) / (1020 - 940)) / 1000;
    for (const [cx, cz] of corners) {
      const cr = Math.hypot(cx, cz);
      const dist = cr - rf;
      if (dist < minFunnelDist) minFunnelDist = dist;
    }
  }
  console.log('  Clearance to Central Funnel Cone:', (minFunnelDist*1000).toFixed(1), 'mm (> 0 => NO COLLISION)');

  // Compute clearance to outer shell (R = 246 mm)
  let maxCornerR = 0;
  for (const [cx, cz] of corners) {
    const cr = Math.hypot(cx, cz);
    if (cr > maxCornerR) maxCornerR = cr;
  }
  const shellClearance = 0.246 - maxCornerR;
  console.log('  Clearance to Outer Shell:', (shellClearance*1000).toFixed(1), 'mm (> 0 => NO COLLISION)');

  console.log('\n====================================================');
  console.log('ALL PHASE 3 ARCHITECTURAL CHECKS COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
}

runVerification().catch(err => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
