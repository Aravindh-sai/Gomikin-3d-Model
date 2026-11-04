import * as THREE from 'three';

/**
 * Exact mechanical pivot node names defined in the updated Blender GLB model.
 */
export const PIVOT_NAMES = Object.freeze({
  ROTATING_BASE: 'PIVOT_Rotating_Base',
  LEFT_DOOR: 'PIVOT_Left_Door',
  RIGHT_DOOR: 'PIVOT_Right_Door',
  AGITATOR: 'PIVOT_Agitator',
  CUTTING_BLADES: 'PIVOT_Cutting_Blades'
});

/**
 * Mechanical motion boundaries and kinematics validated from Blender engineering model.
 */
export const MECHANICAL_LIMITS = Object.freeze({
  ROTATING_BASE: {
    axis: 'y', // Agreed production mechanical axis
    targetDeg: -10,
    targetRad: THREE.MathUtils.degToRad(-10)
  },
  LEFT_DOOR: {
    axis: 'x', // Opens downward
    openDeg: 25,
    openRad: THREE.MathUtils.degToRad(25)
  },
  RIGHT_DOOR: {
    axis: 'x', // Opens downward
    openDeg: -25,
    openRad: THREE.MathUtils.degToRad(-25)
  },
  AGITATOR: {
    axis: 'z', // Continuous mixing rotation
    defaultSpeedRad: THREE.MathUtils.degToRad(360) // 1 revolution per second default
  },
  CUTTING_BLADES: {
    axis: 'z', // High-speed cutting rotation
    defaultSpeedRad: THREE.MathUtils.degToRad(1200) // ~3.33 revolutions per second default
  }
});

/**
 * Standard cubic ease-in-out easing function for natural mechanical transitions.
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * MechanicalPivotController
 * 
 * Centralized controller managing the 5 imported mechanical pivot objects:
 * 1. PIVOT_Rotating_Base (Y-axis rotation: -10°)
 * 2. PIVOT_Left_Door (X-axis opening: +25°)
 * 3. PIVOT_Right_Door (X-axis opening: -25°)
 * 4. PIVOT_Agitator (Z-axis continuous mixing rotation)
 * 5. PIVOT_Cutting_Blades (Z-axis continuous high-speed cutting rotation)
 * 
 * Guarantees:
 * - Preserves original imported baseline quaternions (never overwrites base orientations).
 * - Applies angular offsets relative to baseline via local quaternion multiplication.
 * - Interpolates smooth discrete movements with configurable durations.
 * - Updates continuous rotations independently of frame rate using deltaTime.
 * - Child CAD meshes inherit pivot rotations naturally.
 * - Comprehensive state queries and reset mechanism.
 */
export class MechanicalPivotController {
  /**
   * @param {THREE.Object3D} modelRoot Root model or scene containing the pivots
   */
  constructor(modelRoot) {
    if (!modelRoot) {
      throw new Error('MechanicalPivotController requires a valid modelRoot.');
    }
    this.root = modelRoot;
    this.isInitialized = false;

    // Storage for the 5 pivot controllers
    this.pivots = {
      rotatingBase: {
        name: PIVOT_NAMES.ROTATING_BASE,
        object: null,
        baseQuaternion: new THREE.Quaternion(),
        axis: new THREE.Vector3(0, 1, 0), // Local Y axis
        currentAngle: 0,
        startAngle: 0,
        targetAngle: 0,
        isAnimating: false,
        duration: 1.0,
        elapsed: 0
      },
      leftDoor: {
        name: PIVOT_NAMES.LEFT_DOOR,
        object: null,
        baseQuaternion: new THREE.Quaternion(),
        axis: new THREE.Vector3(1, 0, 0), // Local X axis
        currentAngle: 0,
        startAngle: 0,
        targetAngle: 0,
        isOpen: false,
        isAnimating: false,
        duration: 0.8,
        elapsed: 0
      },
      rightDoor: {
        name: PIVOT_NAMES.RIGHT_DOOR,
        object: null,
        baseQuaternion: new THREE.Quaternion(),
        axis: new THREE.Vector3(1, 0, 0), // Local X axis
        currentAngle: 0,
        startAngle: 0,
        targetAngle: 0,
        isOpen: false,
        isAnimating: false,
        duration: 0.8,
        elapsed: 0
      },
      agitator: {
        name: PIVOT_NAMES.AGITATOR,
        object: null,
        baseQuaternion: new THREE.Quaternion(),
        axis: new THREE.Vector3(0, 0, 1), // Local Z axis
        currentAngle: 0,
        speed: 0, // rad/sec
        isContinuous: false
      },
      cuttingBlades: {
        name: PIVOT_NAMES.CUTTING_BLADES,
        object: null,
        baseQuaternion: new THREE.Quaternion(),
        axis: new THREE.Vector3(0, 0, 1), // Local Z axis
        currentAngle: 0,
        speed: 0, // rad/sec
        isContinuous: false
      }
    };

    // Reusable scratch objects to avoid garbage collection
    this._tempQuat = new THREE.Quaternion();

    this.initializeMechanicalPivots(this.root);
  }

