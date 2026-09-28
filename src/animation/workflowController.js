import * as THREE from 'three';

export const WORKFLOW_MODES = {
  ORGANIC: 'ORGANIC',
  INORGANIC: 'INORGANIC',
  LEFTOVER_FOOD: 'LEFTOVER_FOOD',
};

export const ORGANIC_STEPS = [
  { id: 'enter', label: '1. Waste Enters Funnel', desc: 'Organic waste is introduced into the top receiving funnel.' },
  { id: 'settle', label: '2. Settles on Base & Sensed', desc: 'Waste settles on 2-axis base; camera and ultrasonic sensor detect organic material.' },
  { id: 'route', label: '3. Platform Routes to 180° Sector', desc: 'Base tilts toward the 180° Organic Processing sector.' },
  { id: 'cut', label: '4. High-Speed Shear Cutting', desc: 'Top motor drives 4-arm cross shear blades, aerodynamic suction draws waste down.' },
  { id: 'screen', label: '5. Sizing Screen Passage', desc: 'Reduced particles pass through 8 mm perforated sizing mesh into storage.' },
  { id: 'store', label: '6. Storage & Hydrostatic Drainage', desc: 'Accumulates on drainage screen; cellular moisture extracted and drained.' },
  { id: 'drop', label: '7. Drop Doors & Vibration Transfer', desc: 'Drop doors swing open 45°; vibrator breaks adhesion, dropping batch into decomp chamber.' },
  { id: 'agitate', label: '8. Thermophilic Mixing & Curing', desc: 'Internal agitator rotates, mixing microbial mass; load cell and sensors monitor curing.' },
  { id: 'harvest', label: '9. Finished Compost Output', desc: 'Decomposition vessel drawer extracts along -X for user compost harvest.' },
];

export const INORGANIC_STEPS = [
  { id: 'enter', label: '1. Waste Enters Funnel', desc: 'Inorganic waste (e.g. plastic/can) is deposited into the input funnel.' },
  { id: 'sense', label: '2. Edge-AI Detection', desc: 'Optical camera and ultrasonic sensor classify waste as dry inorganic.' },
  { id: 'route', label: '3. Platform Routes to 90° Sector', desc: '2-axis base orients and tilts toward the Inorganic 90° quadrant (+X, -Z).' },
  { id: 'drop', label: '4. Drops into Passive Shaft', desc: 'Waste drops freely into the clean, full-height dry inorganic accumulation chamber.' },
  { id: 'accumulate', label: '5. Drawer Accumulation', desc: 'Inorganic items collect in the dedicated lower output drawer.' },
  { id: 'extract', label: '6. Output Drawer Extraction', desc: 'User pulls ergonomic handle; drawer slides along +X for municipal disposal.' },
];

export const LEFTOVER_STEPS = [
  { id: 'open_door', label: '1. Access Door Opens to 55°', desc: 'Leftover Food Access Door pivots around straight chord hinge into a 55° ramp.' },
  { id: 'deposit', label: '2. Food Deposited on Ramp', desc: 'Cooked/wet food is loaded onto the ramp, sliding into the 90° sector (+X, +Z).' },
  { id: 'close_door', label: '3. Door Closes Flush', desc: 'Door returns to upright closed position, maintaining internal pneumatic odor seal.' },
  { id: 'drain', label: '4. Liquid Gravitational Drainage', desc: 'High-moisture liquids separate gravitationally down to leachate collection.' },
  { id: 'store', label: '5. Stabilized Food Storage', desc: 'Solid food particles are aerated by exhaust airflow, preventing anaerobic odors.' },
  { id: 'extract', label: '6. Output Drawer Extraction', desc: 'Leftover food drawer extracts linearly along +Z for clean, bag-free disposal.' },
];

/**
 * Controller executing visual presentation workflows for Organic, Inorganic, and Leftover Food.
 */
export class WorkflowController {
  /**
   * @param {THREE.Group} envelope - Master Gomikin envelope
   * @param {THREE.Scene} scene - Three.js scene
   */
  constructor(envelope, scene) {
    this.envelope = envelope;
    this.scene = scene;
    this.activeMode = null; // null | 'ORGANIC' | 'INORGANIC' | 'LEFTOVER_FOOD'
    this.progress = 0.0;
    this.isPlaying = false;
    this.duration = 16.0; // 16 seconds per complete workflow sequence
    this.onUpdateCallbacks = [];

    // Visual waste indicator particle mesh
    this.wasteMarker = this.createWasteMarker();
    this.scene.add(this.wasteMarker);
    this.wasteMarker.visible = false;

    // Scan beam indicator
    this.scanBeam = this.createScanBeam();
    this.scene.add(this.scanBeam);
    this.scanBeam.visible = false;

    // Baseline object references
    this.cacheBaselineReferences();
  }

