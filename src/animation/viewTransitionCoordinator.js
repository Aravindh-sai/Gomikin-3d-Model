import * as THREE from 'three';
import { getModuleById } from '../components/moduleRegistry.js';

export const VIEWS = Object.freeze({
  FULL: 'full',
  MODULES: 'modules',
  DISSECTION: 'dissection',
  FLOW: 'flow'
});

/**
 * ViewTransitionCoordinator
 * Authoritative coordinator for high-level view transitions, camera interpolation,
 * animation ownership, and clean interruption/reset lifecycles across Gomikin 3D models.
 */
export class ViewTransitionCoordinator {
  /**
   * @param {Object} params
   * @param {ComponentRegistry} params.componentRegistry
   * @param {THREE.PerspectiveCamera} params.camera
   * @param {OrbitControls} params.controls
   * @param {ModuleViewController} params.moduleViewController
   * @param {DissectionAnimationController} params.dissectionController
   * @param {PhysicalFlowController} params.physicalFlowController
   */
  constructor({
    componentRegistry,
    camera,
    controls,
    moduleViewController,
    dissectionController,
    physicalFlowController
  }) {
    this.registry = componentRegistry;
    this.camera = camera;
    this.controls = controls;
    this.moduleViewController = moduleViewController;
    this.dissectionController = dissectionController;
    this.physicalFlowController = physicalFlowController;

    this.activeView = VIEWS.FULL;
    this.listeners = [];

    // Canonical camera framing presets (strictly preserved from engineering baseline)
    this.cameraPresets = {
      FULL: {
        position: new THREE.Vector3(0.95, 1.15, 1.55),
        target: new THREE.Vector3(0, 0.51, 0)
      },
      FLOW: {
        position: new THREE.Vector3(-0.75, 1.05, 0.95),
        target: new THREE.Vector3(-0.06, 0.55, 0)
      }
    };

    // Central camera interpolation state
    this.cameraTransition = {
      active: false,
      startPos: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      startTarget: new THREE.Vector3(),
      targetTarget: new THREE.Vector3(),
      progress: 1.0,
      duration: 0.9,
      onComplete: null
    };
  }

  /**
   * Glides camera smoothly to destination target without drifting or fighting controls.
   * @param {THREE.Vector3} targetCamPos
   * @param {THREE.Vector3} targetControlsTarget
   * @param {number} [duration=0.9]
   * @param {Function} [onComplete=null]
   */
  glideCameraTo(targetCamPos, targetControlsTarget, duration = 0.9, onComplete = null) {
    if (!this.camera || !this.controls) return;

    this.cameraTransition.startPos.copy(this.camera.position);
    this.cameraTransition.targetPos.copy(targetCamPos);
    this.cameraTransition.startTarget.copy(this.controls.target);
    this.cameraTransition.targetTarget.copy(targetControlsTarget);
    this.cameraTransition.progress = 0.0;
    this.cameraTransition.duration = Math.max(0.1, duration);
    this.cameraTransition.onComplete = onComplete;
    this.cameraTransition.active = true;
  }

  /**
   * Cancels active camera interpolation.
   * @param {boolean} [snapToTarget=false]
   */
  stopCameraGlide(snapToTarget = false) {
    if (!this.cameraTransition.active) return;

    if (snapToTarget && this.camera && this.controls) {
      this.camera.position.copy(this.cameraTransition.targetPos);
      this.controls.target.copy(this.cameraTransition.targetTarget);
      this.controls.update();
    }
    this.cameraTransition.active = false;
    this.cameraTransition.onComplete = null;
  }

