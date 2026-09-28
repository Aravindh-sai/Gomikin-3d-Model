import * as THREE from 'three';

/**
 * Authoritative Module Definitions derived from Master Geometry, Blueprint, and Design Specs.
 * Strictly uses existing Three.js nodes in GomikinEnvelope without moving or altering geometry.
 */
export const GOMIKIN_MODULES = [
  {
    id: 'all',
    name: 'Full Apparatus (All Modules)',
    icon: '🔍',
    elevation: 'Y = 0 – 1020 mm',
    sector: '360° Complete Assembly',
    description: 'Complete assembled Gomikin architecture displaying all structural, segregation, and processing modules in baseline configuration.',
    camera: { pos: [0.95, 1.15, 1.55], target: [0, 0.51, 0] },
    nodeNames: [], // Empty indicates full apparatus
    components: [
      { name: 'Outer Enclosure Shell', elevation: 'Y = 100 – 1020 mm', role: 'Double-walled cylindrical protective shell (OD = 500 mm, thickness = 4 mm).' },
      { name: 'Input & Segregation Module', elevation: 'Y = 925 – 1020 mm', role: 'Central funnel, 2-axis orientable sorting base, camera, and ultrasonic sensors.' },
      { name: 'Structural Dividers', elevation: 'Y = 100 – 925 mm', role: 'Central (Z = 0) and Radial (X = 0) partition walls isolating the 3 sectors.' },
      { name: 'Organic Preprocessing Module', elevation: 'Y = 890 – 915 mm', role: 'Cylindrical cutting collar, top motor, rotary shear cross-blades, and 8 mm screen.' },
      { name: 'Organic Storage Module', elevation: 'Y = 620 – 890 mm', role: '180° storage volume, hydrostatic drainage plate, and dual synchronized drop doors.' },
      { name: 'Decomposition Module', elevation: 'Y = 100 – 370 mm', role: 'Removable decomposition vessel drawer, helical agitator, and quick-release couplings.' },
      { name: 'Inorganic Output Module', elevation: 'Y = 100 – 480 mm', role: 'Clean passive drop shaft and lower inorganic collection output drawer (+X, -Z).' },
      { name: 'Leftover Food Module', elevation: 'Y = 100 – 925 mm', role: '55° outward ramp access door, quadrant chamber, and output drawer (+X, +Z).' },
      { name: 'Base & Power Bay', elevation: 'Y = 0 – 100 mm & 928 – 968 mm', role: 'Plinth base, stationary motor, electronics enclosure bay, MCU, and LiFePO4 battery.' }
    ]
  },
  {
    id: 'input',
    name: 'Input & Segregation Module',
    icon: '📥',
    elevation: 'Y = 925 – 1020 mm',
    sector: '360° Upper Throat (Y = 925–1020)',
    description: 'Receiving interface responsible for waste intake, edge-AI computer vision classification, depth sensing, and 2-axis directional routing.',
    camera: { pos: [0.45, 1.25, 0.65], target: [0, 0.96, 0] },
    nodeNames: [
      'InputSegregationAssembly', 'Funnel', 'RotatingBaseAssembly', 'RotatingBase',
      'AxisPivot_1', 'AxisPivot_2', 'SegregationStructuralSupport', 'SegregationSupportHub',
      'SegregationCentralDividerMount', 'SegregationRadialDividerMount', 'SegregationMotor',
      'InputCamera', 'InputUltrasonicSensor', 'InputDisplayConsole', 'InputTopClosure'
    ],
    components: [
      { name: 'Central Receiving Funnel', node: 'Funnel', elevation: 'Y = 940 – 1020 mm', role: 'Inverted conical funnel with Ø100 mm throat directing waste to sorting base.' },
      { name: '2-Axis Rotating Sorting Base', node: 'RotatingBase', elevation: 'Y = 935 mm datum', role: 'Dual-axis gimbaled platform capable of yaw rotation and pitch tilt.' },
      { name: 'Central Spindle & Hub', node: 'SegregationSupportHub', elevation: 'Y = 925 – 931 mm', role: 'Rigid central hub with upper/lower deep groove ball bearings mounted at divider intersection.' },
      { name: 'Segregation Drive Gearmotor', node: 'SegregationMotor', elevation: 'Y = 901 – 921 mm', role: 'Planetary reduction gearmotor executing rapid directional routing.' },
      { name: 'Divider Structural Mounts', node: 'SegregationCentralDividerMount', elevation: 'Y = 925 mm', role: 'Reinforced brackets transferring dynamic sorting loads into central & radial dividers.' },
      { name: 'Optical Edge-AI Camera', node: 'InputCamera', elevation: 'Y = 980 mm (Left -X)', role: 'Down-looking optical camera classifying waste into organic, inorganic, or cooked food.' },
      { name: 'Ultrasonic Depth Sensor', node: 'InputUltrasonicSensor', elevation: 'Y = 980 mm (Right +X)', role: 'Dual-barrel acoustic sensor measuring material volume, distance, and surface profile.' },
      { name: 'OLED User Display Console', node: 'InputDisplayConsole', elevation: 'Y = 1000 – 1045 mm', role: 'Forward-facing interactive console tilted 25° for user feedback and classification status.' },
      { name: 'Rear Enclosure Hood', node: 'InputTopClosure', elevation: 'Y = 925 – 1020 mm', role: 'Rear quadrant top enclosure shielding the electronics bay and sorting mechanism.' }
    ]
  },
  {
    id: 'cutting',
    name: 'Organic Preprocessing & Cutting',
    icon: '⚙️',
    elevation: 'Y = 890 – 915 mm',
    sector: '180° Back Sector (-X)',
    description: 'Mechanical shredding stage reducing particle size down to <8 mm before entering biological storage, creating optimal microbial surface area.',
    camera: { pos: [-0.65, 1.10, 0.40], target: [-0.10, 0.90, 0] },
    nodeNames: [
      'OrganicCuttingMechanism', 'CuttingAssemblySupport', 'CuttingCollar_Outer',
      'CuttingCollar_Inner', 'CuttingCollar_TopRim', 'CuttingCollar_BottomRim',
      'CuttingMotor', 'CuttingBlades', 'SizingScreen', 'CuttingMotorMount_Crossbeam_Z',
      'CuttingMotorMount_Crossbeam_X', 'CuttingSupportStrut_Divider', 'CuttingSupportStrut_OuterWall'
    ],
    components: [
      { name: 'Cylindrical Cutting Collar', node: 'CuttingCollar_Outer', elevation: 'Y = 890 – 915 mm', role: 'Heavy-gauge cylindrical housing (H = 25 mm, R = 246 mm) containing cutting cross-shear.' },
      { name: 'Top Cutting Motor', node: 'CuttingMotor', elevation: 'Y = 915 – 945 mm', role: 'High-speed rotary motor with reinforced bearing boss mounted above the cutting zone.' },
      { name: '4-Arm Rotary Shear Cross-Blades', node: 'CuttingBlades', elevation: 'Y = 900 mm', role: 'Dual cross-arm scissor blades creating progressive mechanical shear with aerodynamic downdraft.' },
      { name: 'Perforated Sizing Mesh Screen', node: 'SizingScreen', elevation: 'Y = 890 mm', role: 'Perforated 8 mm sizing screen ensuring only thoroughly shredded particles enter storage.' },
      { name: 'Cutting Assembly Struts', node: 'CuttingSupportStrut_OuterWall', elevation: 'Y = 890 – 915 mm', role: 'Triangulated radial struts anchoring cutting collar to outer shell and central divider.' }
    ]
  },
  {
    id: 'storage',
    name: 'Organic Storage & Drop Doors',
    icon: '📦',
    elevation: 'Y = 620 – 890 mm',
    sector: '180° Back Sector (-X)',
    description: 'Intermediate aerobic holding chamber with hydrostatic liquid separation and synchronized drop doors for batch transfer into decomposition.',
    camera: { pos: [-0.75, 0.85, 0.45], target: [-0.12, 0.72, 0] },
    nodeNames: [
      'OrganicStorageChamber', 'StorageDrainagePlate', 'StorageDoorLeft',
      'StorageDoorRight', 'StorageDoorLugLeft', 'StorageDoorLugRight',
      'StorageDoorShaft', 'StorageVibrator', 'ExhaustFan'
    ],
    components: [
      { name: '180° Storage Chamber', node: 'OrganicStorageChamber', elevation: 'Y = 620 – 890 mm', role: 'Semicircular holding chamber (H = 270 mm) storing preprocessed shredded organic biomass.' },
      { name: 'Hydrostatic Drainage Screen', node: 'StorageDrainagePlate', elevation: 'Y = 635 mm', role: 'Perforated sloped floor allowing gravitational extraction of excess cellular moisture.' },
      { name: 'Dual Synchronized Drop Doors', node: 'StorageDoorLeft', elevation: 'Y = 620 mm', role: 'Twin 4 mm plate doors swinging downward 45° to release accumulated batch.' },
      { name: 'Drop Door Hinge Axle & Lugs', node: 'StorageDoorLugLeft', elevation: 'Y = 620 – 624 mm', role: 'Stainless steel pivot lugs providing 45° clearance swing into the 250 mm vertical gap.' },
      { name: 'Pneumatic Agitation Vibrator', node: 'StorageVibrator', elevation: 'Y = 750 mm (Outer Arc)', role: 'Pneumatic vibrator breaking wall adhesion and biomass bridging during door release.' },
      { name: 'VOC Exhaust Extraction Fan', node: 'ExhaustFan', elevation: 'Y = 770 mm', role: 'Airflow fan maintaining negative pressure, routing gases through VOC carbon filter.' }
    ]
  },
  {
    id: 'decomposition',
    name: 'Decomposition Module',
    icon: '🔄',
    elevation: 'Y = 100 – 370 mm',
    sector: '180° Back Sector (-X)',
    description: 'Controlled biological decomposition vessel with continuous mixing, thermal stabilization, and dual load cells monitoring curing cycle.',
    camera: { pos: [-0.80, 0.45, 0.55], target: [-0.12, 0.25, 0] },
    nodeNames: [
      'DecompositionVessel_Drawer', 'DecompositionVessel_Handle', 'OrganicDecompositionAgitator',
      'AgitatorCoupling_Upper', 'AgitatorCoupling_Lower', 'AgitatorMotor_Stationary',
      'DecompLoadCellPad_Front', 'DecompLoadCellPad_Rear'
    ],
    components: [
      { name: 'Removable Decomposition Drawer', node: 'DecompositionVessel_Drawer', elevation: 'Y = 100 – 370 mm', role: '180° semicircular vessel drawer (H = 270 mm) extracting along -X for finished compost.' },
      { name: 'Ergonomic Pull Handle', node: 'DecompositionVessel_Handle', elevation: 'Y = 235 mm (Rear -X)', role: 'Recessed drawer pull handle for extracting the decomposition vessel for harvest.' },
      { name: 'Helical Agitator Shaft & Paddles', node: 'OrganicDecompositionAgitator', elevation: 'Y = 100 – 350 mm', role: 'Central rotating shaft with multi-tier paddles aerating and mixing microbial bed.' },
      { name: 'Upper & Lower Quick Couplings', node: 'AgitatorCoupling_Upper', elevation: 'Y = 76 – 100 mm', role: 'Self-aligning dog clutch disengaging agitator shaft during drawer withdrawal.' },
      { name: 'Stationary Agitator Gearmotor', node: 'AgitatorMotor_Stationary', elevation: 'Y = 0 – 100 mm (Plinth)', role: 'Base-mounted low-RPM high-torque motor driving agitation without moving with drawer.' },
      { name: 'Dual Load Cell Support Pads', node: 'DecompLoadCellPad_Front', elevation: 'Y = 95 mm (Z = ±90 mm)', role: 'Precision strain-gauge beam sensors monitoring mass loss and compost moisture.' }
    ]
  },
  {
    id: 'inorganic',
    name: 'Inorganic Output Module',
    icon: '🗑️',
    elevation: 'Y = 100 – 480 mm',
    sector: '90° Quadrant (+X, -Z)',
    description: 'Dry recyclable/inorganic waste storage featuring a clean full-height gravity drop shaft and an easily accessible lower collection drawer.',
    camera: { pos: [0.75, 0.45, -0.65], target: [0.12, 0.35, -0.12] },
    nodeNames: [
      'InorganicSection', 'InorganicChamber', 'InorganicDrawer', 'InorganicDrawer_Handle'
    ],
    components: [
      { name: 'Vertical Gravity Drop Shaft', node: 'InorganicChamber', elevation: 'Y = 100 – 925 mm', role: 'Smooth 90° quadrant vertical shaft allowing cans, plastics, and paper to drop freely.' },
      { name: 'Inorganic Output Drawer', node: 'InorganicDrawer', elevation: 'Y = 100 – 480 mm', role: 'Full 380 mm high collection drawer accumulating dry non-compostable waste items.' },
      { name: 'Ergonomic Drawer Handle', node: 'InorganicDrawer_Handle', elevation: 'Y = 290 mm (Side +X)', role: 'Front pull handle for extracting inorganic drawer along +X for municipal disposal.' },
      { name: 'Radial & Central Barrier Walls', node: 'RadialDivider', elevation: 'Y = 100 – 925 mm', role: 'Double-sealed internal partition walls preventing odor and moisture contamination.' }
    ]
  },
  {
    id: 'leftover_food',
    name: 'Leftover Food Module',
    icon: '🍲',
    elevation: 'Y = 100 – 925 mm',
    sector: '90° Quadrant (+X, +Z)',
    description: 'Dedicated cooked/wet food receiving sector with an ergonomic 55° outward-opening ramp door, drainage sump, and independent collection drawer.',
    camera: { pos: [0.75, 0.70, 0.70], target: [0.12, 0.55, 0.12] },
    nodeNames: [
      'LeftoverFoodSection', 'LeftoverFoodChamber', 'LeftoverFoodTopClosure',
      'LeftoverFoodAccessDoor', 'LeftoverFoodDoorHinge_Central', 'LeftoverFoodDoorHinge_Radial',
      'LeftoverFoodDoorHinge_ChordRod', 'LeftoverFoodDoor_Pivot', 'LeftoverFoodDrawer',
      'LeftoverFoodDrawer_Handle'
    ],
    components: [
      { name: 'Leftover Food Chamber', node: 'LeftoverFoodChamber', elevation: 'Y = 100 – 925 mm', role: 'Dedicated 90° sector (+X, +Z) holding cooked food waste separate from raw organics.' },
      { name: 'Quarter-Round Top Closure', node: 'LeftoverFoodTopClosure', elevation: 'Y = 925 mm', role: 'Fixed 90° arc panel sealing the leftover food chamber at the input section boundary.' },
      { name: 'Curved Access Door Panel', node: 'LeftoverFoodAccessDoor', elevation: 'Y = 700 – 800 mm', role: 'Cylindrical door panel (H = 100 mm, R = 246 mm) maintaining 10 mm sector padding.' },
      { name: 'Corner Flange Hinges (Central & Radial)', node: 'LeftoverFoodDoorHinge_Central', elevation: 'Y = 700 mm', role: 'Dual physical hinge brackets mounted at bottom corners (10, 700, 246) and (246, 700, 10) mm.' },
      { name: 'Straight Horizontal Chord Hinge Rod', node: 'LeftoverFoodDoorHinge_ChordRod', elevation: 'Y = 700 mm', role: 'Ø6 mm stainless steel rod defining rigid horizontal pivot axis across the chord.' },
      { name: '55° Outward Opening Ramp', node: 'LeftoverFoodDoor_Pivot', elevation: 'Pivot at Y = 700 mm', role: 'Kinematic rotation around chord axis acting as an inclined deposition ramp for plates and pans.' },
      { name: 'Leftover Food Output Drawer', node: 'LeftoverFoodDrawer', elevation: 'Y = 100 – 480 mm', role: 'Dedicated collection drawer sliding along +Z for easy emptying and washing.' },
      { name: 'Drawer Pull Handle', node: 'LeftoverFoodDrawer_Handle', elevation: 'Y = 290 mm (Front +Z)', role: 'Ergonomic pull handle mounted flush on front cylindrical arc.' }
    ]
  },
  {
    id: 'base_power',
    name: 'Base / Power & Control',
    icon: '⚡',
    elevation: 'Y = 0 – 100 mm & 928 – 968 mm',
    sector: 'Structural Base & Top 90° Bay',
    description: 'System backbone containing structural plinth base, vibration-isolated drive motor, and sealed top electronics enclosure bay.',
    camera: { pos: [0.65, 1.10, 0.65], target: [0.15, 0.95, 0.10] },
    nodeNames: [
      'PlinthBase', 'ElectronicsBay', 'MCU_Board', 'BatteryBox', 'WiringLoom'
    ],
    components: [
      { name: 'Structural Plinth Base', node: 'PlinthBase', elevation: 'Y = 0 – 100 mm', role: 'Heavy cylindrical base (OD = 500 mm, H = 100 mm) anchoring bin on floor datum.' },
      { name: 'Electronics Enclosure Bay', node: 'ElectronicsBay', elevation: 'Y = 928 – 968 mm', role: 'Dust- and moisture-sealed enclosure in the upper 90° quadrant (+X, +Z).' },
      { name: 'Edge-AI Microcontroller (MCU)', node: 'MCU_Board', elevation: 'Y = 958 mm', role: 'Industrial compute board orchestrating camera classification, motor PWM, and sensor telemetry.' },
      { name: 'LiFePO4 4S4P Battery Pack', node: 'BatteryBox', elevation: 'Y = 932 – 956 mm', role: '16 high-density cylindrical cells providing uninterruptible operational power.' },
      { name: 'Wiring Harness Loom', node: 'WiringLoom', elevation: 'Y = 925 – 968 mm', role: 'Shielded silicone wiring distribution harness connecting MCU to sensors and drive motors.' }
    ]
  }
];

