import * as THREE from 'three';

export const FLOW_MODES = {
  ORGANIC: 'ORGANIC',
  INORGANIC: 'INORGANIC',
  LEFTOVER_FOOD: 'LEFTOVER_FOOD'
};

export const FLOW_STEPS = {
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
    { title: '1. Intake Door Opening', desc: 'Leftover food front door pivots outward 55° into a loading chute.' },
    { title: '2. Waste Slide Intake', desc: 'Cooked/wet food is loaded onto the ramp and slides into the 90° quadrant (+X, -Z).' },
    { title: '3. Flush Pneumatic Seal', desc: 'Intake door returns flush to upright position, sealing odor and pests.' },
    { title: '4. Liquid Drainage & Aeration', desc: 'High-moisture liquids drain through perforated tray into leachate collection.' }
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

    this.activeMode = FLOW_MODES.ORGANIC;
    this.progress = 0.0;
    this.isPlaying = false;
    this.speed = 1.0;
    this.duration = 14.0; // seconds for full flow

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
      const mesh = this.registry.get(name);
      if (mesh) {
        this.cachedTransforms.set(name, {
          pos: mesh.position.clone(),
          rot: mesh.rotation.clone()
        });
      }
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
    this.reset();

    const mesh = this.mainParticle.children[0];
    const halo = this.mainParticle.getObjectByName('Halo');

    if (mode === FLOW_MODES.ORGANIC) {
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

    // Restore mechanical parts to original rest transforms
    for (const [name, baseline] of this.cachedTransforms.entries()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        mesh.position.copy(baseline.pos);
        mesh.rotation.copy(baseline.rot);
      }
    }

    this.notifyListeners();
  }

  setProgress(p) {
    this.progress = Math.max(0.0, Math.min(1.0, p));

    if (this.activeMode === FLOW_MODES.ORGANIC) {
      this.updateOrganicFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.INORGANIC) {
      this.updateInorganicFlow(this.progress);
    } else if (this.activeMode === FLOW_MODES.LEFTOVER_FOOD) {
      this.updateLeftoverFoodFlow(this.progress);
    }

    this.notifyListeners();
  }

  updateOrganicFlow(p) {
    this.mainParticle.visible = true;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    const blades = this.registry.get('cutting_blades');
    const rotBase = this.registry.get('rotating_base');
    const doorL = this.registry.get('door_mechanism_left');
    const doorR = this.registry.get('door_mechanism_right');
    const agitator = this.registry.get('agitator');

    // Reset baseline transforms
    if (rotBase) rotBase.rotation.set(0, 0, 0);
    if (doorL) doorL.rotation.set(0, 0, 0);
    if (doorR) doorR.rotation.set(0, 0, 0);
    if (agitator) agitator.rotation.set(0, 0, 0);

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
      const tilt = THREE.MathUtils.degToRad(30 * u);
      if (rotBase) rotBase.rotation.z = tilt;

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
      // High-speed blade rotation around local vertical shaft (local Z axis)!
      if (blades) blades.rotation.z = u * Math.PI * 18;

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
      if (doorL) doorL.rotation.y = -doorAngle;
      if (doorR) doorR.rotation.y = doorAngle;

      this.mainParticle.visible = false;
      this.fragmentsGroup.visible = true;
      this.fragmentsGroup.position.set(-0.12, THREE.MathUtils.lerp(0.68, 0.22, u), 0);
    }
    // Step 8: Thermophilic Agitator Mixing [0.86 - 1.00]
    else {
      const u = (p - 0.86) / 0.14;
      if (agitator) agitator.rotation.z = u * Math.PI * 12;

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
    this.mainParticle.visible = true;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    const rotBase = this.registry.get('rotating_base');
    if (rotBase) rotBase.rotation.set(0, 0, 0);

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
      if (rotBase) {
        rotBase.rotation.x = THREE.MathUtils.degToRad(25 * u);
        rotBase.rotation.z = THREE.MathUtils.degToRad(-25 * u);
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

  updateLeftoverFoodFlow(p) {
    this.mainParticle.visible = true;
    this.scanBeam.visible = false;
    this.fragmentsGroup.visible = false;
    this.leachateDrops.visible = false;

    const door = this.registry.get('leftover_food_closur');
    if (door) door.rotation.set(0, 0, 0);

    // 1. Intake door opens outward 55° [0.0 - 0.25]
    if (p <= 0.25) {
      const u = p / 0.25;
      if (door) door.rotation.x = THREE.MathUtils.degToRad(-55 * u);
      this.mainParticle.position.set(0.12, 0.95, -0.22);
    }
    // 2. Food slides down ramp into 90° food quadrant (+X, -Z) [0.25 - 0.55]
    else if (p <= 0.55) {
      const u = (p - 0.25) / 0.30;
      if (door) door.rotation.x = THREE.MathUtils.degToRad(-55);
      this.mainParticle.position.set(
        0.12,
        THREE.MathUtils.lerp(0.95, 0.26, u),
        THREE.MathUtils.lerp(-0.22, -0.12, u)
      );
    }
    // 3. Intake door closes flush [0.55 - 0.75]
    else if (p <= 0.75) {
      const u = (p - 0.55) / 0.20;
      if (door) door.rotation.x = THREE.MathUtils.degToRad(-55 * (1 - u));
      this.mainParticle.position.set(0.12, 0.26, -0.12);
    }
    // 4. Moisture separates and trickles to bottom leachate tray [0.75 - 1.00]
    else {
      const u = (p - 0.75) / 0.25;
      this.mainParticle.position.set(0.12, 0.26, -0.12);
      this.leachateDrops.visible = true;
      this.leachateDrops.position.set(0.12, 0, -0.12);
      this.leachateDrops.children.forEach((drop, idx) => {
        const dropY = 0.24 - ((u * 3 + idx * 0.2) % 1.0) * 0.18;
        drop.position.set(0, dropY, 0);
      });
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
