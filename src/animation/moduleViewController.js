import * as THREE from 'three';
import { GOMIKIN_MODULES, getModuleById } from '../components/moduleRegistry.js';

/**
 * ModuleViewController
 * Handles functional module isolation, camera framing, ghosting of external components,
 * and per-module exploded dissection.
 */
export class ModuleViewController {
  /**
   * @param {ComponentRegistry} registry
   * @param {THREE.PerspectiveCamera} camera
   * @param {OrbitControls} controls
   */
  constructor(registry, camera, controls) {
    this.registry = registry;
    this.camera = camera;
    this.controls = controls;

    this.activeModuleId = 'all'; // 'all' or one of GOMIKIN_MODULES ids
    this.isModuleDissected = false;
    this.ghostMode = 'hidden'; // 'hidden' | 'ghost'

    // Original material cache for non-destructive restoration
    this.originalMaterials = new Map();
    this.ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a5568,
      transparent: true,
      opacity: 0.12,
      roughness: 0.7,
      metalness: 0.1,
      depthWrite: false
    });

    // Cache initial assembled positions of all meshes
    this.initialPositions = new Map();
    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        this.initialPositions.set(name, mesh.position.clone());
        this.cacheMaterial(mesh);
      }
    }

    // Camera animation state
    this.isCameraAnimating = false;
    this.cameraStartPos = new THREE.Vector3();
    this.cameraTargetPos = new THREE.Vector3();
    this.controlStartTarget = new THREE.Vector3();
    this.controlEndTarget = new THREE.Vector3();
    this.cameraAnimProgress = 1.0;
    this.cameraAnimDuration = 1.2;

    // Sub-assembly dissection animation state
    this.dissectProgress = 0.0;
    this.targetDissectProgress = 0.0;

    // Listeners
    this.listeners = [];
  }

  cacheMaterial(mesh) {
    if (mesh && !this.originalMaterials.has(mesh)) {
      this.originalMaterials.set(mesh, mesh.material);
    }
  }

  /**
   * Selects a functional module or 'all'.
   * @param {string} moduleId
   * @param {boolean} [animateCamera=true]
   */
  selectModule(moduleId, animateCamera = true) {
    if (!moduleId) moduleId = 'all';

    // If currently dissected, reassemble first
    if (this.isModuleDissected) {
      this.setModuleDissected(false, false);
    }

    this.activeModuleId = moduleId;

    if (moduleId === 'all') {
      this.restoreAllComponents();
      if (animateCamera) {
        this.animateCameraTo(
          new THREE.Vector3(0.95, 1.15, 1.55),
          new THREE.Vector3(0, 0.51, 0)
        );
      }
    } else {
      const moduleDef = getModuleById(moduleId);
      if (!moduleDef) return;

      this.isolateModuleComponents(moduleDef);

      if (animateCamera && moduleDef.camera) {
        this.animateCameraTo(
          new THREE.Vector3(...moduleDef.camera.position),
          new THREE.Vector3(...moduleDef.camera.target)
        );
      }
    }

    this.notifyListeners();
  }

  /**
   * Isolates the components of a module while hiding or ghosting the rest.
   * @param {Object} moduleDef
   */
  isolateModuleComponents(moduleDef) {
    const moduleCompSet = new Set(moduleDef.components);

    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (!mesh) continue;

      if (moduleCompSet.has(name)) {
        // Active component
        mesh.visible = true;
        const origMat = this.originalMaterials.get(mesh);
        if (origMat) mesh.material = origMat;
      } else {
        // Non-module component
        if (this.ghostMode === 'ghost') {
          // In ghost mode, display shell and chassis as translucent backdrop
          mesh.visible = true;
          mesh.material = this.ghostMaterial;
        } else {
          // In hidden mode, hide all other parts completely
          mesh.visible = false;
        }
      }
    }
  }

  /**
   * Restores all components to fully visible with their original materials.
   */
  restoreAllComponents() {
    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (!mesh) continue;

      mesh.visible = true;
      const origMat = this.originalMaterials.get(mesh);
      if (origMat) mesh.material = origMat;

      const initPos = this.initialPositions.get(name);
      if (initPos) mesh.position.copy(initPos);
    }
  }

  /**
   * Toggles ghost mode ('ghost' | 'hidden')
   */
  toggleGhostMode() {
    this.ghostMode = this.ghostMode === 'hidden' ? 'ghost' : 'hidden';
    if (this.activeModuleId !== 'all') {
      const mod = getModuleById(this.activeModuleId);
      if (mod) this.isolateModuleComponents(mod);
    }
    this.notifyListeners();
  }

  /**
   * Explodes or reassembles the active module.
   * @param {boolean} explode
   * @param {boolean} [animate=true]
   */
  setModuleDissected(explode, animate = true) {
    this.isModuleDissected = Boolean(explode);
    this.targetDissectProgress = this.isModuleDissected ? 1.0 : 0.0;
    if (!animate) {
      this.dissectProgress = this.targetDissectProgress;
      this.applyModuleDissectProgress(this.dissectProgress);
    }
    this.notifyListeners();
  }

  toggleModuleDissection() {
    this.setModuleDissected(!this.isModuleDissected, true);
  }

  applyModuleDissectProgress(p) {
    if (this.activeModuleId === 'all') return;
    const mod = getModuleById(this.activeModuleId);
    if (!mod || !mod.explodedOffsets) return;

    for (const compName of mod.components) {
      const mesh = this.registry.get(compName);
      const initPos = this.initialPositions.get(compName);
      const offset = mod.explodedOffsets[compName];
      if (!mesh || !initPos) continue;

      if (offset) {
        // Convert world offset [X, Y, Z] (meters) to local USDZ coordinates (millimeters with rotated axes):
        // Local X = World X * 1000
        // Local Y = -World Z * 1000
        // Local Z = World Y * 1000
        const localDx = offset[0] * 1000;
        const localDy = -offset[2] * 1000;
        const localDz = offset[1] * 1000;

        mesh.position.x = initPos.x + localDx * p;
        mesh.position.y = initPos.y + localDy * p;
        mesh.position.z = initPos.z + localDz * p;
      }
    }
  }

  animateCameraTo(targetCamPos, targetControlsTarget) {
    this.cameraStartPos.copy(this.camera.position);
    this.cameraTargetPos.copy(targetCamPos);
    this.controlStartTarget.copy(this.controls.target);
    this.controlEndTarget.copy(targetControlsTarget);
    this.cameraAnimProgress = 0.0;
    this.isCameraAnimating = true;
  }

  update(deltaTime) {
    // 1. Camera interpolation
    if (this.isCameraAnimating) {
      this.cameraAnimProgress += deltaTime / this.cameraAnimDuration;
      if (this.cameraAnimProgress >= 1.0) {
        this.cameraAnimProgress = 1.0;
        this.isCameraAnimating = false;
        this.camera.position.copy(this.cameraTargetPos);
        this.controls.target.copy(this.controlEndTarget);
      } else {
        // Smooth cubic ease out
        const t = 1 - Math.pow(1 - this.cameraAnimProgress, 3);
        this.camera.position.lerpVectors(this.cameraStartPos, this.cameraTargetPos, t);
        this.controls.target.lerpVectors(this.controlStartTarget, this.controlEndTarget, t);
      }
      this.controls.update();
    }

    // 2. Dissection progress interpolation
    if (Math.abs(this.dissectProgress - this.targetDissectProgress) > 0.001) {
      const speed = 2.5; // ~0.4s transition
      if (this.dissectProgress < this.targetDissectProgress) {
        this.dissectProgress = Math.min(this.targetDissectProgress, this.dissectProgress + deltaTime * speed);
      } else {
        this.dissectProgress = Math.max(this.targetDissectProgress, this.dissectProgress - deltaTime * speed);
      }
      this.applyModuleDissectProgress(this.dissectProgress);
      this.notifyListeners();
    }
  }

  subscribe(callback) {
    if (typeof callback === 'function') this.listeners.push(callback);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb({
          activeModuleId: this.activeModuleId,
          isModuleDissected: this.isModuleDissected,
          ghostMode: this.ghostMode,
          dissectProgress: this.dissectProgress
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
}
