import * as THREE from 'three';

export const FLOW_MODES = {
  INPUT: 'INPUT',
  CUTTING: 'CUTTING',
  STORAGE: 'STORAGE',
  DECOMPOSITION: 'DECOMPOSITION',
  ORGANIC: 'ORGANIC',
  INORGANIC: 'INORGANIC',
  LEFTOVER_FOOD: 'LEFTOVER_FOOD'
};

export const FLOW_STEPS = {
  INPUT: [
    { title: '1. Waste Reception & Inflow', desc: 'Waste is deposited into the intake funnel and settles onto the 2-axis base.' },
    { title: '2. Optical & Sensor Classification', desc: 'Computer vision camera and ultrasonic depth sensors detect and classify the deposited material.' },
    { title: '3. Intake Base Tilt & Transfer', desc: 'The 2-axis segregator base tilts -10° to slide classified material into the internal processing collar.' }
  ],
  CUTTING: [
    { title: '1. Waste Inflow Transfer', desc: 'Sorted organic material enters the high-torque cutting throat above the rotary blades.' },
    { title: '2. High-Speed Rotary Cutting', desc: 'Dual rotary shear blades rotate at high speed, shredding waste down to <8 mm.' },
    { title: '3. Size Reduction & Mesh Passage', desc: 'Shredded fragments pass through the circular sizing screen and accumulate in the storage chamber.' }
  ],
  STORAGE: [
    { title: '1. Storage Chamber Accumulation', desc: 'Shredded biomass accumulates cleanly inside the sealed intermediate storage chamber.' },
    { title: '2. Hydrostatic Liquid Drainage', desc: 'Cellular moisture drains through perforated bottom screen into the lower leachate collector.' },
    { title: '3. Drop-Down Door Mechanism', desc: 'Dual center-hinged drop doors swing open 45° to discharge the batch downwards.' }
  ],
  DECOMPOSITION: [
    { title: '1. Biomass Inflow Transfer', desc: 'Discharged organic biomass drops into the primary decomposition chamber.' },
    { title: '2. Continuous Agitator Mixing', desc: 'Helical agitator rotates continuously around its mechanical axis, mixing and aerating biomass.' },
    { title: '3. Thermophilic Decomposition', desc: 'Aerobic microbial curing stabilizes biomass with temperature monitoring and aeration.' }
  ],
  ORGANIC: [
    { title: '1. Waste Deposit', desc: 'Organic waste is dropped into the top receiving funnel.' },
    { title: '2. Optical & Depth Sensing', desc: 'Waste settles on 2-axis platform; camera and ultrasonic sensors classify material.' },
    { title: '3. Platform Tilt & Directional Routing', desc: 'Platform tilts toward the 180° organic sector (-X), sliding waste into the cutting collar.' },
    { title: '4. High-Speed Rotary Shear Cutting', desc: 'Dual rotary shear blades rotate at high speed, shredding waste down to <8 mm.' },
    { title: '5. Sizing Mesh Passage & Storage', desc: 'Shredded fragments pass through the sizing screen and accumulate in the storage chamber.' },
    { title: '6. Hydrostatic Drainage', desc: 'Cellular moisture drains through perforated bottom screen into the lower leachate system.' },
    { title: '7. Drop Door Transfer', desc: 'Center-hinged drop doors swing open 45°; batch drops into decomposition chamber.' },
    { title: '8. Thermophilic Agitation & Curing', desc: 'Helical agitator rotates, blending compost with microbes and aerating the biomass.' }
  ],
  INORGANIC: [
    { title: '1. Waste Deposit', desc: 'Dry inorganic recyclables enter the receiving funnel.' },
    { title: '2. Edge-AI Detection', desc: 'Computer vision identifies rigid inorganic material (cans/bottles/plastics).' },
    { title: '3. Directional Routing', desc: '2-axis base tilts toward the 90° inorganic quadrant (+X, +Z).' },
    { title: '4. Free-Fall Shaft Drop', desc: 'Waste drops down the clean, full-height dry accumulation shaft.' },
    { title: '5. Lower Drawer Collection', desc: 'Dry waste accumulates in the lower extraction drawer for recycling.' }
  ],
  LEFTOVER_FOOD: [
    { title: '1. Open Access Door', desc: 'Operator swings the curved side door 120° outward to the left, exposing the leftover-food compartment.' },
    { title: '2. Manual Food Deposit', desc: 'Cooked leftover food is deposited manually from outside through the open side access door.' },
    { title: '3. Close Access Door', desc: 'The curved side door swings back to its flush closed position, sealing the compartment.' },
    { title: '4. Leftover Food Stored', desc: 'Leftover food remains safely stored inside the isolated 25% quadrant.' }
  ]
};

