import * as THREE from 'three';

/**
 * Stages definition for the Dissection / Exploded presentation animation.
 */
export const DISSECTION_STAGES = [
  { id: 'assembled', name: '1. Fully Assembled', progress: 0.0, description: 'Complete assembled Gomikin apparatus in baseline configuration.' },
  { id: 'shell', name: '2. Outer Enclosure', progress: 0.15, description: 'Outer cylindrical shell and top hood elevate, exposing internal chassis.' },
  { id: 'input', name: '3. Input & Segregation', progress: 0.30, description: 'Receiving funnel, sensors, display, and 2-axis sorting base separate.' },
  { id: 'electronics', name: '4. Electronics & Power', progress: 0.45, description: 'Electronics bay, MCU, 16-cell LiFePO4 battery pack, and wiring loom emerge.' },
  { id: 'cutting', name: '5. Preprocessing & Cutting', progress: 0.60, description: 'Cutting collar, motor, rotary shear cross-blades, and sizing mesh screen separate.' },
  { id: 'storage', name: '6. Organic Storage & Doors', progress: 0.75, description: '180° storage vessel, drainage mesh, exhaust fan, and synchronized drop doors exposed.' },
  { id: 'decomp', name: '7. Decomposition Vessel', progress: 0.88, description: 'Compost vessel extracts with agitator; stationary motor and sensor array revealed.' },
  { id: 'exploded', name: '8. Full Architecture', progress: 1.0, description: 'Inorganic and leftover food output drawers extract; full exploded architecture visible.' },
];

/**
 * Controller managing the progressive, reversible dissection / exploded animation of Gomikin.
 */
export class DissectionController {
  /**
   * @param {THREE.Group} envelope - The GomikinEnvelope instance
   */
  constructor(envelope) {
    this.envelope = envelope;
    this.progress = 0.0;
    this.targetProgress = 0.0;
    this.isPlaying = false;
    this.duration = 14.0; // 14 seconds for complete smooth sweep
    this.playbackDirection = 1; // 1 = forward, -1 = reverse
    this.onUpdateCallbacks = [];

    // Registered movable components with their baseline resting transforms
    this.movables = [];
    this.initMovableComponents();
  }

  /**
   * Registers a movable component with its initial baseline transform and target exploded transform.
   */
  registerComponent(objectOrQuery, config) {
    let obj = null;
    if (typeof objectOrQuery === 'string') {
      obj = this.envelope.getObjectByName(objectOrQuery);
    } else {
      obj = objectOrQuery;
    }

    if (!obj) {
      return null;
    }

    const baseline = {
      position: obj.position.clone(),
      quaternion: obj.quaternion.clone(),
      scale: obj.scale.clone(),
      rotation: obj.rotation.clone(),
    };

    const entry = {
      obj,
      baseline,
      deltaPos: config.deltaPos || new THREE.Vector3(0, 0, 0),
      deltaRot: config.deltaRot || new THREE.Euler(0, 0, 0),
      tStart: config.tStart !== undefined ? config.tStart : 0.0,
      tEnd: config.tEnd !== undefined ? config.tEnd : 1.0,
      customUpdate: config.customUpdate || null,
    };

    this.movables.push(entry);
    return entry;
  }