  createWasteMarker() {
    const group = new THREE.Group();
    group.name = 'Workflow_WasteParticle';

    const geo = new THREE.SphereGeometry(0.024, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x15803d,
      emissiveIntensity: 0.4,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);

    // Subtle pulsing halo ring
    const haloGeo = new THREE.RingGeometry(0.028, 0.034, 24);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.name = 'WasteParticle_Halo';
    group.add(halo);

    return group;
  }

  createScanBeam() {
    const geo = new THREE.CylinderGeometry(0.010, 0.065, 0.080, 16, 1, true);
    geo.translate(0, -0.040, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'Workflow_ScanBeam';
    mesh.position.set(0, 0.990, 0.040);
    return mesh;
  }

  cacheBaselineReferences() {
    this.rotBaseAssembly = this.envelope.getObjectByName('RotatingBaseAssembly');
    this.axisPivot1 = this.envelope.getObjectByName('AxisPivot_1');
    this.axisPivot2 = this.envelope.getObjectByName('AxisPivot_2');
    this.cuttingBlades = this.envelope.getObjectByName('CuttingBlades');
    this.storageDoorLeft = this.envelope.getObjectByName('StorageDoorLeft');
    this.storageDoorRight = this.envelope.getObjectByName('StorageDoorRight');
    this.decompDrawer = this.envelope.getObjectByName('DecompositionVessel_Drawer');
    this.agitator = this.envelope.getObjectByName('OrganicDecompositionAgitator');
    this.inorgDrawer = this.envelope.getObjectByName('InorganicDrawer');
    this.foodDrawer = this.envelope.getObjectByName('LeftoverFoodDrawer');
    this.foodDoor = this.envelope.getObjectByName('LeftoverFoodDoor_Pivot')
      || this.envelope.getObjectByName('LeftoverFoodAccessDoor_Hinge');
  }

  /**
   * Selects a workflow mode: 'ORGANIC', 'INORGANIC', 'LEFTOVER_FOOD'.
   */
  setMode(mode) {
    if (!mode) return;
    const normalized = String(mode).toUpperCase();
    this.reset();
    this.activeMode = normalized;
    this.progress = 0.0;
    this.wasteMarker.visible = true;

    // Set waste marker material color based on workflow
    const mesh = this.wasteMarker.children[0];
    const halo = this.wasteMarker.getObjectByName('WasteParticle_Halo');
    if (mode === WORKFLOW_MODES.ORGANIC) {
      mesh.material.color.setHex(0x22c55e); // Organic Green
      mesh.material.emissive.setHex(0x15803d);
      if (halo) halo.material.color.setHex(0x4ade80);
    } else if (mode === WORKFLOW_MODES.INORGANIC) {
      mesh.material.color.setHex(0x06b6d4); // Inorganic Cyan
      mesh.material.emissive.setHex(0x0891b2);
      if (halo) halo.material.color.setHex(0x38bdf8);
    } else if (mode === WORKFLOW_MODES.LEFTOVER_FOOD) {
      mesh.material.color.setHex(0xf59e0b); // Food Amber / Terracotta
      mesh.material.emissive.setHex(0xb45309);
      if (halo) halo.material.color.setHex(0xfbbf24);
    }

    this.setProgress(0.0);
  }

  play() {
    if (!this.activeMode) {
      this.setMode(WORKFLOW_MODES.ORGANIC);
    }
    this.isPlaying = true;
    if (this.progress >= 1.0) {
      this.progress = 0.0;
    }
  }

  pause() {
    this.isPlaying = false;
  }

  reset() {
    this.pause();
    this.progress = 0.0;
    this.wasteMarker.visible = false;
    this.scanBeam.visible = false;

    // Restore all mechanical component baselines
    if (this.axisPivot1) this.axisPivot1.rotation.y = 0;
    if (this.axisPivot2) this.axisPivot2.rotation.x = 0;
    if (this.cuttingBlades) this.cuttingBlades.rotation.y = 0;
    if (this.storageDoorLeft) this.storageDoorLeft.rotation.z = 0;
    if (this.storageDoorRight) this.storageDoorRight.rotation.z = 0;
    if (this.decompDrawer) this.decompDrawer.position.x = 0;
    if (this.agitator) this.agitator.rotation.y = 0;
    if (this.inorgDrawer) this.inorgDrawer.position.x = 0;
    if (this.foodDrawer) this.foodDrawer.position.z = 0;
    if (this.foodDoor) this.foodDoor.rotation.x = 0;

    this.envelope.updateMatrixWorld(true);
    this.notifyUpdate();
  }

  setProgress(t) {
    this.progress = Math.max(0.0, Math.min(1.0, Number(t) || 0.0));

    if (this.activeMode === WORKFLOW_MODES.ORGANIC) {
      this.updateOrganicWorkflow(this.progress);
    } else if (this.activeMode === WORKFLOW_MODES.INORGANIC) {
      this.updateInorganicWorkflow(this.progress);
    } else if (this.activeMode === WORKFLOW_MODES.LEFTOVER_FOOD) {
      this.updateLeftoverWorkflow(this.progress);
    }

    this.notifyUpdate();
  }

  updateOrganicWorkflow(p) {
    // 9 stages: [0 to 1]
    // 1. Enter funnel: p in [0.00, 0.11] -> Y: 1.02 down to 0.945 (on rotating base)
    // 2. Settle & Sense: p in [0.11, 0.22] -> scan beam active at (0, 0.945, 0)
    // 3. Route to 180°: p in [0.22, 0.33] -> base tilts -25° toward -X
    // 4. Fall into cutting & shear: p in [0.33, 0.45] -> waste moves to (-0.08, 0.900, 0); blades spin fast!
    // 5. Screen passage: p in [0.45, 0.55] -> waste size shrinks, passes through screen to Y = 0.860
    // 6. Accumulate on drainage: p in [0.55, 0.67] -> sits on drainage screen at Y = 0.635
    // 7. Drop doors open & drop: p in [0.67, 0.78] -> doors swing 45°, waste drops to Y = 0.250 in decomp vessel
    // 8. Agitator mixes: p in [0.78, 0.89] -> agitator spins, mixing waste
    // 9. Harvest output: p in [0.89, 1.00] -> decomp drawer slides along -X to -0.300 m

    // Reset components to default before applying time-windowed values
    if (this.axisPivot1) this.axisPivot1.rotation.y = 0;
    if (this.axisPivot2) this.axisPivot2.rotation.x = 0;
    if (this.cuttingBlades) this.cuttingBlades.rotation.y = 0;
    if (this.storageDoorLeft) this.storageDoorLeft.rotation.z = 0;
    if (this.storageDoorRight) this.storageDoorRight.rotation.z = 0;
    if (this.decompDrawer) this.decompDrawer.position.x = 0;
    if (this.agitator) this.agitator.rotation.y = 0;
    this.scanBeam.visible = false;

    const wasteMesh = this.wasteMarker.children[0];
    wasteMesh.scale.set(1, 1, 1);

    if (p <= 0.11) {
      const u = p / 0.11;
      this.wasteMarker.position.set(0, THREE.MathUtils.lerp(1.02, 0.945, u), 0);
    } else if (p <= 0.22) {
      // Settled & Sensed
      this.wasteMarker.position.set(0, 0.945, 0);
      this.scanBeam.visible = true;
    } else if (p <= 0.33) {
      // Platform routes to 180° Organic sector (-X)
      const u = (p - 0.22) / 0.11;
      const tilt = THREE.MathUtils.degToRad(-25 * u);
      if (this.axisPivot1) this.axisPivot1.rotation.y = Math.PI / 2; // Orient toward -X
      if (this.axisPivot2) this.axisPivot2.rotation.x = tilt;
      this.wasteMarker.position.set(-0.04 * u, 0.945 - 0.02 * u, 0);
    } else if (p <= 0.45) {
      // Fall into cutting chamber and shear blades
      const u = (p - 0.33) / 0.12;
      this.wasteMarker.position.set(
        THREE.MathUtils.lerp(-0.04, -0.09, u),
        THREE.MathUtils.lerp(0.925, 0.895, u),
        0
      );
      // High-speed blade rotation!
      if (this.cuttingBlades) {
        this.cuttingBlades.rotation.y = u * Math.PI * 12;
      }
    } else if (p <= 0.55) {
      // Sizing screen passage: particle shrinks
      const u = (p - 0.45) / 0.10;
      const s = THREE.MathUtils.lerp(1.0, 0.55, u);
      wasteMesh.scale.set(s, s, s);
      this.wasteMarker.position.set(-0.09, THREE.MathUtils.lerp(0.895, 0.860, u), 0);
    } else if (p <= 0.67) {
      // Drops to drainage screen at Y = 635 mm
      const u = (p - 0.55) / 0.12;
      wasteMesh.scale.set(0.55, 0.55, 0.55);
      this.wasteMarker.position.set(
        THREE.MathUtils.lerp(-0.09, -0.12, u),
        THREE.MathUtils.lerp(0.860, 0.635, u),
        0
      );
    } else if (p <= 0.78) {
      // Storage drop doors open to 45°, mass drops into decomp chamber
      const u = (p - 0.67) / 0.11;
      wasteMesh.scale.set(0.55, 0.55, 0.55);
      const angle = THREE.MathUtils.degToRad(45 * u);
      if (this.storageDoorLeft) this.storageDoorLeft.rotation.z = -angle;
      if (this.storageDoorRight) this.storageDoorRight.rotation.z = angle;
      this.wasteMarker.position.set(-0.12, THREE.MathUtils.lerp(0.635, 0.220, u), 0);
    } else if (p <= 0.89) {
      // Agitator mixing in decomposition vessel
      const u = (p - 0.78) / 0.11;
      wasteMesh.scale.set(0.55, 0.55, 0.55);
      this.wasteMarker.position.set(
        -0.12 + Math.cos(u * Math.PI * 4) * 0.05,
        0.220,
        Math.sin(u * Math.PI * 4) * 0.05
      );
      if (this.agitator) {
        this.agitator.rotation.y = u * Math.PI * 4;
      }
    } else {
      // Harvest: Decomposition drawer extracts along -X by 300 mm
      const u = (p - 0.89) / 0.11;
      wasteMesh.scale.set(0.55, 0.55, 0.55);
      const extX = -0.300 * u;
      if (this.decompDrawer) {
        this.decompDrawer.position.x = extX;
      }
      this.wasteMarker.position.set(-0.12 + extX, 0.220, 0);
    }

    this.envelope.updateMatrixWorld(true);
  }

  updateInorganicWorkflow(p) {
    // 6 stages:
    // 1. Enter funnel: p in [0.00, 0.16] -> Y: 1.02 down to 0.945
    // 2. Sensed: p in [0.16, 0.32] -> scan beam fires
    // 3. Platform routes toward Inorganic (+X, -Z): p in [0.32, 0.48] -> tilts
    // 4. Drops into inorganic chamber: p in [0.48, 0.65] -> falls to Y = 0.240
    // 5. Accumulates in drawer: p in [0.65, 0.82]
    // 6. Extraction: p in [0.82, 1.00] -> drawer slides along +X by 300 mm

    if (this.axisPivot1) this.axisPivot1.rotation.y = 0;
    if (this.axisPivot2) this.axisPivot2.rotation.x = 0;
    if (this.inorgDrawer) this.inorgDrawer.position.x = 0;
    this.scanBeam.visible = false;

    if (p <= 0.16) {
      const u = p / 0.16;
      this.wasteMarker.position.set(0, THREE.MathUtils.lerp(1.02, 0.945, u), 0);
    } else if (p <= 0.32) {
      this.wasteMarker.position.set(0, 0.945, 0);
      this.scanBeam.visible = true;
    } else if (p <= 0.48) {
      const u = (p - 0.32) / 0.16;
      // Orient toward +X, -Z quadrant (-45°)
      if (this.axisPivot1) this.axisPivot1.rotation.y = -Math.PI / 4;
      if (this.axisPivot2) this.axisPivot2.rotation.x = THREE.MathUtils.degToRad(25 * u);
      this.wasteMarker.position.set(0.04 * u, 0.945 - 0.02 * u, -0.04 * u);
    } else if (p <= 0.65) {
      const u = (p - 0.48) / 0.17;
      this.wasteMarker.position.set(
        THREE.MathUtils.lerp(0.04, 0.120, u),
        THREE.MathUtils.lerp(0.925, 0.240, u),
        THREE.MathUtils.lerp(-0.04, -0.120, u)
      );
    } else if (p <= 0.82) {
      this.wasteMarker.position.set(0.120, 0.240, -0.120);
    } else {
      const u = (p - 0.82) / 0.18;
      const extX = 0.300 * u;
      if (this.inorgDrawer) {
        this.inorgDrawer.position.x = extX;
      }
      this.wasteMarker.position.set(0.120 + extX, 0.240, -0.120);
    }

    this.envelope.updateMatrixWorld(true);
  }

  updateLeftoverWorkflow(p) {
    // 6 stages:
    // 1. Access Door opens to 55°: p in [0.00, 0.18] -> door pivots to 55°
    // 2. Food deposited on ramp: p in [0.18, 0.36] -> food slides from (0.19, 0.74, 0.19) down to (0.13, 0.70, 0.13)
    // 3. Door closes flush: p in [0.36, 0.52] -> door pivots back to 0°
    // 4. Liquid drains, solids settle: p in [0.52, 0.70] -> food settles in drawer at Y = 0.240
    // 5. Holding / stabilized: p in [0.70, 0.84]
    // 6. Extraction: p in [0.84, 1.00] -> leftover drawer extracts along +Z by 300 mm

    if (this.foodDrawer) this.foodDrawer.position.z = 0;
    if (this.foodDoor) this.foodDoor.rotation.x = 0;

    if (p <= 0.18) {
      const u = p / 0.18;
      if (this.foodDoor) {
        this.foodDoor.rotation.x = u * THREE.MathUtils.degToRad(55);
      }
      this.wasteMarker.position.set(0.20, 0.76, 0.20);
    } else if (p <= 0.36) {
      const u = (p - 0.18) / 0.18;
      if (this.foodDoor) {
        this.foodDoor.rotation.x = THREE.MathUtils.degToRad(55);
      }
      // Food slides down ramp into chamber
      this.wasteMarker.position.set(
        THREE.MathUtils.lerp(0.20, 0.128, u),
        THREE.MathUtils.lerp(0.76, 0.700, u),
        THREE.MathUtils.lerp(0.20, 0.128, u)
      );
    } else if (p <= 0.52) {
      const u = (p - 0.36) / 0.16;
      if (this.foodDoor) {
        this.foodDoor.rotation.x = (1.0 - u) * THREE.MathUtils.degToRad(55);
      }
      this.wasteMarker.position.set(0.128, THREE.MathUtils.lerp(0.700, 0.400, u), 0.128);
    } else if (p <= 0.70) {
      const u = (p - 0.52) / 0.18;
      this.wasteMarker.position.set(0.128, THREE.MathUtils.lerp(0.400, 0.240, u), 0.128);
    } else if (p <= 0.84) {
      this.wasteMarker.position.set(0.128, 0.240, 0.128);
    } else {
      const u = (p - 0.84) / 0.16;
      const extZ = 0.300 * u;
      if (this.foodDrawer) {
        this.foodDrawer.position.z = extZ;
      }
      this.wasteMarker.position.set(0.128, 0.240, 0.128 + extZ);
    }

    this.envelope.updateMatrixWorld(true);
  }

  getCurrentStep() {
    if (!this.activeMode) return null;
    let steps = [];
    if (this.activeMode === WORKFLOW_MODES.ORGANIC) steps = ORGANIC_STEPS;
    else if (this.activeMode === WORKFLOW_MODES.INORGANIC) steps = INORGANIC_STEPS;
    else if (this.activeMode === WORKFLOW_MODES.LEFTOVER_FOOD) steps = LEFTOVER_STEPS;

    const count = steps.length;
    const index = Math.min(count - 1, Math.floor(this.progress * count));
    return { index, total: count, ...steps[index] };
  }

  update(deltaTime) {
    if (!this.isPlaying) return;

    let nextProgress = this.progress + (deltaTime / this.duration);
    if (nextProgress >= 1.0) {
      nextProgress = 1.0;
      this.pause();
    }
    this.setProgress(nextProgress);
  }

  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallbacks.push(callback);
    }
  }

  notifyUpdate() {
    const step = this.getCurrentStep();
    for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
      this.onUpdateCallbacks[i]({
        mode: this.activeMode,
        progress: this.progress,
        isPlaying: this.isPlaying,
        step,
      });
    }
  }
}