export class PhysicalFlowController {
  /**
   * @param {ComponentRegistry} registry
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {OrbitControls} controls
   */
  constructor(registry, scene, camera, controls) {
    this.registry = registry;
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;

    this.activeMode = FLOW_MODES.INPUT;
    this.progress = 0.0;
    this.isPlaying = false;
    this.speed = 1.0;
    this.duration = 8.0; // seconds for modular flow

    // Component baseline transform cache for mechanical motions
    this.cachedTransforms = new Map();
    this.cacheMechanicalBaselines();

    // Visual simulation meshes
    this.flowGroup = new THREE.Group();
    this.flowGroup.name = 'PhysicalFlow_Simulation_Group';
    this.scene.add(this.flowGroup);

    this.mainParticle = this.createMainParticle();
    this.flowGroup.add(this.mainParticle);

    this.fragmentsGroup = this.createFragments();
    this.flowGroup.add(this.fragmentsGroup);

    this.scanBeam = this.createScanBeam();
    this.flowGroup.add(this.scanBeam);

    this.leachateDrops = this.createLeachateDrops();
    this.flowGroup.add(this.leachateDrops);

    this.leftoverFoodScrapsGroup = this.createLeftoverFoodScraps();
    this.flowGroup.add(this.leftoverFoodScrapsGroup);

    this.listeners = [];
    this.reset();
  }

  cacheMechanicalBaselines() {
    const mechanicalNames = [
      'cutting_blades',
      'rotating_base',
      'door_mechanism_left',
      'door_mechanism_right',
      'agitator',
      'leftover_food_closur'
    ];

    for (const name of mechanicalNames) {
      const entry = this.registry.getEntry(name);
      if (entry) {
        this.cachedTransforms.set(name, {
          pos: entry.initialPosition.clone(),
          rot: entry.initialRotation.clone(),
          scale: entry.initialScale.clone()
        });
      } else {
        const mesh = this.registry.get(name);
        if (mesh) {
          this.cachedTransforms.set(name, {
            pos: mesh.position.clone(),
            rot: mesh.rotation.clone(),
            scale: mesh.scale.clone()
          });
        }
      }
    }
  }

