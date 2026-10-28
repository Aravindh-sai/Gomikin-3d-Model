import * as THREE from 'three';

/**
 * Geometric constants for the Gomikin Virtual Door Assembly.
 * Matches baseline CAD dimensions and Leftover-Food compartment sector.
 */
export const VIRTUAL_DOOR_CONFIG = Object.freeze({
  // Cylinder outer radius: 250 mm (500 mm outer diameter)
  radius: 0.250,
  
  // Elevation envelope: sits between lower drawer (Y = 0.384 m) and top closure (Y = 0.925 m)
  // Preserves 4 mm clearance from top cap and drawer top
  yBottom: 0.388,
  yTop: 0.921,
  
  // Angular sector: Leftover-Food quadrant (+X, -Z: 90 degrees)
  thetaStart: Math.PI / 2,   // 90 deg: edge at (X = R, Z = 0) near Rightside_Divider
  thetaLength: Math.PI / 2,  // 90 deg span
  thetaEnd: Math.PI,         // 180 deg: edge at (X = 0, Z = -R) near central_divider
  
  // Max opening angle: 120 degrees from closed position
  maxOpeningAngleDeg: 120.0,
  
  // Default animation duration (seconds)
  animationDuration: 0.8,
  
  // Thickness of door panel (m)
  doorThickness: 0.004
});

/**
 * VirtualDoorAssembly
 * Procedural Three.js-only curved side-opening door for the Leftover-Food compartment.
 * Requires NO changes to the underlying CAD USDZ file.
 */
export class VirtualDoorAssembly {
  /**
   * @param {THREE.Scene} scene
   * @param {ComponentRegistry} componentRegistry
   * @param {THREE.WebGLRenderer} renderer
   */
  constructor(scene, componentRegistry, renderer) {
    this.scene = scene;
    this.registry = componentRegistry;
    this.renderer = renderer;

    this.config = VIRTUAL_DOOR_CONFIG;
    this.height = this.config.yTop - this.config.yBottom; // 0.533 m (533 mm)
    this.yCenter = (this.config.yTop + this.config.yBottom) / 2; // 0.6545 m

    // Animation state
    this.currentAngleDeg = 0.0;
    this.targetAngleDeg = 0.0;
    this.startAngleDeg = 0.0;
    this.animTime = 0.0;
    this.animDuration = this.config.animationDuration;
    this.isAnimating = false;
    this.listeners = [];

    // Housing clipping planes for aperture
    this.clippingPlanes = [];
    this.housingMesh = null;

    // Master container group for complete isolation
    this.group = new THREE.Group();
    this.group.name = 'VirtualDoorAssembly_Group';
    this.scene.add(this.group);

    this.init();
  }