  /**
   * Discovers and validates all 5 mechanical pivot objects in the scene.
   * @param {THREE.Object3D} scene Root scene or model container
   * @returns {boolean} True if all 5 pivots are found and initialized
   */
  initializeMechanicalPivots(scene) {
    const missing = [];

    for (const key of Object.keys(this.pivots)) {
      const p = this.pivots[key];
      const obj = scene.getObjectByName(p.name);
      if (!obj) {
        missing.push(p.name);
      } else {
        p.object = obj;
        // Capture pristine baseline quaternion
        p.baseQuaternion.copy(obj.quaternion);
        p.currentAngle = 0;
        p.targetAngle = 0;
      }
    }

    if (missing.length > 0) {
      console.warn(`[MechanicalPivotController] Missing pivots in GLB: ${missing.join(', ')}`);
      this.isInitialized = false;
      return false;
    }

    this.isInitialized = true;
    console.log('[MechanicalPivotController] All 5 mechanical pivots initialized successfully.');
    return true;
  }

  // =========================================================================
  // ROTATING BASE METHODS
  // =========================================================================

  /**
   * Sets the rotating base angle.
   * @param {number} angleRad Angle in radians (default target is -10 deg)
   * @param {boolean} [immediate=false] If true, applies without transition
   * @param {number} [duration=1.0] Transition duration in seconds
   */
  setRotatingBaseAngle(angleRad = MECHANICAL_LIMITS.ROTATING_BASE.targetRad, immediate = false, duration = 1.0) {
    const p = this.pivots.rotatingBase;
    if (!p.object) return;

    if (immediate) {
      p.currentAngle = angleRad;
      p.targetAngle = angleRad;
      p.isAnimating = false;
      this._applyPivotAngle(p);
    } else {
      p.startAngle = p.currentAngle;
      p.targetAngle = angleRad;
      p.duration = Math.max(0.01, duration);
      p.elapsed = 0;
      p.isAnimating = true;
    }
  }

  /**
   * Toggles the rotating base between 0° and -10°.
   * @param {number} [duration=1.0]
   */
  toggleRotatingBase(duration = 1.0) {
    const p = this.pivots.rotatingBase;
    const target = Math.abs(p.targetAngle) < 0.001
      ? MECHANICAL_LIMITS.ROTATING_BASE.targetRad
      : 0;
    this.setRotatingBaseAngle(target, false, duration);
  }

  // =========================================================================
  // LEFT DOOR METHODS (+25° downward opening)
  // =========================================================================

  /**
   * Opens the left door smoothly to +25°.
   * @param {number} [duration=0.8]
   */
  openLeftDoor(duration = 0.8) {
    const p = this.pivots.leftDoor;
    if (!p.object) return;
    p.isOpen = true;
    p.startAngle = p.currentAngle;
    p.targetAngle = MECHANICAL_LIMITS.LEFT_DOOR.openRad;
    p.duration = Math.max(0.01, duration);
    p.elapsed = 0;
    p.isAnimating = true;
  }