  /**
   * Initializes all component baseline references and explosion trajectories.
   */
  initMovableComponents() {
    this.movables = [];

    // 1. Outer Shell: lifts vertically along +Y
    this.registerComponent('MainShell', {
      deltaPos: new THREE.Vector3(0, 0.360, 0),
      tStart: 0.00,
      tEnd: 0.20,
    });

    // 2. Top Hood Lid: lifts along +Y above shell
    this.registerComponent('TopClosure', {
      deltaPos: new THREE.Vector3(0, 0.480, 0),
      tStart: 0.00,
      tEnd: 0.22,
    });

    // 3. User Interaction Display: lifts forward and upward
    this.registerComponent('Display', {
      deltaPos: new THREE.Vector3(0, 0.460, 0.160),
      tStart: 0.02,
      tEnd: 0.24,
    });

    // 4. Input Receiving Funnel: lifts along +Y
    this.registerComponent('Funnel', {
      deltaPos: new THREE.Vector3(0, 0.280, 0),
      tStart: 0.12,
      tEnd: 0.32,
    });

    // 5. Input Camera & Ultrasonic Sensor
    this.registerComponent('Camera', {
      deltaPos: new THREE.Vector3(0, 0.240, 0),
      tStart: 0.14,
      tEnd: 0.34,
    });
    this.registerComponent('UltrasonicSensor', {
      deltaPos: new THREE.Vector3(0, 0.240, 0),
      tStart: 0.14,
      tEnd: 0.34,
    });

    // 6. Rotating Base Assembly: lifts slightly and tilts pitch by 15° to showcase gimbal
    const rotBaseAssembly = this.envelope.getObjectByName('RotatingBaseAssembly');
    const axisPivot2 = this.envelope.getObjectByName('AxisPivot_2');
    this.registerComponent(rotBaseAssembly, {
      deltaPos: new THREE.Vector3(0, 0.140, 0),
      tStart: 0.16,
      tEnd: 0.36,
      customUpdate: (entry, factor) => {
        if (axisPivot2) {
          axisPivot2.rotation.x = THREE.MathUtils.degToRad(18 * factor);
        }
      }
    });

    // 7. Leftover Food Top Closure (mounting deck for Electronics Bay): lifts slightly
    this.registerComponent('LeftoverFoodTopClosure', {
      deltaPos: new THREE.Vector3(0, 0.120, 0),
      tStart: 0.22,
      tEnd: 0.40,
    });

    // 8. Electronics Bay Housing: slides diagonally outward in +X, +Z quadrant
    this.registerComponent('ElectronicsBay', {
      deltaPos: new THREE.Vector3(0.140, 0.060, 0.140),
      tStart: 0.26,
      tEnd: 0.46,
    });

    // 8a. Electronics Bay Battery Box: extracts outward from housing
    this.registerComponent('ElectronicsBay_BatteryBox', {
      deltaPos: new THREE.Vector3(0.060, 0, 0.060),
      tStart: 0.32,
      tEnd: 0.48,
    });

    // 8b. Electronics Bay MCU: lifts vertically out of housing
    this.registerComponent('ElectronicsBay_MCU', {
      deltaPos: new THREE.Vector3(0, 0.040, 0),
      tStart: 0.30,
      tEnd: 0.48,
    });

    // 9. Cutting Collar Support Framework & Cutting Motor: lift upward along +Y
    this.registerComponent('CuttingAssemblySupport', {
      deltaPos: new THREE.Vector3(0, 0.130, 0),
      tStart: 0.40,
      tEnd: 0.58,
    });
    this.registerComponent('CuttingMotor', {
      deltaPos: new THREE.Vector3(0, 0.130, 0),
      tStart: 0.40,
      tEnd: 0.58,
    });

    // 10. Cutting Drive Shaft & Blades: lowers slightly and rotates
    const cuttingBlades = this.envelope.getObjectByName('CuttingBlades');
    this.registerComponent('CuttingShaft', {
      deltaPos: new THREE.Vector3(0, -0.015, 0),
      tStart: 0.42,
      tEnd: 0.60,
    });
    this.registerComponent(cuttingBlades, {
      deltaPos: new THREE.Vector3(0, -0.015, 0),
      tStart: 0.42,
      tEnd: 0.60,
      customUpdate: (entry, factor) => {
        if (cuttingBlades) {
          cuttingBlades.rotation.y = entry.baseline.rotation.y + factor * Math.PI;
        }
      }
    });

    // 11. Sizing Screen Mesh: drops downward along -Y toward storage
    this.registerComponent('CuttingSizingScreen', {
      deltaPos: new THREE.Vector3(0, -0.055, 0),
      tStart: 0.44,
      tEnd: 0.62,
    });

    // 12. Organic Storage Chamber: shifts laterally along -X
    this.registerComponent('OrganicStorageChamber', {
      deltaPos: new THREE.Vector3(-0.080, 0, 0),
      tStart: 0.52,
      tEnd: 0.70,
    });

    // 13. Perforated Drainage Screen: lifts upward along +Y above drop doors
    this.registerComponent('PerforatedDrainageScreen', {
      deltaPos: new THREE.Vector3(0, 0.065, 0),
      tStart: 0.54,
      tEnd: 0.72,
    });

    // 14. Organic Storage Exhaust Fan: slides outward along -X, -Z
    this.registerComponent('OrganicStorageFan', {
      deltaPos: new THREE.Vector3(-0.140, 0, -0.080),
      tStart: 0.55,
      tEnd: 0.73,
    });

    // 15. Storage Center-Hinged Drop Doors: swing open 45°
    const doorLeft = this.envelope.getObjectByName('StorageDoorLeft');
    const doorRight = this.envelope.getObjectByName('StorageDoorRight');
    if (doorLeft && doorRight) {
      this.registerComponent('StorageSynchronizedDoorsAssembly', {
        deltaPos: new THREE.Vector3(0, 0, 0),
        tStart: 0.58,
        tEnd: 0.76,
        customUpdate: (entry, factor) => {
          const maxDoorAngle = THREE.MathUtils.degToRad(45);
          doorLeft.rotation.z = -factor * maxDoorAngle;
          doorRight.rotation.z = factor * maxDoorAngle;
        }
      });
    }

    // 16. Decomposition Vessel Drawer: extracts linearly along -X by 260 mm
    const decompDrawer = this.envelope.getObjectByName('DecompositionVessel_Drawer');
    const agitator = this.envelope.getObjectByName('OrganicDecompositionAgitator');
    this.registerComponent(decompDrawer, {
      deltaPos: new THREE.Vector3(-0.260, 0, 0),
      tStart: 0.68,
      tEnd: 0.86,
      customUpdate: (entry, factor) => {
        if (agitator) {
          agitator.rotation.y = factor * Math.PI * 0.75;
        }
      }
    });

    // 17. Inorganic Output Drawer: extracts linearly along +X by 260 mm
    this.registerComponent('InorganicDrawer', {
      deltaPos: new THREE.Vector3(0.260, 0, 0),
      tStart: 0.76,
      tEnd: 0.94,
    });

    // 18. Leftover Food Output Drawer: extracts linearly along +Z by 260 mm
    this.registerComponent('LeftoverFoodDrawer', {
      deltaPos: new THREE.Vector3(0, 0, 0.260),
      tStart: 0.78,
      tEnd: 0.96,
    });

    // 19. Leftover Food Access Door: rotates around straight chord hinge axis to 55° ramp
    const doorPivot = this.envelope.getObjectByName('LeftoverFoodDoor_Pivot')
      || this.envelope.getObjectByName('LeftoverFoodAccessDoor_Hinge');
    if (doorPivot) {
      this.registerComponent(doorPivot, {
        deltaPos: new THREE.Vector3(0, 0, 0),
        tStart: 0.80,
        tEnd: 0.98,
        customUpdate: (entry, factor) => {
          doorPivot.rotation.x = factor * THREE.MathUtils.degToRad(55);
        }
      });
    }
  }