  /**
   * Constructs the door geometry, hinge pivot, frame casing, and aperture clipping.
   */
  init() {
    const R = this.config.radius;
    const H = this.height;

    // 1. Vertical Hinge Line & Dedicated Pivot Group
    // When viewed facing the leftover food door from outside (+X, -Z):
    // The RIGHT edge is at (X = 0, Z = -R) near the central_divider bulkhead.
    // The LEFT edge (free edge) is at (X = R, Z = 0) near Rightside_Divider.
    // Fixed pivot sits exactly on the vertical hinge axis at (X = 0, Y = yCenter, Z = -R).
    this.hingePosition = new THREE.Vector3(0, this.yCenter, -R);

    this.pivotGroup = new THREE.Group();
    this.pivotGroup.name = 'VirtualDoor_HingePivot';
    this.pivotGroup.position.copy(this.hingePosition);
    this.group.add(this.pivotGroup);

    // 2. Door Panel Curved Geometry
    // In global cylindrical coordinates, the closed door covers theta in [pi/2, pi].
    // Three.js CylinderGeometry creates vertices with:
    // x = R * sin(u), z = R * cos(u)
    // For u in [pi/2, pi]: x in [R, 0], z in [0, -R].
    const doorGeo = new THREE.CylinderGeometry(
      R,
      R,
      H,
      48,
      1,
      true, // openEnded
      this.config.thetaStart,
      this.config.thetaLength
    );

    // Geometry is generated centered at (0, 0, 0).
    // Translate geometry so it sits relative to pivotGroup origin (0, yCenter, -R):
    // In global space, cylinder center is at (0, yCenter, 0).
    // Relative to pivot at (0, yCenter, -R), cylinder center is at (0, 0, +R)!
    doorGeo.translate(0, 0, R);

    // Outer door material: clean brushed metallic finish matching Main_Housing
    this.doorMaterial = new THREE.MeshStandardMaterial({
      color: 0xecf0f3,
      roughness: 0.35,
      metalness: 0.25,
      side: THREE.DoubleSide
    });

    this.doorMesh = new THREE.Mesh(doorGeo, this.doorMaterial);
    this.doorMesh.name = 'VirtualDoor_PanelMesh';
    this.doorMesh.castShadow = true;
    this.doorMesh.receiveShadow = true;
    this.pivotGroup.add(this.doorMesh);

    // 3. Crisp Panel Edge Outlines
    const edgeGeo = new THREE.EdgesGeometry(doorGeo, 15);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.85
    });
    this.doorEdges = new THREE.LineSegments(edgeGeo, edgeMat);
    this.doorEdges.name = 'VirtualDoor_PanelEdges';
    this.doorMesh.add(this.doorEdges);

    // 4. Ergonomic Handle / Pull Recess on the Free Latch Edge (X = R, Z = 0)
    // In pivot-relative coordinates, free edge is at (X = R, Z = R).
    const handleGroup = new THREE.Group();
    handleGroup.name = 'VirtualDoor_Handle';
    // Free edge is at (X = R, Z = R) in pivot coords. Outer normal points +X.
    handleGroup.position.set(R + 0.008, 0, R);

    const handleBarGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.16, 16);
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc, // Gomikin Cyan accent
      roughness: 0.3,
      metalness: 0.8
    });
    const handleBar = new THREE.Mesh(handleBarGeo, handleMat);
    handleBar.name = 'VirtualDoor_HandleBar';
    handleGroup.add(handleBar);

    // Top and bottom handle standoffs connecting back to door surface
    [-0.07, 0.07].forEach((yOff) => {
      const standGeo = new THREE.BoxGeometry(0.016, 0.006, 0.008);
      const standMesh = new THREE.Mesh(standGeo, handleMat);
      standMesh.position.set(-0.008, yOff, 0);
      handleGroup.add(standMesh);
    });

    this.doorMesh.add(handleGroup);

    // 5. Realistic Upper & Lower Hinge Pin Hardware (grounded at X = 0, Z = -R)
    this.hingeHardwareGroup = new THREE.Group();
    this.hingeHardwareGroup.name = 'VirtualDoor_HingeHardware';
    this.hingeHardwareGroup.position.set(0, this.yCenter, -R);

    const hingePinGeo = new THREE.CylinderGeometry(0.004, 0.004, H + 0.02, 16);
    const hingeHardwareMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.8,
      roughness: 0.25
    });
    const hingeRod = new THREE.Mesh(hingePinGeo, hingeHardwareMat);
    hingeRod.name = 'VirtualDoor_HingeRod';
    this.hingeHardwareGroup.add(hingeRod);

    // Upper and lower mounting brackets
    [-H / 2, H / 2].forEach((yBracket, idx) => {
      const bracketGeo = new THREE.BoxGeometry(0.014, 0.016, 0.014);
      const bracketMesh = new THREE.Mesh(bracketGeo, hingeHardwareMat);
      bracketMesh.name = `VirtualDoor_HingeBracket_${idx + 1}`;
      bracketMesh.position.set(0, yBracket, 0);
      this.hingeHardwareGroup.add(bracketMesh);
    });

    this.group.add(this.hingeHardwareGroup);

    // 6. Aperture Trim / Casing Frame on Housing Opening
    this.frameGroup = new THREE.Group();
    this.frameGroup.name = 'VirtualDoor_ApertureFrame';
    this.frameGroup.position.set(0, this.yCenter, 0);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.4
    });

    // Top and bottom curved frame lips
    [-H / 2, H / 2].forEach((yLip) => {
      const lipGeo = new THREE.CylinderGeometry(
        R + 0.001,
        R + 0.001,
        0.006,
        48,
        1,
        true,
        this.config.thetaStart,
        this.config.thetaLength
      );
      const lipMesh = new THREE.Mesh(lipGeo, frameMat);
      lipMesh.position.set(0, yLip, 0);
      this.frameGroup.add(lipMesh);
    });

    // Left and right vertical aperture jambs
    const jambGeo = new THREE.BoxGeometry(0.006, H, 0.008);
    // Radial wall jamb at (R, 0)
    const radialJamb = new THREE.Mesh(jambGeo, frameMat);
    radialJamb.position.set(R - 0.003, 0, 0);
    this.frameGroup.add(radialJamb);

    // Bulkhead jamb at (0, -R)
    const bulkheadJamb = new THREE.Mesh(jambGeo, frameMat);
    bulkheadJamb.position.set(0, 0, -R + 0.003);
    this.frameGroup.add(bulkheadJamb);

    this.group.add(this.frameGroup);

    // 7. Setup Housing Aperture (Phase 3 Clipping Strategy)
    this.setupHousingAperture();
  }

  /**
   * Configures local clipping planes on Main_Housing to open the aperture
   * cleanly without mutating original USDZ geometry or hiding unrelated components.
   */
  setupHousingAperture() {
    if (this.renderer) {
      this.renderer.localClippingEnabled = true;
    }

    if (!this.registry) return;

    this.housingMesh = this.registry.get('Main_Housing');
    if (!this.housingMesh || !this.housingMesh.material) return;

    // 4 clipping planes defining the doorway volume in the +X, -Z quadrant:
    // A point is inside the doorway if:
    // 1. X > 0
    // 2. Z < 0
    // 3. Y > yBottom
    // 4. Y < yTop
    // With clipIntersection = true, fragments inside ALL 4 planes are discarded,
    // cutting the exact curved door aperture out of Main_Housing.
    this.clippingPlanes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),                     // dist = -x < 0 when x > 0
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),                      // dist = z < 0 when z < 0
      new THREE.Plane(new THREE.Vector3(0, -1, 0), this.config.yBottom),   // dist = -y + yBottom < 0 when y > yBottom
      new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.config.yTop)       // dist = y - yTop < 0 when y < yTop
    ];

    const mat = this.housingMesh.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => {
        m.clippingPlanes = this.clippingPlanes;
        m.clipIntersection = true;
        m.needsUpdate = true;
      });
    } else {
      mat.clippingPlanes = this.clippingPlanes;
      mat.clipIntersection = true;
      mat.needsUpdate = true;
    }
  }

  /**
   * Removes clipping planes from Main_Housing, restoring unbroken shell.
   */
  removeHousingAperture() {
    if (!this.housingMesh || !this.housingMesh.material) return;

    const mat = this.housingMesh.material;
    if (Array.isArray(mat)) {
      mat.forEach(m => {
        m.clippingPlanes = null;
        m.clipIntersection = false;
        m.needsUpdate = true;
      });
    } else {
      mat.clippingPlanes = null;
      mat.clipIntersection = false;
      mat.needsUpdate = true;
    }
  }

  /**
   * Authoritative door angle setter (degrees).
   * Range: [0.0, 120.0].
   * Clamps angle and directly updates Euler rotation around the vertical hinge axis.
   * Rotation sign: +angleRad (counter-clockwise viewed from top) swings the free edge outward and to the left!
   * @param {number} angleDeg
   */
  setDoorAngle(angleDeg) {
    const clampedDeg = Math.max(0.0, Math.min(this.config.maxOpeningAngleDeg, angleDeg));
    this.currentAngleDeg = clampedDeg;
    this.targetAngleDeg = clampedDeg;
    this.isAnimating = false;

    // Direct assignment prevents cumulative rotation errors
    const rad = THREE.MathUtils.degToRad(clampedDeg);
    this.pivotGroup.rotation.y = rad;

    this.notifyListeners();
  }

  /**
   * Initiates smooth opening animation toward targetAngleDeg.
   * Safe to call while already animating (interruptible).
   * @param {number} [targetAngleDeg=120.0]
   * @param {number} [duration=0.8]
   */
  openDoor(targetAngleDeg = 120.0, duration = 0.8) {
    const target = Math.max(0.0, Math.min(this.config.maxOpeningAngleDeg, targetAngleDeg));
    this.startAngleDeg = this.currentAngleDeg;
    this.targetAngleDeg = target;
    this.animDuration = Math.max(0.1, duration);
    this.animTime = 0.0;
    this.isAnimating = true;
  }

  /**
   * Initiates smooth closing animation to exact 0.0 degrees flush pose.
   * Safe to call while already animating (interruptible).
   * @param {number} [duration=0.8]
   */
  closeDoor(duration = 0.8) {
    this.openDoor(0.0, duration);
  }

  /**
   * Toggles between open (120 deg) and closed (0 deg).
   * @param {number} [duration=0.8]
   */
  toggleDoor(duration = 0.8) {
    if (this.targetAngleDeg > 10.0) {
      this.closeDoor(duration);
    } else {
      this.openDoor(this.config.maxOpeningAngleDeg, duration);
    }
  }

  /**
   * Resets door instantly to exact 0.0 degrees closed pose.
   * Cancels in-progress animations.
   */
  reset() {
    this.isAnimating = false;
    this.currentAngleDeg = 0.0;
    this.targetAngleDeg = 0.0;
    this.startAngleDeg = 0.0;
    this.animTime = 0.0;
    this.pivotGroup.rotation.y = 0.0;
    this.notifyListeners();
  }

  /**
   * Per-frame update called from the animation loop.
   * Uses smooth cubic ease-out interpolation.
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (!this.isAnimating) return;

    this.animTime += deltaTime;
    const progress = Math.min(1.0, this.animTime / this.animDuration);

    // Cubic ease-out: 1 - (1 - t)^3
    const eased = 1.0 - Math.pow(1.0 - progress, 3);
    const newAngle = THREE.MathUtils.lerp(this.startAngleDeg, this.targetAngleDeg, eased);

    this.currentAngleDeg = newAngle;
    const rad = THREE.MathUtils.degToRad(newAngle);
    this.pivotGroup.rotation.y = rad;

    if (progress >= 1.0) {
      this.currentAngleDeg = this.targetAngleDeg;
      this.pivotGroup.rotation.y = THREE.MathUtils.degToRad(this.targetAngleDeg);
      this.isAnimating = false;
    }

    this.notifyListeners();
  }

  /**
   * Enables or disables virtual door assembly visibility.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this.group.visible = visible;
    if (visible) {
      this.setupHousingAperture();
    } else {
      this.removeHousingAperture();
    }
  }

  /**
   * Registers a state change listener callback.
   * @param {Function} callback
   */
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners() {
    const state = {
      angleDeg: this.currentAngleDeg,
      targetAngleDeg: this.targetAngleDeg,
      isOpen: this.currentAngleDeg > 5.0,
      isFullyOpen: Math.abs(this.currentAngleDeg - this.config.maxOpeningAngleDeg) < 0.5,
      isClosed: this.currentAngleDeg < 0.5,
      isAnimating: this.isAnimating
    };
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[VirtualDoorAssembly] Listener error:', err);
      }
    }
  }

  /**
   * Teardown and clean disposal.
   */
  dispose() {
    this.removeHousingAperture();
    this.scene.remove(this.group);
  }
}