  /**
   * Closes the left door smoothly to 0°.
   * @param {number} [duration=0.8]
   */
  closeLeftDoor(duration = 0.8) {
    const p = this.pivots.leftDoor;
    if (!p.object) return;
    p.isOpen = false;
    p.startAngle = p.currentAngle;
    p.targetAngle = 0;
    p.duration = Math.max(0.01, duration);
    p.elapsed = 0;
    p.isAnimating = true;
  }

  /**
   * Toggles the left door open / closed.
   * @param {number} [duration=0.8]
   */
  toggleLeftDoor(duration = 0.8) {
    if (this.pivots.leftDoor.isOpen) {
      this.closeLeftDoor(duration);
    } else {
      this.openLeftDoor(duration);
    }
  }

  // =========================================================================
  // RIGHT DOOR METHODS (-25° downward opening)
  // =========================================================================

  /**
   * Opens the right door smoothly to -25°.
   * @param {number} [duration=0.8]
   */
  openRightDoor(duration = 0.8) {
    const p = this.pivots.rightDoor;
    if (!p.object) return;
    p.isOpen = true;
    p.startAngle = p.currentAngle;
    p.targetAngle = MECHANICAL_LIMITS.RIGHT_DOOR.openRad;
    p.duration = Math.max(0.01, duration);
    p.elapsed = 0;
    p.isAnimating = true;
  }

  /**
   * Closes the right door smoothly to 0°.
   * @param {number} [duration=0.8]
   */
  closeRightDoor(duration = 0.8) {
    const p = this.pivots.rightDoor;
    if (!p.object) return;
    p.isOpen = false;
    p.startAngle = p.currentAngle;
    p.targetAngle = 0;
    p.duration = Math.max(0.01, duration);
    p.elapsed = 0;
    p.isAnimating = true;
  }

  /**
   * Toggles the right door open / closed.
   * @param {number} [duration=0.8]
   */
  toggleRightDoor(duration = 0.8) {
    if (this.pivots.rightDoor.isOpen) {
      this.closeRightDoor(duration);
    } else {
      this.openRightDoor(duration);
    }
  }

  /**
   * Opens both doors simultaneously.
   * @param {number} [duration=0.8]
   */
  openBothDoors(duration = 0.8) {
    this.openLeftDoor(duration);
    this.openRightDoor(duration);
  }

  /**
   * Closes both doors simultaneously.
   * @param {number} [duration=0.8]
   */
  closeBothDoors(duration = 0.8) {
    this.closeLeftDoor(duration);
    this.closeRightDoor(duration);
  }

  // =========================================================================
  // AGITATOR METHODS (Continuous Z rotation)
  // =========================================================================

  /**
   * Sets continuous rotation of the agitator.
   * @param {number} [speedRadPerSec] Angular velocity in rad/sec
   */
  rotateAgitator(speedRadPerSec = MECHANICAL_LIMITS.AGITATOR.defaultSpeedRad) {
    const p = this.pivots.agitator;
    if (!p.object) return;
    p.speed = speedRadPerSec;
    p.isContinuous = Math.abs(speedRadPerSec) > 0.0001;
  }

  /**
   * Stops agitator rotation.
   */
  stopAgitator() {
    const p = this.pivots.agitator;
    p.speed = 0;
    p.isContinuous = false;
  }

  // =========================================================================
  // CUTTING BLADES METHODS (Continuous Z high-speed rotation)
  // =========================================================================

  /**
   * Sets high-speed continuous rotation of the cutting blades.
   * @param {number} [speedRadPerSec] Angular velocity in rad/sec
   */
  rotateCuttingBlades(speedRadPerSec = MECHANICAL_LIMITS.CUTTING_BLADES.defaultSpeedRad) {
    const p = this.pivots.cuttingBlades;
    if (!p.object) return;
    p.speed = speedRadPerSec;
    p.isContinuous = Math.abs(speedRadPerSec) > 0.0001;
  }

  /**
   * Stops cutting blades rotation.
   */
  stopCuttingBlades() {
    const p = this.pivots.cuttingBlades;
    p.speed = 0;
    p.isContinuous = false;
  }

  // =========================================================================
  // RESET & CLEANUP
  // =========================================================================

