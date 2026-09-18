import * as THREE from 'three';
import { GOMIKIN_DIMENSIONS } from '../utils/constants.js';

export function createHousing() {
  const housing = new THREE.Group();
  housing.name = 'Housing';

  const radius = GOMIKIN_DIMENSIONS.mainBodyDiameter / 2;
  const mainShellHeight = GOMIKIN_DIMENSIONS.mainShellHeight;
  const collarHeight = GOMIKIN_DIMENSIONS.topCollarHeight;
  const baseHeight = GOMIKIN_DIMENSIONS.bottomBaseHeight;
  const extendedRadius = radius * 1.05; // Slightly wider for collar and base

  // Materials
  const shellMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x98a1a8, // Brushed industrial aluminum
    roughness: 0.45,
    metalness: 0.4,
    side: THREE.DoubleSide
  });
  
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0x222426, // Slightly lighter dark metal to pop against background
    roughness: 0.7,
    metalness: 0.5,
    side: THREE.DoubleSide
  });

  // 1. BottomBase
  const baseGeo = new THREE.CylinderGeometry(extendedRadius, extendedRadius, baseHeight, 32);
  const bottomBase = new THREE.Mesh(baseGeo, accentMaterial);
  bottomBase.name = 'BottomBase';
  bottomBase.position.y = baseHeight / 2; // Sit on ground
  housing.add(bottomBase);

  // 2. MainShell (Open ended so it doesn't block the funnel view)
  const shellGeo = new THREE.CylinderGeometry(radius, radius, mainShellHeight, 32, 1, true);
  const mainShell = new THREE.Mesh(shellGeo, shellMaterial);
  mainShell.name = 'MainShell';
  mainShell.position.y = baseHeight + (mainShellHeight / 2);
  housing.add(mainShell);

  // 3. TopCollar (modified to be an open circular rim)
  const collarGeo = new THREE.CylinderGeometry(extendedRadius, extendedRadius, collarHeight, 32, 1, true);
  const topCollar = new THREE.Mesh(collarGeo, accentMaterial);
  topCollar.name = 'TopCollar';
  topCollar.position.y = baseHeight + mainShellHeight + (collarHeight / 2);
  housing.add(topCollar);

  // 4. InputSection
  const inputSection = new THREE.Group();
  inputSection.name = 'InputSection';
  inputSection.position.y = baseHeight + mainShellHeight + collarHeight; // Position at the very top of the collar
  
  const funnelMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888, // Lighter color so the sloped funnel geometry is clearly visible
    roughness: 0.8,
    metalness: 0.3,
    side: THREE.DoubleSide
  });

  // 4a. ReceivingFunnel
  const funnelBottomRadius = GOMIKIN_DIMENSIONS.funnelBottomRadius;
  const funnelGeo = new THREE.CylinderGeometry(extendedRadius, funnelBottomRadius, collarHeight, 32, 1, true);
  const receivingFunnel = new THREE.Mesh(funnelGeo, funnelMaterial);
  receivingFunnel.name = 'ReceivingFunnel';
  receivingFunnel.position.y = -collarHeight / 2; // Pushes it down into the collar
  inputSection.add(receivingFunnel);

  // 4b. FunnelCenter
  const funnelCenter = new THREE.Group();
  funnelCenter.name = 'FunnelCenter';
  funnelCenter.position.y = -collarHeight; // At the bottom opening of the funnel
  inputSection.add(funnelCenter);

  // 4c. CameraAssembly
  const cameraAssembly = new THREE.Group();
  cameraAssembly.name = 'CameraAssembly';
  cameraAssembly.position.y = GOMIKIN_DIMENSIONS.cameraHeightOffset; // Floating above the funnel

  // Cross beam to hold camera and sensor
  const beamGeo = new THREE.BoxGeometry(extendedRadius * 2, 0.02, 0.04);
  const beamMesh = new THREE.Mesh(beamGeo, accentMaterial);
  cameraAssembly.add(beamMesh);

  // Camera Body
  const cameraBodyGeo = new THREE.BoxGeometry(0.06, 0.04, 0.06);
  const cameraBodyMesh = new THREE.Mesh(cameraBodyGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
  cameraAssembly.add(cameraBodyMesh);
  
  // Camera Lens
  const lensGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16);
  const lensMesh = new THREE.Mesh(lensGeo, new THREE.MeshStandardMaterial({ color: 0x000000 }));
  lensMesh.position.y = -0.02; // Pointing downwards
  cameraAssembly.add(lensMesh);
  
  inputSection.add(cameraAssembly);

  // 4d. UltrasonicSensor
  const ultrasonicSensor = new THREE.Group();
  ultrasonicSensor.name = 'UltrasonicSensor';
  ultrasonicSensor.position.set(-0.1, GOMIKIN_DIMENSIONS.cameraHeightOffset, 0); // Mounted on the beam next to the camera

  // Sensor Body
  const sensorBodyGeo = new THREE.BoxGeometry(0.05, 0.03, 0.03);
  const sensorBodyMesh = new THREE.Mesh(sensorBodyGeo, new THREE.MeshStandardMaterial({ color: 0x444444 }));
  ultrasonicSensor.add(sensorBodyMesh);

  // Sensor Eyes
  const eyeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 16);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
  const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
  eye1.position.set(0.012, -0.015, 0);
  const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
  eye2.position.set(-0.012, -0.015, 0);
  ultrasonicSensor.add(eye1);
  ultrasonicSensor.add(eye2);

  inputSection.add(ultrasonicSensor);

  // 4e. ClassificationMechanism
  const classificationMechanism = new THREE.Group();
  classificationMechanism.name = 'ClassificationMechanism';
  // Position it securely on the beam (positive X side) near the camera
  classificationMechanism.position.set(0.18, GOMIKIN_DIMENSIONS.cameraHeightOffset, 0); 

  // ProcessingUnit (rectangular enclosure)
  const processingUnitGeo = new THREE.BoxGeometry(0.12, 0.04, 0.08);
  const processingUnitMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a, // dark industrial material
    roughness: 0.7,
    metalness: 0.3
  });
  const processingUnit = new THREE.Mesh(processingUnitGeo, processingUnitMat);
  processingUnit.name = 'ProcessingUnit';
  classificationMechanism.add(processingUnit);

  // Subtle ventilation pattern details
  const ventGeo = new THREE.BoxGeometry(0.06, 0.002, 0.005);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let i = 0; i < 4; i++) {
    const vent = new THREE.Mesh(ventGeo, ventMat);
    // slightly above the top face
    vent.position.set(-0.01, 0.02, -0.02 + i * 0.013);
    classificationMechanism.add(vent);
  }

  // ClassificationStatusLED
  const ledGeo = new THREE.SphereGeometry(0.004, 16, 16);
  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x00ff00, // active status color
    emissive: 0x00ff00,
    emissiveIntensity: 0.8
  });
  const classificationStatusLED = new THREE.Mesh(ledGeo, ledMat);
  classificationStatusLED.name = 'ClassificationStatusLED';
  // Place near the corner on top of the enclosure
  classificationStatusLED.position.set(0.04, 0.02, 0.02);
  classificationMechanism.add(classificationStatusLED);

  inputSection.add(classificationMechanism);

  // 4f. SegregationMechanism
  const segregationMechanism = new THREE.Group();
  segregationMechanism.name = 'SegregationMechanism';
  // Positioned directly below the funnel opening
  segregationMechanism.position.y = -collarHeight - 0.10; 
  
  // Pivot group for the flap
  const sortingFlap = new THREE.Group();
  sortingFlap.name = 'SortingFlap';
  
  // The actual flap plate (thin in X, tall in Y, wide in Z)
  const plateGeo = new THREE.BoxGeometry(0.01, 0.12, 0.12);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    roughness: 0.5,
    metalness: 0.4
  });
  const flapPlate = new THREE.Mesh(plateGeo, plateMat);
  flapPlate.name = 'FlapPlate';
  // Offset so the bottom edge is at the pivot (y=0)
  flapPlate.position.y = 0.06;
  sortingFlap.add(flapPlate);
  
  // Set default rotation so it sits diagonally across the waste path (forming a ramp)
  sortingFlap.rotation.z = Math.PI / 4; 
  
  segregationMechanism.add(sortingFlap);

  // FlapHinge (visual representation of the hinge at the pivot point)
  const hingeGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.14, 16);
  const hingeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const flapHinge = new THREE.Mesh(hingeGeo, hingeMat);
  flapHinge.name = 'FlapHinge';
  flapHinge.rotation.x = Math.PI / 2; // Lie along Z axis
  segregationMechanism.add(flapHinge);

  // ServoMotor
  const servoGeo = new THREE.BoxGeometry(0.04, 0.05, 0.05);
  const servoMat = new THREE.MeshStandardMaterial({ color: 0x1a4a7a }); // Industrial blue
  const servoMotor = new THREE.Mesh(servoGeo, servoMat);
  servoMotor.name = 'ServoMotor';
  // Positioned beside the hinge along the Z axis (back side)
  servoMotor.position.set(0, 0, -0.095);
  segregationMechanism.add(servoMotor);

  // ServoArm
  const servoArmGeo = new THREE.BoxGeometry(0.015, 0.03, 0.01);
  const servoArmMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const servoArm = new THREE.Mesh(servoArmGeo, servoArmMat);
  servoArm.name = 'ServoArm';
  // Connects servo to the hinge
  servoArm.position.set(0, 0, -0.075);
  segregationMechanism.add(servoArm);

  inputSection.add(segregationMechanism);

  housing.add(inputSection);

  // Reusable transparent material for internal chambers (so we can see future mechanisms inside)
  const chamberMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    transparent: true,
    opacity: 0.2,
    depthWrite: false, // Prevents rendering artifacts between transparent objects
    side: THREE.DoubleSide
  });

  // 5. OrganicChamber (#18)
  const organicChamber = new THREE.Group();
  organicChamber.name = 'OrganicChamber';
  organicChamber.position.set(0, 0.9, 0); // Centered vertically in the available 1.4-unit internal space

  // Using a rectangular box for simplicity, scaled to fit inside the left (-X) half of the cylinder
  const orgGeo = new THREE.BoxGeometry(0.28, 1.2, 0.36);
  const organicChamberBody = new THREE.Mesh(orgGeo, chamberMaterial);
  organicChamberBody.name = 'OrganicChamberBody';
  // Positioned on the left side, slightly back
  organicChamberBody.position.set(-0.16, 0, -0.05);
  organicChamber.add(organicChamberBody);

  // 5a. PreprocessSection (#30)
  const preprocessSection = new THREE.Group();
  preprocessSection.name = 'PreprocessSection';
  // Positioned in the upper part of the Organic Chamber, centered in its volume
  preprocessSection.position.set(-0.16, 0.35, -0.05);

  // CuttingMechanism (#9)
  const cuttingMechanism = new THREE.Group();
  cuttingMechanism.name = 'CuttingMechanism';

  // CuttingMotor
  const motorGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x224466 }); // Dark blue industrial motor
  const cuttingMotor = new THREE.Mesh(motorGeo, motorMat);
  cuttingMotor.name = 'CuttingMotor';
  cuttingMotor.position.y = 0.15; // Mounted top
  cuttingMechanism.add(cuttingMotor);

  // CuttingShaft
  const shaftGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.15, 8);
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
  const cuttingShaft = new THREE.Mesh(shaftGeo, shaftMat);
  cuttingShaft.name = 'CuttingShaft';
  cuttingShaft.position.y = 0.05; // Connects motor and blades
  cuttingMechanism.add(cuttingShaft);

  // CuttingBlades
  const cuttingBlades = new THREE.Group();
  cuttingBlades.name = 'CuttingBlades';
  // The group's origin is exactly at the center of the vertical shaft (y=0 locally),
  // which will allow simple rotation around the Y axis for animation.
  cuttingBlades.position.y = 0; 
  
  // Create 4 shear blades (cross configuration)
  const bladeGeo = new THREE.BoxGeometry(0.20, 0.015, 0.03); // Long, thin blades
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 });
  
  const blade1 = new THREE.Mesh(bladeGeo, bladeMat);
  blade1.rotation.x = Math.PI / 6; // Slight shear angle
  cuttingBlades.add(blade1);
  
  const blade2 = new THREE.Mesh(bladeGeo, bladeMat);
  blade2.rotation.y = Math.PI / 2; // Perpendicular
  blade2.rotation.x = Math.PI / 6;
  cuttingBlades.add(blade2);
  
  cuttingMechanism.add(cuttingBlades);
  preprocessSection.add(cuttingMechanism);

  // SizingMesh
  // Using GridHelper to efficiently visually communicate a horizontal perforated screen
  const sizingMesh = new THREE.GridHelper(0.24, 12, 0x333333, 0x333333);
  sizingMesh.name = 'SizingMesh';
  sizingMesh.position.y = -0.06; // Directly below the blades
  preprocessSection.add(sizingMesh);

  organicChamber.add(preprocessSection);

  // 5b. StorageSection (#22)
  const storageSection = new THREE.Group();
  storageSection.name = 'StorageSection';
  // Positioned directly below PreprocessSection. 
  storageSection.position.set(-0.16, 0.15, -0.05);

  // StorageChamber
  // Using a simple semi-transparent box to clearly define the holding area volume.
  const storageGeo = new THREE.BoxGeometry(0.24, 0.15, 0.24);
  const storageChamber = new THREE.Mesh(storageGeo, chamberMaterial);
  storageChamber.name = 'StorageChamber';
  storageChamber.position.y = 0.075; // Centers the box above the door mechanism
  storageSection.add(storageChamber);

  // DrainageScreen
  // Horizontal perforated screen using GridHelper for efficiency
  const drainageScreen = new THREE.GridHelper(0.24, 12, 0x444466, 0x444466);
  drainageScreen.name = 'DrainageScreen';
  drainageScreen.position.y = 0.02; // Near the bottom of the chamber
  storageSection.add(drainageScreen);

  // DoorMechanism (#8)
  const doorMechanism = new THREE.Group();
  doorMechanism.name = 'DoorMechanism';
  doorMechanism.position.y = 0; // Baseline of the storage section

  const doorPanelGeo = new THREE.BoxGeometry(0.14, 0.01, 0.24); // Width 0.14 to reach center from edges
  const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5, roughness: 0.5 });
  const doorHingeGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.24, 16);
  const doorHingeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  // Left Door and Hinge
  const leftHinge = new THREE.Mesh(doorHingeGeo, doorHingeMat);
  leftHinge.name = 'LeftHinge';
  leftHinge.rotation.x = Math.PI / 2; // Lie along Z axis
  leftHinge.position.set(-0.12, 0, 0); // Positioned at left edge
  doorMechanism.add(leftHinge);

  const leftDoor = new THREE.Group();
  leftDoor.name = 'LeftDoor';
  leftDoor.position.set(-0.12, 0, 0); // Pivot exactly at hinge axis

  const leftDoorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
  leftDoorPanel.name = 'LeftDoorPanel';
  leftDoorPanel.position.set(0.07, 0, 0); // Offset so left edge connects to pivot
  leftDoor.add(leftDoorPanel);
  
  leftDoor.rotation.z = -Math.PI / 6; // Closed position (sloped down, V-shape)
  doorMechanism.add(leftDoor);

  // Right Door and Hinge
  const rightHinge = new THREE.Mesh(doorHingeGeo, doorHingeMat);
  rightHinge.name = 'RightHinge';
  rightHinge.rotation.x = Math.PI / 2;
  rightHinge.position.set(0.12, 0, 0); // Positioned at right edge
  doorMechanism.add(rightHinge);

  const rightDoor = new THREE.Group();
  rightDoor.name = 'RightDoor';
  rightDoor.position.set(0.12, 0, 0); // Pivot exactly at hinge axis

  const rightDoorPanel = new THREE.Mesh(doorPanelGeo, doorPanelMat);
  rightDoorPanel.name = 'RightDoorPanel';
  rightDoorPanel.position.set(-0.07, 0, 0); // Offset so right edge connects to pivot
  rightDoor.add(rightDoorPanel);
  
  rightDoor.rotation.z = Math.PI / 6; // Closed position (sloped down, V-shape)
  doorMechanism.add(rightDoor);

  storageSection.add(doorMechanism);

  organicChamber.add(storageSection);

  // 5c. DecompositionSection (#23)
  const decompositionSection = new THREE.Group();
  decompositionSection.name = 'DecompositionSection';
  // Positioned directly below the door mechanism of the StorageSection
  decompositionSection.position.set(-0.16, -0.15, -0.05);

  // 5c-1. ThermophilicDecompositionSection (#31)
  const thermophilicSection = new THREE.Group();
  thermophilicSection.name = 'ThermophilicDecompositionSection';
  
  // Use a slightly warm-tinted transparent material to visually distinguish the active biological area
  const thermoMaterial = new THREE.MeshStandardMaterial({
    color: 0x665544,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const decompGeo = new THREE.BoxGeometry(0.26, 0.60, 0.34);
  const decompChamber = new THREE.Mesh(decompGeo, thermoMaterial);
  decompChamber.name = 'DecompositionChamber';
  // Center it vertically within the section
  decompChamber.position.y = -0.15;
  thermophilicSection.add(decompChamber);

  // 5c-2. RotatingMechanism (#11)
  const rotatingMechanism = new THREE.Group();
  rotatingMechanism.name = 'RotatingMechanism';
  // Placed in the lower portion of the chamber.
  // The group's local origin acts as the vertical pivot (Y axis) for the entire agitation assembly.
  rotatingMechanism.position.set(0, -0.25, 0); 

  // DecompositionMotor
  const decompMotorGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 16);
  const decompMotorMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Dark industrial motor look
  const decompositionMotor = new THREE.Mesh(decompMotorGeo, decompMotorMat);
  decompositionMotor.name = 'DecompositionMotor';
  decompositionMotor.position.y = -0.16; // Mounted at the bottom of the mechanism
  rotatingMechanism.add(decompositionMotor);

  // RotatingShaft
  const decompShaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.28, 8);
  const decompShaftMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.6, roughness: 0.4 });
  const rotatingShaft = new THREE.Mesh(decompShaftGeo, decompShaftMat);
  rotatingShaft.name = 'RotatingShaft';
  rotatingShaft.position.y = 0.02; // Rises vertically from the motor
  rotatingMechanism.add(rotatingShaft);

  // AgitationBlades
  const agitationBlades = new THREE.Group();
  agitationBlades.name = 'AgitationBlades';
  agitationBlades.position.y = 0.02; // Centered on the shaft

  // Wider, blunt paddle-like blades designed specifically for mixing, not cutting
  const paddleGeo = new THREE.BoxGeometry(0.22, 0.04, 0.06); 
  const paddleMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.4, roughness: 0.6 });

  const paddle1 = new THREE.Mesh(paddleGeo, paddleMat);
  paddle1.rotation.x = Math.PI / 4; // pitched like a mixing paddle
  paddle1.position.y = 0.06; // upper paddle
  agitationBlades.add(paddle1);

  const paddle2 = new THREE.Mesh(paddleGeo, paddleMat);
  paddle2.rotation.y = Math.PI / 2; // perpendicular to the first paddle
  paddle2.rotation.x = Math.PI / 4; // pitched
  paddle2.position.y = -0.06; // lower paddle
  agitationBlades.add(paddle2);

  rotatingMechanism.add(agitationBlades);

  thermophilicSection.add(rotatingMechanism);
  thermophilicSection.add(rotatingMechanism);

  // --- ADDITIONAL PROCESSING HARDWARE ---

  // 1. MicrobesDispenser (#14)
  const microbesDispenser = new THREE.Group();
  microbesDispenser.name = 'MicrobesDispenser';
  microbesDispenser.position.set(0, 0.18, -0.12); // Mounted above DecompositionChamber, towards the back

  const microbeCartridgeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.06, 16);
  const microbeCartridgeMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Greenish to suggest biology
  const microbeCartridge = new THREE.Mesh(microbeCartridgeGeo, microbeCartridgeMat);
  microbeCartridge.name = 'MicrobeCartridge';
  microbesDispenser.add(microbeCartridge);

  const dispenserActuatorGeo = new THREE.BoxGeometry(0.03, 0.02, 0.03);
  const dispenserActuator = new THREE.Mesh(dispenserActuatorGeo, new THREE.MeshStandardMaterial({ color: 0x333333 }));
  dispenserActuator.name = 'DispenserActuator';
  dispenserActuator.position.y = -0.04;
  microbesDispenser.add(dispenserActuator);

  const dispenserOutletGeo = new THREE.CylinderGeometry(0.005, 0.002, 0.02, 8);
  const dispenserOutlet = new THREE.Mesh(dispenserOutletGeo, new THREE.MeshStandardMaterial({ color: 0x999999 }));
  dispenserOutlet.name = 'DispenserOutlet';
  dispenserOutlet.position.y = -0.06;
  microbesDispenser.add(dispenserOutlet);

  decompositionSection.add(microbesDispenser);

  // 2. CarbonDosingMechanism (#15)
  const carbonDosingMechanism = new THREE.Group();
  carbonDosingMechanism.name = 'CarbonDosingMechanism';
  carbonDosingMechanism.position.set(-0.08, 0.16, -0.12); // Mounted near microbe dispenser

  const carbonCartridgeGeo = new THREE.BoxGeometry(0.04, 0.05, 0.04);
  const carbonCartridgeMat = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Dark for carbon
  const carbonCartridge = new THREE.Mesh(carbonCartridgeGeo, carbonCartridgeMat);
  carbonCartridge.name = 'CarbonCartridge';
  carbonDosingMechanism.add(carbonCartridge);

  const carbonAugerGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8);
  const carbonAuger = new THREE.Mesh(carbonAugerGeo, new THREE.MeshStandardMaterial({ color: 0x555555 }));
  carbonAuger.name = 'CarbonAuger';
  carbonAuger.position.y = -0.035;
  carbonDosingMechanism.add(carbonAuger);

  const carbonOutletGeo = new THREE.CylinderGeometry(0.008, 0.004, 0.02, 8);
  const carbonOutlet = new THREE.Mesh(carbonOutletGeo, new THREE.MeshStandardMaterial({ color: 0x777777 }));
  carbonOutlet.name = 'CarbonOutlet';
  carbonOutlet.position.y = -0.06;
  carbonDosingMechanism.add(carbonOutlet);

  decompositionSection.add(carbonDosingMechanism);

  // 3. Nozzle (#28)
  const nozzle = new THREE.Group();
  nozzle.name = 'Nozzle';
  nozzle.position.set(0.1, 0.1, 0); // Near upper portion

  const nozzlePipe = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
  nozzlePipe.rotation.z = Math.PI / 2; // Pointing inward
  nozzle.add(nozzlePipe);

  const nozzleHead = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.01, 8), new THREE.MeshStandardMaterial({ color: 0xc0c0c0 }));
  nozzleHead.position.x = -0.015;
  nozzleHead.rotation.z = Math.PI / 2;
  nozzle.add(nozzleHead);

  decompositionSection.add(nozzle);

  // 4. Fan (#10)
  const fan = new THREE.Group();
  fan.name = 'Fan';
  fan.position.set(-0.13, 0.05, 0.1); // Upper side/back
  
  const fanHousingGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.01, 16);
  const fanHousingMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const fanHousing = new THREE.Mesh(fanHousingGeo, fanHousingMat);
  fanHousing.name = 'FanHousing';
  fanHousing.rotation.z = Math.PI / 2;
  fan.add(fanHousing);

  const fanRotor = new THREE.Group();
  fanRotor.name = 'FanRotor';
  fanRotor.rotation.z = Math.PI / 2; // match housing

  const fanRotorHub = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.012, 16), new THREE.MeshStandardMaterial({ color: 0x555555 }));
  fanRotor.add(fanRotorHub);

  const fanBlades = new THREE.Group();
  fanBlades.name = 'FanBlades';
  const fanBladeGeo = new THREE.BoxGeometry(0.04, 0.002, 0.01);
  const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(fanBladeGeo, fanBladeMat);
    blade.rotation.y = (i * Math.PI) / 2;
    blade.rotation.x = Math.PI / 6; // pitch
    fanBlades.add(blade);
  }
  fanRotor.add(fanBlades);
  fan.add(fanRotor);

  decompositionSection.add(fan);

  // 5. TemperatureSensor (#4)
  const temperatureSensor = new THREE.Group();
  temperatureSensor.name = 'TemperatureSensor';
  temperatureSensor.position.set(0.08, -0.1, -0.05); // Inside processing region

  const tempProbeGeo = new THREE.CylinderGeometry(0.002, 0.002, 0.04, 8);
  const tempProbe = new THREE.Mesh(tempProbeGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
  tempProbe.rotation.z = Math.PI / 2;
  temperatureSensor.add(tempProbe);
  
  thermophilicSection.add(temperatureSensor);

  // 6. MoistureSensor (#5)
  const moistureSensor = new THREE.Group();
  moistureSensor.name = 'MoistureSensor';
  moistureSensor.position.set(-0.08, -0.15, 0.05); // Inside processing region, away from temp sensor

  const moistProbeGeo = new THREE.CylinderGeometry(0.003, 0.001, 0.03, 8);
  const moistProbe = new THREE.Mesh(moistProbeGeo, new THREE.MeshStandardMaterial({ color: 0xddaa55, metalness: 0.6 }));
  moistProbe.rotation.x = Math.PI / 2;
  moistureSensor.add(moistProbe);

  thermophilicSection.add(moistureSensor);

  // 7. CO2Sensor (#32)
  const co2Sensor = new THREE.Group();
  co2Sensor.name = 'CO2Sensor';
  co2Sensor.position.set(0.05, 0.1, 0.1); // Upper region
  
  const co2Box = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x113355 }));
  co2Sensor.add(co2Box);
  
  thermophilicSection.add(co2Sensor);

  // 8. LoadCell (#33)
  const loadCell = new THREE.Group();
  loadCell.name = 'LoadCell';
  // Placed directly beneath the primary decomposition chamber support
  // Chamber goes down to Y = -0.45 relative to decompositionSection
  loadCell.position.set(0, -0.48, 0);

  const loadCellBodyGeo = new THREE.BoxGeometry(0.08, 0.03, 0.04);
  const loadCellBodyMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.4 });
  const loadCellBody = new THREE.Mesh(loadCellBodyGeo, loadCellBodyMat);
  loadCell.add(loadCellBody);

  const loadCellMount = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  loadCellMount.position.y = 0.02;
  loadCell.add(loadCellMount);

  decompositionSection.add(loadCell);

  decompositionSection.add(thermophilicSection);
  organicChamber.add(decompositionSection);



  housing.add(organicChamber);


  // 6. InorganicChamber (#19)
  const inorganicChamber = new THREE.Group();
  inorganicChamber.name = 'InorganicChamber';
  inorganicChamber.position.set(0, 0.9, 0);

  // Scaled to fit inside the right (+X) half of the cylinder
  const inorgGeo = new THREE.BoxGeometry(0.28, 1.2, 0.36);
  const inorganicChamberBody = new THREE.Mesh(inorgGeo, chamberMaterial);
  inorganicChamberBody.name = 'InorganicChamberBody';
  // Positioned on the right side, slightly back
  inorganicChamberBody.position.set(0.16, 0, -0.05);
  inorganicChamber.add(inorganicChamberBody);

  // 8. SegregatedOutputSection (#27)
  const segregatedOutputSection = new THREE.Group();
  segregatedOutputSection.name = 'SegregatedOutputSection';
  // Positioned at the lower end of the inorganic chamber
  segregatedOutputSection.position.set(0.16, -0.45, -0.05);
  
  const outputDividers = new THREE.Group();
  outputDividers.name = 'OutputDividers';
  
  const dividerMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  // Add two vertical walls to create 3 compartments
  const div1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.2, 0.36), dividerMat);
  div1.position.set(-0.04, 0.1, 0);
  outputDividers.add(div1);
  const div2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.2, 0.36), dividerMat);
  div2.position.set(0.04, 0.1, 0);
  outputDividers.add(div2);
  
  segregatedOutputSection.add(outputDividers);
  inorganicChamber.add(segregatedOutputSection);

  housing.add(inorganicChamber);

  // 7. LeftoverFoodChamber (#20)
  const leftoverFoodChamber = new THREE.Group();
  leftoverFoodChamber.name = 'LeftoverFoodChamber';
  leftoverFoodChamber.position.set(0, 0.9, 0);

  // Front-loading drawer positioned near the front (+Z)
  const foodGeo = new THREE.BoxGeometry(0.25, 0.3, 0.2);
  const foodChamberBody = new THREE.Mesh(foodGeo, chamberMaterial);
  foodChamberBody.name = 'FoodChamberBody';
  // Positioned high up and to the front
  foodChamberBody.position.set(0, 0.35, 0.25);
  leftoverFoodChamber.add(foodChamberBody);
  housing.add(leftoverFoodChamber);

  // 9. OutputSection (#24)
  const outputSection = new THREE.Group();
  outputSection.name = 'OutputSection';
  outputSection.position.set(-0.16, 0.25, -0.05); // Just below Decomposition
  
  const outputRegionGeo = new THREE.BoxGeometry(0.24, 0.1, 0.28);
  const outputRegionMat = new THREE.MeshStandardMaterial({ color: 0x445544, transparent: true, opacity: 0.3 });
  const outputRegion = new THREE.Mesh(outputRegionGeo, outputRegionMat);
  outputSection.add(outputRegion);
  housing.add(outputSection);

  // 10. LeachateTray (#29)
  const leachateTray = new THREE.Group();
  leachateTray.name = 'LeachateTray';
  // Placed at the lowest practical point, pulling out toward +Z
  leachateTray.position.set(0, 0.10, 0.1); 
  
  const trayBodyGeo = new THREE.BoxGeometry(0.3, 0.05, 0.25);
  const trayBodyMat = new THREE.MeshStandardMaterial({ color: 0x223344 });
  const trayBody = new THREE.Mesh(trayBodyGeo, trayBodyMat);
  trayBody.name = 'TrayBody';
  leachateTray.add(trayBody);
  housing.add(leachateTray);

  // 11. LeachateSection (#25)
  const leachateSection = new THREE.Group();
  leachateSection.name = 'LeachateSection';
  leachateSection.position.set(0, 0.2, 0); // Above the tray
  
  const leachateChannelGeo = new THREE.BoxGeometry(0.32, 0.02, 0.28);
  const leachateChannelMat = new THREE.MeshStandardMaterial({ color: 0x334455 });
  const leachateChannel = new THREE.Mesh(leachateChannelGeo, leachateChannelMat);
  leachateSection.add(leachateChannel);
  
  // OutletPipe (#26)
  const outletPipe = new THREE.Group();
  outletPipe.name = 'OutletPipe';
  
  // OrganicOutletPipe routes liquid from organic side down to LeachateSection
  const outletPipeMat = new THREE.MeshStandardMaterial({ color: 0x556677 });
  const orgPipeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.75, 8);
  const organicOutletPipe = new THREE.Mesh(orgPipeGeo, outletPipeMat);
  organicOutletPipe.name = 'OrganicOutletPipe';
  organicOutletPipe.position.set(-0.32, 0.375, -0.05); // Run down the outside of decomposition chamber
  outletPipe.add(organicOutletPipe);

  // FoodOutletPipe routes liquid from LeftoverFoodChamber down
  const foodPipeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.95, 8);
  const foodOutletPipe = new THREE.Mesh(foodPipeGeo, outletPipeMat);
  foodOutletPipe.name = 'FoodOutletPipe';
  foodOutletPipe.position.set(0.08, 0.475, 0.25); // Alongside the leftover food chamber
  outletPipe.add(foodOutletPipe);
  
  leachateSection.add(outletPipe);
  housing.add(leachateSection);

  // --- EXTERIOR / CONTROL HARDWARE ---

  // 12. MainControlUnit (#1)
  const mainControlUnit = new THREE.Group();
  mainControlUnit.name = 'MainControlUnit';
  mainControlUnit.position.set(0, 1.5, -0.38); // Inside upper back wall

  const mcuBoxGeo = new THREE.BoxGeometry(0.15, 0.2, 0.04);
  const mcuBoxMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
  const mcuBox = new THREE.Mesh(mcuBoxGeo, mcuBoxMat);
  mainControlUnit.add(mcuBox);

  const pcbGeo = new THREE.BoxGeometry(0.12, 0.16, 0.005);
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x004400 }); // Green PCB
  const pcb = new THREE.Mesh(pcbGeo, pcbMat);
  pcb.position.z = 0.02; // surface
  mainControlUnit.add(pcb);
  
  housing.add(mainControlUnit);

  // 13. SafetyInterlockSwitches (#6)
  const safetyInterlockSwitches = new THREE.Group();
  safetyInterlockSwitches.name = 'SafetyInterlockSwitches';
  
  const switchGeo = new THREE.BoxGeometry(0.02, 0.04, 0.02);
  const switchMat = new THREE.MeshStandardMaterial({ color: 0x882222 }); // Red safety switch

  const switch1 = new THREE.Mesh(switchGeo, switchMat);
  switch1.position.set(0.2, 0.2, 0.38); // Near lower right service area
  safetyInterlockSwitches.add(switch1);

  const switch2 = new THREE.Mesh(switchGeo, switchMat);
  switch2.position.set(-0.2, 0.2, 0.38); // Near lower left service area
  safetyInterlockSwitches.add(switch2);

  housing.add(safetyInterlockSwitches);

  // 14. UserInteractionDevice (#12)
  const userInteractionDevice = new THREE.Group();
  userInteractionDevice.name = 'UserInteractionDevice';
  userInteractionDevice.position.set(0, 1.4, 0.4); // Exterior front

  const uidPanel = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.02), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  userInteractionDevice.add(uidPanel);

  const oledDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.01), new THREE.MeshStandardMaterial({ color: 0x050505 }));
  oledDisplay.name = 'OLEDDisplay';
  oledDisplay.position.set(0, 0.05, 0.01);
  userInteractionDevice.add(oledDisplay);

  const buttonGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.01, 16);
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x777777 });
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(buttonGeo, buttonMat);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(-0.05 + (i * 0.05), -0.04, 0.01);
    userInteractionDevice.add(btn);
  }

  const statusIndicator = new THREE.Mesh(new THREE.SphereGeometry(0.005, 16, 16), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
  statusIndicator.position.set(0, -0.08, 0.012);
  userInteractionDevice.add(statusIndicator);

  housing.add(userInteractionDevice);

  // 15. HeatingElement (#13)
  const heatingElement = new THREE.Group();
  heatingElement.name = 'HeatingElement';
  heatingElement.position.set(-0.16, 0.75, -0.05); // Centered around thermophilic section

  // Create 3 toroidal coils
  const coilMat = new THREE.MeshStandardMaterial({ color: 0xaa4422, metalness: 0.6, roughness: 0.5 });
  for (let i = -1; i <= 1; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.006, 8, 32), coilMat);
    coil.rotation.x = Math.PI / 2;
    coil.position.y = i * 0.15;
    heatingElement.add(coil);
  }
  housing.add(heatingElement);

  // 16. InsulatingLayer (#21)
  const insulatingLayerGeo = new THREE.CylinderGeometry(0.395, 0.395, 1.48, 32, 1, true);
  const insulatingLayerMat = new THREE.MeshStandardMaterial({
    color: 0xffffdd,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const insulatingLayer = new THREE.Mesh(insulatingLayerGeo, insulatingLayerMat);
  insulatingLayer.name = 'InsulatingLayer';
  insulatingLayer.position.y = 0.89; // Centered
  housing.add(insulatingLayer);

  // 17. RealTimeClock (#34)
  const realTimeClock = new THREE.Group();
  realTimeClock.name = 'RealTimeClock';
  realTimeClock.position.set(0.08, 1.45, -0.37); // Near MCU

  const rtcBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  realTimeClock.add(rtcBox);
  
  const rtcCrystal = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  rtcCrystal.position.set(-0.01, 0, 0.012);
  rtcCrystal.rotation.x = Math.PI / 2;
  realTimeClock.add(rtcCrystal);

  housing.add(realTimeClock);

  // 18. JamDetector (#35)
  const jamDetector = new THREE.Group();
  jamDetector.name = 'JamDetector';
  jamDetector.position.set(-0.25, 1.25, -0.05); // Near the preprocess section mesh

  const jamSensorBody = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x4422aa }));
  jamDetector.add(jamSensorBody);
  
  const jamProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.04, 8), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  jamProbe.rotation.z = Math.PI / 2;
  jamProbe.position.x = 0.02; // Pointing inward toward the mesh
  jamDetector.add(jamProbe);

  housing.add(jamDetector);

  // Developer function to toggle main shell visibility for cutaway views
  housing.toggleShellVisibility = function(visible) {
    const shell = housing.getObjectByName('MainShell');
    if (shell) {
      shell.visible = visible;
    }
  };

  return housing;
}