/**
 * Controller managing Static Component Inspection Mode.
 * Visual Subduing: subdues unselected modules with high transparency,
 * keeps selected module vivid and fully visible, with ZERO coordinate alteration.
 */
export class InspectionController {
  constructor(envelope, camera, controls) {
    this.envelope = envelope;
    this.camera = camera;
    this.controls = controls;
    this.activeModuleId = 'all';
    this.originalMaterials = new Map();
    this.listeners = [];

    this.cacheOriginalMaterials();
  }

  cacheOriginalMaterials() {
    this.envelope.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        this.originalMaterials.set(child.uuid, {
          opacity: mat.opacity,
          transparent: mat.transparent,
          depthWrite: mat.depthWrite,
          wireframe: mat.wireframe,
          color: mat.color ? mat.color.clone() : null,
          emissive: mat.emissive ? mat.emissive.clone() : null,
        });
      }
    });
  }

  getActiveModule() {
    return GOMIKIN_MODULES.find(m => m.id === this.activeModuleId) || GOMIKIN_MODULES[0];
  }

  /**
   * Select a module for static inspection.
   * Isolates the module, subdues the rest of the model, and re-frames the camera.
   */
  selectModule(moduleId) {
    const mod = GOMIKIN_MODULES.find(m => m.id === moduleId);
    if (!mod) return;

    this.activeModuleId = mod.id;

    if (mod.id === 'all') {
      this.restoreAllMaterials();
    } else {
      this.applyVisualSubduing(mod);
    }

    // Camera re-framing
    if (this.camera && this.controls && mod.camera) {
      const [px, py, pz] = mod.camera.pos;
      const [tx, ty, tz] = mod.camera.target;
      this.camera.position.set(px, py, pz);
      this.controls.target.set(tx, ty, tz);
      this.controls.update();
    }

    this.notifyUpdate();
  }

  applyVisualSubduing(targetModule) {
    const targetNodes = new Set(targetModule.nodeNames);

    // Identify which objects belong to target module
    const highlightedObjects = new Set();
    this.envelope.traverse((child) => {
      if (targetNodes.has(child.name)) {
        highlightedObjects.add(child);
        child.traverse((descendant) => highlightedObjects.add(descendant));
      }
    });

    // Apply visual styling
    this.envelope.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const orig = this.originalMaterials.get(child.uuid);
      if (!orig) return;

      const mat = child.material;

      if (child.name === 'ShellOuterWall' || child.name === 'ShellInnerWall' || child.name === 'MainShell') {
        // Keep outer enclosure visible as a subtle architectural ghost silhouette
        mat.transparent = true;
        mat.opacity = 0.08;
        mat.depthWrite = false;
      } else if (highlightedObjects.has(child)) {
        // Selected module: crisp, opaque, vivid
        mat.transparent = orig.transparent;
        mat.opacity = Math.max(0.92, orig.opacity);
        mat.depthWrite = true;
        if (mat.emissive && orig.emissive) {
          mat.emissive.copy(orig.emissive);
        }
      } else {
        // Other modules: visually subdued (ghosted)
        mat.transparent = true;
        mat.opacity = 0.10;
        mat.depthWrite = false;
      }
    });
  }

  restoreAllMaterials() {
    this.envelope.traverse((child) => {
      if (child.isMesh && child.material) {
        const orig = this.originalMaterials.get(child.uuid);
        if (orig) {
          const mat = child.material;
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.depthWrite = orig.depthWrite;
          mat.wireframe = orig.wireframe;
          if (orig.color && mat.color) mat.color.copy(orig.color);
          if (orig.emissive && mat.emissive) mat.emissive.copy(orig.emissive);
        }
      }
    });
  }

  /**
   * Pulse / highlight a specific component mesh when clicked in the component list.
   */
  highlightComponent(componentName) {
    const target = this.envelope.getObjectByName(componentName);
    if (!target) return;

    target.traverse((child) => {
      if (child.isMesh && child.material && child.material.emissive) {
        const origEmissive = child.material.emissive.clone();
        child.material.emissive.setHex(0x00ffcc);
        setTimeout(() => {
          if (child.material && child.material.emissive) {
            child.material.emissive.copy(origEmissive);
          }
        }, 1200);
      }
    });
  }

  onUpdate(fn) {
    if (typeof fn === 'function') this.listeners.push(fn);
  }

  notifyUpdate() {
    const mod = this.getActiveModule();
    for (const fn of this.listeners) {
      fn(mod);
    }
  }
}