  /**
   * Resets all five mechanical components back to their exact baseline orientations.
   * Halts any continuous or discrete animations in progress.
   */
  resetMechanicalComponents() {
    for (const key of Object.keys(this.pivots)) {
      const p = this.pivots[key];
      if (!p.object) continue;

      p.currentAngle = 0;
      p.targetAngle = 0;
      p.startAngle = 0;
      p.elapsed = 0;
      p.isAnimating = false;
      if (p.isContinuous !== undefined) {
        p.isContinuous = false;
        p.speed = 0;
      }
      if (p.isOpen !== undefined) {
        p.isOpen = false;
      }

      // Restore exact baseline quaternion
      p.object.quaternion.copy(p.baseQuaternion);
      p.object.updateMatrixWorld(true);
    }
  }

  // =========================================================================
  // FRAME UPDATE LOOP
  // =========================================================================

  /**
   * Updates mechanical animations according to elapsed time.
   * Call once per frame inside the main Three.js render loop.
   * @param {number} deltaTime Frame delta time in seconds
   */
  updateMechanicalAnimations(deltaTime) {
    if (!this.isInitialized) return;

    // Clamp delta to prevent huge jumps on tab switch / lag spikes
    const dt = Math.min(0.1, Math.max(0, deltaTime));

    // 1. Update discrete interpolated pivots (Rotating Base, Left Door, Right Door)
    const discreteKeys = ['rotatingBase', 'leftDoor', 'rightDoor'];
    for (const key of discreteKeys) {
      const p = this.pivots[key];
      if (!p.object || !p.isAnimating) continue;

      p.elapsed += dt;
      const progress = Math.min(1.0, p.elapsed / p.duration);
      const eased = easeInOutCubic(progress);

      p.currentAngle = p.startAngle + (p.targetAngle - p.startAngle) * eased;
      this._applyPivotAngle(p);

      if (progress >= 1.0) {
        p.currentAngle = p.targetAngle;
        p.isAnimating = false;
        this._applyPivotAngle(p);
      }
    }

    // 2. Update continuous rotating pivots (Agitator, Cutting Blades)
    const continuousKeys = ['agitator', 'cuttingBlades'];
    for (const key of continuousKeys) {
      const p = this.pivots[key];
      if (!p.object || !p.isContinuous || Math.abs(p.speed) < 0.0001) continue;

      p.currentAngle = (p.currentAngle + p.speed * dt) % (Math.PI * 2);
      this._applyPivotAngle(p);
    }
  }

  /**
   * Helper to compute and apply the pivot's quaternion relative to its base.
   * @private
   */
  _applyPivotAngle(p) {
    this._tempQuat.setFromAxisAngle(p.axis, p.currentAngle);
    // Multiply base quaternion by local offset quaternion
    p.object.quaternion.copy(p.baseQuaternion).multiply(this._tempQuat);
  }

  // =========================================================================
  // STATE & QUERY API
  // =========================================================================

  /**
   * Returns current mechanical state snapshot for UI / telemetry.
   */
  getState() {
    return {
      isInitialized: this.isInitialized,
      rotatingBase: {
        angleRad: this.pivots.rotatingBase.currentAngle,
        angleDeg: THREE.MathUtils.radToDeg(this.pivots.rotatingBase.currentAngle),
        isAnimating: this.pivots.rotatingBase.isAnimating
      },
      leftDoor: {
        angleRad: this.pivots.leftDoor.currentAngle,
        angleDeg: THREE.MathUtils.radToDeg(this.pivots.leftDoor.currentAngle),
        isOpen: this.pivots.leftDoor.isOpen,
        isAnimating: this.pivots.leftDoor.isAnimating
      },
      rightDoor: {
        angleRad: this.pivots.rightDoor.currentAngle,
        angleDeg: THREE.MathUtils.radToDeg(this.pivots.rightDoor.currentAngle),
        isOpen: this.pivots.rightDoor.isOpen,
        isAnimating: this.pivots.rightDoor.isAnimating
      },
      agitator: {
        speedRadPerSec: this.pivots.agitator.speed,
        isContinuous: this.pivots.agitator.isContinuous
      },
      cuttingBlades: {
        speedRadPerSec: this.pivots.cuttingBlades.speed,
        isContinuous: this.pivots.cuttingBlades.isContinuous
      }
    };
  }
}