  /**
   * Sets the absolute progress [0.0, 1.0] of the dissection animation.
   * Smoothly interpolates positions, rotations, and custom joint angles.
   * At progress = 0.0, every single component returns exactly to baseline coordinates.
   * @param {number} t - Normalized progress from 0.0 to 1.0
   */
  setProgress(t) {
    this.progress = Math.max(0.0, Math.min(1.0, Number(t) || 0.0));

    for (let i = 0; i < this.movables.length; i++) {
      const entry = this.movables[i];
      const { obj, baseline, deltaPos, deltaRot, tStart, tEnd, customUpdate } = entry;

      let factor = 0.0;
      if (this.progress <= tStart) {
        factor = 0.0;
      } else if (this.progress >= tEnd) {
        factor = 1.0;
      } else {
        const u = (this.progress - tStart) / (tEnd - tStart);
        // Smooth Hermite S-curve interpolation (smoothstep)
        factor = u * u * (3.0 - 2.0 * u);
      }

      // Update translation
      obj.position.x = baseline.position.x + deltaPos.x * factor;
      obj.position.y = baseline.position.y + deltaPos.y * factor;
      obj.position.z = baseline.position.z + deltaPos.z * factor;

      // Update rotation if custom deltaRot exists
      if (deltaRot.x !== 0 || deltaRot.y !== 0 || deltaRot.z !== 0) {
        obj.rotation.x = baseline.rotation.x + deltaRot.x * factor;
        obj.rotation.y = baseline.rotation.y + deltaRot.y * factor;
        obj.rotation.z = baseline.rotation.z + deltaRot.z * factor;
      }

      // Execute custom update for kinematics (doors, agitator, rot base, blades)
      if (customUpdate) {
        customUpdate(entry, factor);
      }

      obj.updateMatrixWorld(true);
    }

    this.envelope.updateMatrixWorld(true);
    this.notifyUpdate();
  }