  /**
   * Authoritatively restores all mechanical parts controlled by flow simulation
   * to their exact baseline assembled transforms.
   */
  resetMechanicalPoses() {
    for (const [name, baseline] of this.cachedTransforms.entries()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        mesh.position.copy(baseline.pos);
        mesh.rotation.copy(baseline.rot);
        mesh.scale.copy(baseline.scale);
      }
    }
    if (window.mechanicalPivotController) {
      window.mechanicalPivotController.resetMechanicalComponents();
    }
  }

  createMainParticle() {
    const group = new THREE.Group();
    group.name = 'MainParticle';

    const geo = new THREE.SphereGeometry(0.024, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x15803d,
      emissiveIntensity: 0.4
    });
    const sphere = new THREE.Mesh(geo, mat);
    group.add(sphere);

    // Glowing halo
    const haloGeo = new THREE.RingGeometry(0.028, 0.034, 24);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.name = 'Halo';
    group.add(halo);

    return group;
  }

  createFragments() {
    const group = new THREE.Group();
    group.name = 'ShreddedFragments';

    const count = 10;
    const geo = new THREE.DodecahedronGeometry(0.007, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x84cc16,
      roughness: 0.5,
      metalness: 0.1
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 0.06,
        (Math.random() - 0.5) * 0.04,
        (Math.random() - 0.5) * 0.06
      );
      group.add(mesh);
    }
    group.visible = false;
    return group;
  }

  createScanBeam() {
    const geo = new THREE.CylinderGeometry(0.015, 0.075, 0.090, 16, 1, true);
    geo.translate(0, -0.045, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'ScanBeam';
    mesh.position.set(-0.01, 1.01, -0.02);
    mesh.visible = false;
    return mesh;
  }

  createLeachateDrops() {
    const group = new THREE.Group();
    group.name = 'LeachateDrops';

    const count = 6;
    const geo = new THREE.SphereGeometry(0.005, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData = { initialY: 0.65 - i * 0.09 };
      group.add(mesh);
    }
    group.visible = false;
    return group;
  }

  setMode(mode) {
    if (!FLOW_MODES[mode]) return;
    this.activeMode = mode;
    this.duration = (mode === FLOW_MODES.ORGANIC) ? 14.0 : 8.0;
    this.reset();

    const mesh = this.mainParticle.children[0];
    const halo = this.mainParticle.getObjectByName('Halo');

    if (mode === FLOW_MODES.INPUT) {
      mesh.material.color.setHex(0x00ffcc);
      mesh.material.emissive.setHex(0x00b4d8);
      if (halo) halo.material.color.setHex(0x00ffcc);
    } else if (mode === FLOW_MODES.CUTTING) {
      mesh.material.color.setHex(0x38bdf8);
      mesh.material.emissive.setHex(0x0284c7);
      if (halo) halo.material.color.setHex(0x38bdf8);
    } else if (mode === FLOW_MODES.STORAGE) {
      mesh.material.color.setHex(0xa855f7);
      mesh.material.emissive.setHex(0x7e22ce);
      if (halo) halo.material.color.setHex(0xc084fc);
    } else if (mode === FLOW_MODES.DECOMPOSITION || mode === FLOW_MODES.ORGANIC) {
      mesh.material.color.setHex(0x22c55e);
      mesh.material.emissive.setHex(0x15803d);
      if (halo) halo.material.color.setHex(0x4ade80);
    } else if (mode === FLOW_MODES.INORGANIC) {
      mesh.material.color.setHex(0x06b6d4);
      mesh.material.emissive.setHex(0x0891b2);
      if (halo) halo.material.color.setHex(0x38bdf8);
    } else if (mode === FLOW_MODES.LEFTOVER_FOOD) {
      mesh.material.color.setHex(0xf59e0b);
      mesh.material.emissive.setHex(0xb45309);
      if (halo) halo.material.color.setHex(0xfbbf24);
    }

    this.notifyListeners();
  }

  play() {
    if (this.progress >= 1.0) {
      this.progress = 0.0;
    }
    this.isPlaying = true;
    this.notifyListeners();
  }

  pause() {
    this.isPlaying = false;
    this.notifyListeners();
  }

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  reset() {
    this.pause();
    this.progress = 0.0;
    this.mainParticle.visible = false;
    this.fragmentsGroup.visible = false;
    this.scanBeam.visible = false;
    this.leachateDrops.visible = false;
    if (this.leftoverFoodScrapsGroup) {
      this.leftoverFoodScrapsGroup.visible = false;
    }
    if (window.virtualDoorAssembly) {
      window.virtualDoorAssembly.setDoorAngle(0.0);
    }

    // Restore mechanical parts to exact baseline transforms
    this.resetMechanicalPoses();

    this.notifyListeners();
  }

  setProgress(p) {
    this.progress = Math.max(0.0, Math.min(1.0, p));

    if (this.activeMode === FLOW_MODES.INPUT) {
      this.updateInputFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.CUTTING) {
      this.updateCuttingFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.STORAGE) {
      this.updateStorageFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.DECOMPOSITION) {
      this.updateDecompositionFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.ORGANIC) {
      this.updateOrganicFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.INORGANIC) {
      this.updateInorganicFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.LEFTOVER_FOOD) {
      this.updateLeftoverFoodFlow(this.progress);
    }

    this.notifyListeners();
  }

  /**
   * Module 1: Input & Intake Module Flow Simulation
   * Steps:
   * 1. Waste Reception [0.00 - 0.33]
   * 2. Optical & Sensor Classification [0.33 - 0.66]
   * 3. Intake Base Tilt & Transfer [0.66 - 1.00]
   */
  updateInputFlow(p) {
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.mainParticle.visible = true;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;
    this.scanBeam.visible = false;

    // Step 1: Deposit down funnel [0.00 - 0.33]
    if (p <= 0.33) {
      const u = p / 0.33;
      this.mainParticle.position.set(0, THREE.MathUtils.lerp(1.10, 0.945, u), 0);
      this.mainParticle.scale.set(1, 1, 1);
    }
    // Step 2: Sensed on platform with vision scanner [0.33 - 0.66]
    else if (p <= 0.66) {
      const u = (p - 0.33) / 0.33;
      this.mainParticle.position.set(0, 0.945, 0);
      this.scanBeam.visible = true;
      const pulse = 1.0 + Math.sin(u * Math.PI * 4) * 0.10;
      this.mainParticle.scale.set(pulse, pulse, pulse);
    }
    // Step 3: Base tilts toward 180° Organic sector (-X) [0.66 - 1.00]
    else {
      const u = (p - 0.66) / 0.34;
      if (window.mechanicalPivotController) {
        window.mechanicalPivotController.setRotatingBaseAngle(THREE.MathUtils.degToRad(-10 * u), true);
      }
      this.mainParticle.position.set(
        THREE.MathUtils.lerp(0, -0.12, u),
        THREE.MathUtils.lerp(0.945, 0.885, u),
        0
      );
      this.mainParticle.scale.set(1, 1, 1);
    }
  }

  /**
   * Module 2: Organic Preprocessing & Cutting Module Flow Simulation
   * Steps:
   * 1. Waste Inflow Transfer [0.00 - 0.33]
   * 2. High-Speed Rotary Cutting [0.33 - 0.66]
   * 3. Size Reduction & Mesh Passage [0.66 - 1.00]
   */
  updateCuttingFlow(p) {
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.scanBeam.visible = false;
    this.leachateDrops.visible = false;

    // Step 1: Waste Inflow Transfer into cutting throat [0.00 - 0.33]
    if (p <= 0.33) {
      const u = p / 0.33;
      this.mainParticle.visible = true;
      this.fragmentsGroup.visible = false;
      this.mainParticle.position.set(-0.12, THREE.MathUtils.lerp(0.92, 0.885, u), 0);
      this.mainParticle.scale.set(1, 1, 1);
    }
    // Step 2: High-Speed Rotary Cutting [0.33 - 0.66]
    else if (p <= 0.66) {
      const u = (p - 0.33) / 0.33;
      if (window.mechanicalPivotController) {
        const pBlades = window.mechanicalPivotController.pivots.cuttingBlades;
        if (pBlades && pBlades.object) {
          pBlades.currentAngle = u * Math.PI * 24;
          window.mechanicalPivotController._applyPivotAngle(pBlades);
        }
      }

      this.mainParticle.visible = true;
      this.mainParticle.position.set(-0.12, THREE.MathUtils.lerp(0.885, 0.855, u), 0);
      const shrink = THREE.MathUtils.lerp(1.0, 0.25, u);
      this.mainParticle.scale.set(shrink, shrink, shrink);

      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, 0.855, 0);
    }
    // Step 3: Size Reduction & Mesh Passage [0.66 - 1.00]
    else {
      const u = (p - 0.66) / 0.34;
      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.855, 0.70, u), 0);
    }
  }

  /**
   * Module 3: Organic Storage & Drainage Module Flow Simulation
   * Steps:
   * 1. Storage Chamber Accumulation [0.00 - 0.33]
   * 2. Hydrostatic Liquid Drainage [0.33 - 0.66]
   * 3. Drop-Down Door Mechanism [0.66 - 1.00]
   */
  updateStorageFlow(p) {
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.mainParticle.visible = false;
    this.scanBeam.visible = false;

    // Step 1: Storage Chamber Accumulation [0.00 - 0.33]
    if (p <= 0.33) {
      const u = p / 0.33;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.74, 0.68, u), 0);
      this.leachateDrops.visible = false;
    }
    // Step 2: Hydrostatic Drainage [0.33 - 0.66]
    else if (p <= 0.66) {
      const u = (p - 0.33) / 0.33;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, 0.68, 0);

      this.leachateDrops.visible = true;
      this.leachateDrops.position.set(-0.12, 0, 0);
      this.leachateDrops.children.forEach((drop, idx) => {
        const dropY = 0.65 - ((u * 3 + idx * 0.15) % 1.0) * 0.55;
        drop.position.set(0, dropY, 0);
      });
    }
    // Step 3: Drop-Down Doors Discharge [0.66 - 1.00]
    else {
      const u = (p - 0.66) / 0.34;
      this.leachateDrops.visible = false;
      const doorAngle = Math.sin(u * Math.PI) * THREE.MathUtils.degToRad(45);
      const doorL = this.registry.get('door_mechanism_left');
      const doorR = this.registry.get('door_mechanism_right');
      const baseL = this.cachedTransforms.get('door_mechanism_left')?.rot;
      const baseR = this.cachedTransforms.get('door_mechanism_right')?.rot;
      if (doorL && baseL) doorL.rotation.set(baseL.x, baseL.y - doorAngle, baseL.z);
      if (doorR && baseR) doorR.rotation.set(baseR.x, baseR.y + doorAngle, baseR.z);

      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.68, 0.25, u), 0);
    }
  }

  /**
   * Module 4: Decomposition & Agitation Module Flow Simulation
   * Steps:
   * 1. Biomass Inflow Transfer [0.00 - 0.33]
   * 2. Continuous Agitator Mixing [0.33 - 0.66]
   * 3. Thermophilic Decomposition [0.66 - 1.00]
   */
  updateDecompositionFlow(p) {
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.mainParticle.visible = false;
    this.scanBeam.visible = false;
    this.leachateDrops.visible = false;

    // Step 1: Biomass Inflow Transfer [0.00 - 0.33]
    if (p <= 0.33) {
      const u = p / 0.33;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.38, 0.22, u), 0);
    }
    // Step 2: Continuous Agitator Mixing [0.33 - 0.66]
    else if (p <= 0.66) {
      const u = (p - 0.33) / 0.33;
      if (window.mechanicalPivotController) {
        const pAgitator = window.mechanicalPivotController.pivots.agitator;
        if (pAgitator && pAgitator.object) {
          pAgitator.currentAngle = u * Math.PI * 16;
          window.mechanicalPivotController._applyPivotAngle(pAgitator);
        }
      }

      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(
        -0.12 + Math.cos(u * Math.PI * 6) * 0.035,
        0.22,
        Math.sin(u * Math.PI * 6) * 0.035
      );
    }
    // Step 3: Thermophilic Decomposition Curing [0.66 - 1.00]
    else {
      const u = (p - 0.66) / 0.34;
      if (window.mechanicalPivotController) {
        const pAgitator = window.mechanicalPivotController.pivots.agitator;
        if (pAgitator && pAgitator.object) {
          pAgitator.currentAngle = (1.0 + u) * Math.PI * 16;
          window.mechanicalPivotController._applyPivotAngle(pAgitator);
        }
      }

      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(
        -0.12 + Math.cos((1.0 + u) * Math.PI * 6) * 0.025,
        0.22,
        Math.sin((1.0 + u) * Math.PI * 6) * 0.025
      );
    }
  }

  updateOrganicFlow(p) {
    // 1. Authoritatively reset all mechanical poses before applying progress-specific pose
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.mainParticle.visible = true;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    // Step 1: Deposit down funnel [0.00 - 0.12]
    if (p <= 0.12) {
      const u = p / 0.12;
      this.mainParticle.position.set(0, THREE.MathUtils.lerp(1.06, 0.945, u), 0);
      this.mainParticle.scale.set(1, 1, 1);
    }
    // Step 2: Sensed on rotating base [0.12 - 0.22]
    else if (p <= 0.22) {
      this.mainParticle.position.set(0, 0.945, 0);
      this.scanBeam.visible = true;
      const pulse = 1.0 + Math.sin((p - 0.12) * 40) * 0.08;
      this.mainParticle.scale.set(pulse, pulse, pulse);
    }
    // Step 3: Base tilts toward 180° Organic sector (-X) [0.22 - 0.35]
    else if (p <= 0.35) {
      const u = (p - 0.22) / 0.13;
      if (window.mechanicalPivotController) {
        window.mechanicalPivotController.setRotatingBaseAngle(THREE.MathUtils.degToRad(-10 * u), true);
      }

      // Particle slides down tilted base towards cutting entrance
      this.mainParticle.position.set(
        THREE.MathUtils.lerp(0, -0.12, u),
        THREE.MathUtils.lerp(0.945, 0.885, u),
        0
      );
    }
    // Step 4: Cutting blades shredding [0.35 - 0.48]
    else if (p <= 0.48) {
      const u = (p - 0.35) / 0.13;
      if (window.mechanicalPivotController) {
        const pBlades = window.mechanicalPivotController.pivots.cuttingBlades;
        if (pBlades && pBlades.object) {
          pBlades.currentAngle = u * Math.PI * 18;
          window.mechanicalPivotController._applyPivotAngle(pBlades);
        }
      }

      this.mainParticle.position.set(-0.12, THREE.MathUtils.lerp(0.885, 0.855, u), 0);
      // Particle shrinks as it gets shredded
      const shrink = THREE.MathUtils.lerp(1.0, 0.3, u);
      this.mainParticle.scale.set(shrink, shrink, shrink);

      // Show shredded bits emerging
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, 0.855, 0);
    }
    // Step 5: Sizing mesh passage into storage chamber [0.48 - 0.60]
    else if (p <= 0.60) {
      const u = (p - 0.48) / 0.12;
      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.855, 0.68, u), 0);
    }
    // Step 6: Hydrostatic Drainage in storage chamber [0.60 - 0.72]
    else if (p <= 0.72) {
      const u = (p - 0.60) / 0.12;
      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, 0.68, 0);

      // Moisture droplets drip down through center drain!
      this.leachateDrops.visible = true;
      this.leachateDrops.position.set(-0.12, 0, 0);
      this.leachateDrops.children.forEach((drop, idx) => {
        const dropY = 0.65 - ((u * 3 + idx * 0.15) % 1.0) * 0.55;
        drop.position.set(0, dropY, 0);
      });
    }
    // Step 7: Drop doors open and batch drops into decomposition chamber [0.72 - 0.86]
    else if (p <= 0.86) {
      const u = (p - 0.72) / 0.14;
      const doorAngle = Math.sin(u * Math.PI) * THREE.MathUtils.degToRad(45);
      const doorL = this.registry.get('door_mechanism_left');
      const doorR = this.registry.get('door_mechanism_right');
      const baseL = this.cachedTransforms.get('door_mechanism_left')?.rot;
      const baseR = this.cachedTransforms.get('door_mechanism_right')?.rot;
      if (doorL && baseL) doorL.rotation.set(baseL.x, baseL.y - doorAngle, baseL.z);
      if (doorR && baseR) doorR.rotation.set(baseR.x, baseR.y + doorAngle, baseR.z);

      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.68, 0.22, u), 0);
    }
    // Step 8: Thermophilic Agitator Mixing [0.86 - 1.00]
    else {
      const u = (p - 0.86) / 0.14;
      if (window.mechanicalPivotController) {
        const pAgitator = window.mechanicalPivotController.pivots.agitator;
        if (pAgitator && pAgitator.object) {
          pAgitator.currentAngle = u * Math.PI * 12;
          window.mechanicalPivotController._applyPivotAngle(pAgitator);
        }
      }

      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(
        -0.12 + Math.cos(u * Math.PI * 6) * 0.03,
        0.22,
        Math.sin(u * Math.PI * 6) * 0.03
      );
    }
  }

  updateInorganicFlow(p) {
    // 1. Authoritatively reset all mechanical poses before applying progress-specific pose
    this.resetMechanicalPoses();
    if (this.leftoverFoodScrapsGroup) this.leftoverFoodScrapsGroup.visible = false;
    if (window.virtualDoorAssembly) window.virtualDoorAssembly.setDoorAngle(0.0);

    this.mainParticle.visible = true;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    // 1. Enter Funnel [0.0 - 0.20]
    if (p <= 0.20) {
      const u = p / 0.20;
      this.mainParticle.position.set(0, THREE.MathUtils.lerp(1.06, 0.945, u), 0);
    }
    // 2. Optical Sensing [0.20 - 0.35]
    else if (p <= 0.35) {
      this.mainParticle.position.set(0, 0.945, 0);
      this.scanBeam.visible = true;
    }
    // 3. Platform routes to Inorganic quadrant (+X, +Z) [0.35 - 0.50]
    else if (p <= 0.50) {
      const u = (p - 0.35) / 0.15;
      if (window.mechanicalPivotController) {
        window.mechanicalPivotController.setRotatingBaseAngle(THREE.MathUtils.degToRad(-10 * u), true);
      }
      this.mainParticle.position.set(
        THREE.MathUtils.lerp(0, 0.12, u),
        THREE.MathUtils.lerp(0.945, 0.88, u),
        THREE.MathUtils.lerp(0, 0.12, u)
      );
    }
    // 4. Free-fall through vertical drop shaft [0.50 - 0.80]
    else if (p <= 0.80) {
      const u = (p - 0.50) / 0.30;
      this.mainParticle.position.set(
        0.12,
        THREE.MathUtils.lerp(0.88, 0.26, u),
        0.12
      );
    }
    // 5. Resting in inorganic collection output drawer [0.80 - 1.00]
    else {
      this.mainParticle.position.set(0.12, 0.26, 0.12);
    }
  }

  createLeftoverFoodScraps() {
    const group = new THREE.Group();
    group.name = 'LeftoverFood_ScrapsGroup';

    // 1. Cooked rice / grain cluster (matte warm white/cream spheroids)
    const riceMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.7,
      metalness: 0.1
    });
    const riceGeo = new THREE.DodecahedronGeometry(0.012, 1);
    [
      [0, 0, 0],
      [0.010, 0.006, 0.005],
      [-0.008, 0.004, -0.006],
      [0.003, -0.005, 0.008]
    ].forEach(([x, y, z]) => {
      const riceMesh = new THREE.Mesh(riceGeo, riceMat);
      riceMesh.position.set(x, y, z);
      group.add(riceMesh);
    });

    // 2. Cooked greens / broccoli morsels (textured deep green)
    const vegMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.8,
      metalness: 0.1
    });
    const vegGeo = new THREE.DodecahedronGeometry(0.014, 0);
    [
      [-0.012, 0.008, 0.008],
      [0.014, 0.010, -0.010]
    ].forEach(([x, y, z]) => {
      const vegMesh = new THREE.Mesh(vegGeo, vegMat);
      vegMesh.position.set(x, y, z);
      group.add(vegMesh);
    });

    // 3. Cooked diced carrot / pumpkin piece (vibrant orange cuboid)
    const carrotMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.45,
      metalness: 0.15
    });
    const carrotGeo = new THREE.BoxGeometry(0.012, 0.010, 0.012);
    const carrotMesh = new THREE.Mesh(carrotGeo, carrotMat);
    carrotMesh.position.set(-0.006, -0.008, 0.010);
    group.add(carrotMesh);

    // 4. Bread crust / toast piece (golden-brown chunk)
    const crustMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.65,
      metalness: 0.1
    });
    const crustGeo = new THREE.BoxGeometry(0.020, 0.008, 0.014);
    const crustMesh = new THREE.Mesh(crustGeo, crustMat);
    crustMesh.position.set(0.012, -0.006, 0.004);
    crustMesh.rotation.set(0.2, 0.4, 0.1);
    group.add(crustMesh);

    // 5. Cooked savory protein morsel (rich warm brown)
    const proteinMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.55,
      metalness: 0.2
    });
    const proteinGeo = new THREE.SphereGeometry(0.013, 12, 12);
    const proteinMesh = new THREE.Mesh(proteinGeo, proteinMat);
    proteinMesh.position.set(-0.010, -0.004, -0.010);
    proteinMesh.scale.set(1.2, 0.8, 1.0);
    group.add(proteinMesh);

    group.visible = false;
    return group;
  }

  updateLeftoverFoodFlow(p) {
    // 1. Authoritatively reset mechanical poses
    this.resetMechanicalPoses();

    // Hide unrelated top funnel / shredder / leachate visuals
    this.mainParticle.visible = false;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    // Trajectory coordinates:
    // P0: Outside machine approaching from user hand
    const p0 = new THREE.Vector3(0.42, 0.70, -0.32);
    // Pmid: Aperture doorway center (through open door sector)
    const pMid = new THREE.Vector3(0.26, 0.58, -0.20);
    // P1: Resting position on bottom plate of leftover-food quadrant (+X, -Z)
    const p1 = new THREE.Vector3(0.12, 0.42, -0.12);

    if (this.leftoverFoodScrapsGroup) {
      // Step 1: Open Door [0.00 - 0.25]
      // Animate door from 0° to 120° outward to the left; food stays waiting outside/hidden
      if (p <= 0.25) {
        const u = p / 0.25;
        if (window.virtualDoorAssembly) {
          window.virtualDoorAssembly.setDoorAngle(120.0 * u);
        }
        this.leftoverFoodScrapsGroup.visible = false;
      }
      // Step 2: Manual Deposit [0.25 - 0.50]
      // Door remains fully open at 120°; food scraps traverse through doorway into compartment
      else if (p <= 0.50) {
        if (window.virtualDoorAssembly) {
          window.virtualDoorAssembly.setDoorAngle(120.0);
        }
        this.leftoverFoodScrapsGroup.visible = true;
        const u = (p - 0.25) / 0.25;
        // Quadratic Bezier interpolation: P(u) = (1-u)^2 * P0 + 2(1-u)u * Pmid + u^2 * P1
        const invU = 1.0 - u;
        const curX = invU * invU * p0.x + 2 * invU * u * pMid.x + u * u * p1.x;
        const curY = invU * invU * p0.y + 2 * invU * u * pMid.y + u * u * p1.y;
        const curZ = invU * invU * p0.z + 2 * invU * u * pMid.z + u * u * p1.z;
        this.leftoverFoodScrapsGroup.position.set(curX, curY, curZ);
        // Natural slight tumble during flight
        this.leftoverFoodScrapsGroup.rotation.set(u * 0.4, u * 1.2, u * 0.3);
      }
      // Step 3: Close Door [0.50 - 0.75]
      // Door closes from 120° back to 0° flush; deposited food remains stationary inside
      else if (p <= 0.75) {
        const u = (p - 0.50) / 0.25;
        if (window.virtualDoorAssembly) {
          window.virtualDoorAssembly.setDoorAngle(120.0 * (1.0 - u));
        }
        this.leftoverFoodScrapsGroup.visible = true;
        this.leftoverFoodScrapsGroup.position.copy(p1);
        this.leftoverFoodScrapsGroup.rotation.set(0.4, 1.2, 0.3);
      }
      // Step 4: Food Stored [0.75 - 1.00]
      // Door remains flush closed at 0°; food rests stably inside compartment
      else {
        if (window.virtualDoorAssembly) {
          window.virtualDoorAssembly.setDoorAngle(0.0);
        }
        this.leftoverFoodScrapsGroup.visible = true;
        this.leftoverFoodScrapsGroup.position.copy(p1);
        this.leftoverFoodScrapsGroup.rotation.set(0.4, 1.2, 0.3);
      }
    }
  }

  getCurrentStep() {
    const steps = FLOW_STEPS[this.activeMode] || [];
    const count = steps.length;
    if (count === 0) return { index: 0, count: 0, title: '', desc: '' };

    const idx = Math.min(count - 1, Math.floor(this.progress * count));
    return {
      index: idx + 1,
      count,
      title: steps[idx].title,
      desc: steps[idx].desc
    };
  }

  nextStep() {
    const steps = FLOW_STEPS[this.activeMode] || [];
    const count = steps.length;
    if (count === 0) return;
    const current = Math.floor(this.progress * count);
    const target = Math.min(count - 1, current + 1) / count;
    this.setProgress(target);
  }

  prevStep() {
    const steps = FLOW_STEPS[this.activeMode] || [];
    const count = steps.length;
    if (count === 0) return;
    const current = Math.floor(this.progress * count);
    const target = Math.max(0, current - 1) / count;
    this.setProgress(target);
  }

  update(deltaTime) {
    if (this.isPlaying) {
      const delta = (deltaTime * this.speed) / this.duration;
      let next = this.progress + delta;
      if (next >= 1.0) {
        next = 1.0;
        this.isPlaying = false;
      }
      this.setProgress(next);
    }
  }

  subscribe(callback) {
    if (typeof callback === 'function') this.listeners.push(callback);
  }

  notifyListeners() {
    const step = this.getCurrentStep();
    for (const cb of this.listeners) {
      try {
        cb({
          mode: this.activeMode,
          progress: this.progress,
          isPlaying: this.isPlaying,
          speed: this.speed,
          step
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
}