  /**
   * Authoritatively switches to target view with safe interruption and clean state transfer.
   * @param {string} targetView 'full' | 'modules' | 'dissection' | 'flow'
   * @param {Object} [options={}]
   */
  switchView(targetView, options = {}) {
    if (!VIEWS[targetView.toUpperCase()]) {
      console.warn(`[ViewTransitionCoordinator] Unknown view: "${targetView}".`);
      return;
    }

    const previousView = this.activeView;

    // --- STEP 1: Safe View Teardown & Ownership Yield ---
    this.stopCameraGlide(false);

    // Stop module view controller camera if it was animating
    if (this.moduleViewController) {
      this.moduleViewController.isCameraAnimating = false;
    }

    if (previousView === VIEWS.DISSECTION) {
      if (this.dissectionController) {
        if (this.dissectionController.detailController) {
          this.dissectionController.detailController.exitDetailView(true);
          this.dissectionController.detailController.setEnabled(false);
        }
        this.dissectionController.pause();
        this.dissectionController.reset(true, false);
      }
    } else if (previousView === VIEWS.FLOW) {
      if (this.physicalFlowController) {
        this.physicalFlowController.pause();
        this.physicalFlowController.reset();
      }
    } else if (previousView === VIEWS.MODULES) {
      if (this.moduleViewController) {
        if (this.moduleViewController.isModuleDissected) {
          this.moduleViewController.setModuleDissected(false, false);
        }
      }
    }

    // --- STEP 2: Restore Universal Model Baseline Transforms & Materials ---
    if (this.registry) {
      this.registry.restoreBaselineTransforms();
    }
    if (this.moduleViewController) {
      this.moduleViewController.restoreAllComponents();
    }

    // Re-enable controls if they were locked
    if (this.controls) {
      this.controls.enabled = true;
    }

    // Hide dissection HTML labels and pod headers
    const labelOverlay = document.getElementById('gomikin-catalogue-labels');
    if (labelOverlay) {
      labelOverlay.style.display = 'none';
    }

    // --- STEP 3: Setup New View State ---
    this.activeView = targetView;

    if (targetView === VIEWS.FULL) {
      if (this.moduleViewController) {
        this.moduleViewController.activeModuleId = 'all';
      }
      this.glideCameraTo(
        this.cameraPresets.FULL.position,
        this.cameraPresets.FULL.target,
        0.9
      );
    } else if (targetView === VIEWS.MODULES) {
      const targetModId = options.moduleId ||
        (this.moduleViewController && this.moduleViewController.activeModuleId !== 'all'
          ? this.moduleViewController.activeModuleId
          : 'input');

      if (this.moduleViewController) {
        this.moduleViewController.selectModule(targetModId, false);
      }

      const modDef = getModuleById(targetModId);
      if (modDef && modDef.camera) {
        this.glideCameraTo(
          new THREE.Vector3(...modDef.camera.position),
          new THREE.Vector3(...modDef.camera.target),
          0.9
        );
      }
    } else if (targetView === VIEWS.DISSECTION) {
      if (this.moduleViewController) {
        this.moduleViewController.activeModuleId = 'all';
      }
      if (this.dissectionController) {
        this.dissectionController.play(1.0);
      }
    } else if (targetView === VIEWS.FLOW) {
      if (this.moduleViewController) {
        this.moduleViewController.activeModuleId = 'all';
        // Ghost outer housing for internal flow visibility
        const housing = this.registry.get('Main_Housing');
        if (housing && this.moduleViewController.ghostMaterial) {
          housing.material = this.moduleViewController.ghostMaterial;
        }
      }

      const flowMode = options.flowMode ||
        (this.physicalFlowController ? this.physicalFlowController.activeMode : 'ORGANIC');

      if (this.physicalFlowController) {
        if (flowMode !== this.physicalFlowController.activeMode) {
          this.physicalFlowController.setMode(flowMode);
        }
        this.physicalFlowController.play();
      }

      this.glideCameraTo(
        this.cameraPresets.FLOW.position,
        this.cameraPresets.FLOW.target,
        0.9
      );
    }

    this.notifyListeners({
      previousView,
      activeView: this.activeView,
      options
    });
  }

  /**
   * Animation tick called once per frame from Three.js render loop.
   * Authoritatively coordinates camera glide and gates controller updates.
   * @param {number} deltaTime
   */
  update(deltaTime) {
    // 1. Central Camera Glide Interpolation
    if (this.cameraTransition.active && this.camera && this.controls) {
      this.cameraTransition.progress += deltaTime / this.cameraTransition.duration;

      if (this.cameraTransition.progress >= 1.0) {
        this.cameraTransition.progress = 1.0;
        this.cameraTransition.active = false;
        this.camera.position.copy(this.cameraTransition.targetPos);
        this.controls.target.copy(this.cameraTransition.targetTarget);
        this.controls.update();
        if (typeof this.cameraTransition.onComplete === 'function') {
          this.cameraTransition.onComplete();
        }
      } else {
        // Smooth cubic ease out
        const t = 1 - Math.pow(1 - this.cameraTransition.progress, 3);
        this.camera.position.lerpVectors(
          this.cameraTransition.startPos,
          this.cameraTransition.targetPos,
          t
        );
        this.controls.target.lerpVectors(
          this.cameraTransition.startTarget,
          this.cameraTransition.targetTarget,
          t
        );
        this.controls.update();
      }
    }

    // 2. Authoritative Active Controller Update (Gate inactive views)
    if (this.activeView === VIEWS.DISSECTION) {
      if (this.dissectionController) {
        this.dissectionController.update(deltaTime);
      }
    } else if (this.activeView === VIEWS.MODULES) {
      if (this.moduleViewController) {
        this.moduleViewController.update(deltaTime);
      }
    } else if (this.activeView === VIEWS.FLOW) {
      if (this.physicalFlowController) {
        this.physicalFlowController.update(deltaTime);
      }
    }
  }

  /**
   * Subscribes to view transition events.
   * @param {Function} callback
   */
  subscribe(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  /**
   * Unsubscribes from view transition events.
   * @param {Function} callback
   */
  unsubscribe(callback) {
    const idx = this.listeners.indexOf(callback);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  notifyListeners(data) {
    for (const cb of this.listeners) {
      try {
        cb(data);
      } catch (err) {
        console.error('[ViewTransitionCoordinator] Listener error:', err);
      }
    }
  }
}