  /**
   * Resets all components to their exact assembled state (progress = 0).
   */
  reset() {
    this.pause();
    this.setProgress(0.0);
    this.targetProgress = 0.0;
  }

  /**
   * Starts playing the dissection animation forward or reverse.
   */
  play(direction = 1) {
    this.playbackDirection = direction >= 0 ? 1 : -1;
    this.isPlaying = true;
    if (this.playbackDirection > 0 && this.progress >= 1.0) {
      this.progress = 0.0;
    } else if (this.playbackDirection < 0 && this.progress <= 0.0) {
      this.progress = 1.0;
    }
  }

  /**
   * Pauses the animation.
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Jumps to a specific stage index (0 to 7).
   */
  setStage(stageIndex) {
    this.pause();
    const stage = DISSECTION_STAGES[stageIndex];
    if (stage) {
      this.setProgress(stage.progress);
    }
  }

  /**
   * Returns current stage info based on progress.
   */
  getCurrentStage() {
    for (let i = DISSECTION_STAGES.length - 1; i >= 0; i--) {
      if (this.progress >= DISSECTION_STAGES[i].progress - 0.01) {
        return { index: i, ...DISSECTION_STAGES[i] };
      }
    }
    return { index: 0, ...DISSECTION_STAGES[0] };
  }

  /**
   * Animation loop update method called each frame.
   * @param {number} deltaTime - Time elapsed in seconds
   */
  update(deltaTime) {
    if (!this.isPlaying) return;

    const deltaProgress = (deltaTime / this.duration) * this.playbackDirection;
    let nextProgress = this.progress + deltaProgress;

    if (nextProgress >= 1.0) {
      nextProgress = 1.0;
      this.pause();
    } else if (nextProgress <= 0.0) {
      nextProgress = 0.0;
      this.pause();
    }

    this.setProgress(nextProgress);
  }

  /**
   * Registers a callback invoked whenever the progress changes.
   */
  onUpdate(callback) {
    if (typeof callback === 'function') {
      this.onUpdateCallbacks.push(callback);
    }
  }

  notifyUpdate() {
    const stage = this.getCurrentStage();
    for (let i = 0; i < this.onUpdateCallbacks.length; i++) {
      this.onUpdateCallbacks[i]({
        progress: this.progress,
        isPlaying: this.isPlaying,
        stage,
      });
    }
  }
}
