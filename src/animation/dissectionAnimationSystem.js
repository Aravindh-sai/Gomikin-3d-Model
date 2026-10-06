import * as THREE from 'three';
import { buildDissectionChoreography, COMPONENT_DISPLAY_NAMES } from './dissectionChoreography.js';
import { ComponentDetailController } from './componentDetailController.js';

/**
 * Standard Animation State Constants
 */
export const ANIMATION_STATES = Object.freeze({
  ASSEMBLED: 'ASSEMBLED',
  DISSECTION: 'DISSECTION',
  EXPLODED: 'EXPLODED',
  RESETTING: 'RESETTING'
});

/**
 * DissectionAnimationController manages:
 * - Runtime component position and rotation choreography
 * - Camera pull-back and catalogue framing
 * - 3D HTML labels projection and opacity
 * - Component Detail Mode (isolated single-part inspection & CAD controls)
 * - Full bidirectional state machine (ASSEMBLED, DISSECTION, EXPLODED, RESETTING)
 * - Complete reversibility to original Fusion assembly
 */
export class DissectionAnimationController {
  /**
   * @param {ComponentRegistry} componentRegistry Sole source for accessing model components
   * @param {THREE.PerspectiveCamera} [camera] Scene camera for choreography and label projection
   * @param {OrbitControls} [controls] Orbit controls
   */
  constructor(componentRegistry, camera = null, controls = null) {
    if (!componentRegistry) {
      throw new Error('DissectionAnimationController requires a valid ComponentRegistry instance.');
    }
    this.registry = componentRegistry;
    this.camera = camera || window.camera;
    this.controls = controls || window.controls;

    // Build the choreography engine with exact coordinate solvers
    this.choreography = buildDissectionChoreography(this.registry);

    // Component Detail View Controller (Click-to-inspect, NO hover)
    this.detailController = new ComponentDetailController(
      this.registry,
      this.choreography,
      this.camera,
      this.controls
    );

    // Baseline transforms cache (strictly preserved for perfect restoration)
    this.componentBaselines = new Map();
    this.initComponentBaselines();

    // Camera initial & catalogue targets
    this.cameraAssembled = {
      position: this.choreography.cameraAssembled.position.clone(),
      target: this.choreography.cameraAssembled.target.clone()
    };
    this.cameraCatalogue = {
      position: this.choreography.cameraCatalogue.position.clone(),
      target: this.choreography.cameraCatalogue.target.clone()
    };

    // State Machine
    this._state = ANIMATION_STATES.ASSEMBLED;
    this._progress = 0.0;
    this._targetProgress = 0.0;
    this.isPlaying = false;
    this.playbackSpeed = 1.0;
    this.playbackDirection = 1; // 1 = forward, -1 = reverse
    this.duration = 8.5; // ~8.5 seconds for deliberate cinematic 3-phase timing

    // HTML Label Overlay System
    this.labelOverlay = null;
    this.labelElements = new Map();
    this.initLabelOverlay();

    // Primary UI Button
    this.primaryButton = null;

    // Listeners
    this.listeners = [];
  }

  /**
   * Caches exact original assembled transforms for all 33 components.
   */
  initComponentBaselines() {
    const entries = this.registry.getEntries();
    for (const entry of entries) {
      this.componentBaselines.set(entry.name, {
        name: entry.name,
        mesh: entry.mesh,
        initialPosition: entry.initialPosition.clone(),
        initialRotation: entry.initialRotation.clone(),
        initialScale: entry.initialScale.clone(),
        currentOffset: new THREE.Vector3(0, 0, 0),
        currentRotationChange: new THREE.Euler(0, 0, 0)
      });
    }
  }

  /**
   * Initializes the DOM HTML label container and 33 readable component labels.
   */
  initLabelOverlay() {
    if (typeof document === 'undefined') return;

    let container = document.getElementById('gomikin-catalogue-labels');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gomikin-catalogue-labels';
      Object.assign(container.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: '900',
        display: 'none'
      });
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    this.labelOverlay = container;

    // Inject label styles if not present
    if (!document.getElementById('gomikin-label-styles')) {
      const style = document.createElement('style');
      style.id = 'gomikin-label-styles';
      style.textContent = `
        .gomikin-catalogue-badge {
          position: absolute;
          transform: translate(-50%, 0);
          background: rgba(10, 15, 24, 0.90);
          border: 1px solid rgba(0, 255, 204, 0.38);
          border-radius: 6px;
          padding: 3px 8px;
          color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.2;
          letter-spacing: 0.2px;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.8), inset 0 0 8px rgba(0, 255, 204, 0.05);
          backdrop-filter: blur(8px);
          opacity: 0;
          transition: opacity 0.25s ease-out;
          pointer-events: auto;
          cursor: pointer;
          user-select: none;
          text-align: center;
        }
        .gomikin-catalogue-badge .badge-tag {
          display: inline-block;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #00ffcc;
          font-weight: 700;
          margin-right: 5px;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(0, 255, 204, 0.12);
        }
        .gomikin-catalogue-badge .badge-title {
          display: inline-block;
          font-weight: 600;
          color: #ffffff;
        }
      `;
      document.head.appendChild(style);
    }

    // Create a label badge for each component
    for (const [name, comp] of this.choreography.componentData.entries()) {
      const badge = document.createElement('div');
      badge.className = 'gomikin-catalogue-badge';
      badge.id = `badge-${name}`;
      badge.innerHTML = `
        <span class="badge-tag">${comp.categoryTag || 'PART'}</span>
        <span class="badge-title">${comp.displayName}</span>
      `;
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.detailController && this._progress >= 0.98) {
          this.detailController.enterDetailView(name);
        }
      });
      container.appendChild(badge);
      this.labelElements.set(name, badge);
    }
  }

  /**
   * Projects 3D catalogue label anchor points to 2D screen pixels.
   */
  updateLabelPositions() {
    if (!this.labelOverlay || !this.camera) return;

    // In Detail View, catalogue labels are completely hidden
    if (this.detailController && this.detailController.mode === 'DETAIL') {
      this.labelOverlay.style.display = 'none';
      return;
    }

    // Only show labels when settling into catalogue (p >= 0.82)
    if (this._progress < 0.82) {
      this.labelOverlay.style.display = 'none';
      return;
    }

    this.labelOverlay.style.display = 'block';
    const baseOpacity = Math.max(0, Math.min(1, (this._progress - 0.82) / 0.16));

    const width = window.innerWidth;
    const height = window.innerHeight;
    const tempVec = new THREE.Vector3();

    for (const [name, badge] of this.labelElements.entries()) {
      const comp = this.choreography.componentData.get(name);
      if (!comp) continue;

      const bottomOffset = 0.38;
      tempVec.set(
        comp.targetWorldCenter.x,
        comp.targetWorldCenter.y - bottomOffset,
        comp.targetWorldCenter.z
      );

      badge.style.opacity = baseOpacity.toFixed(3);

      // Project to Normalized Device Coordinates (-1 to +1)
      tempVec.project(this.camera);

      // Behind camera check
      if (tempVec.z > 1.0) {
        badge.style.opacity = '0';
        continue;
      }

      const screenX = (tempVec.x * 0.5 + 0.5) * width;
      const screenY = (-tempVec.y * 0.5 + 0.5) * height;

      badge.style.transform = `translate(-50%, 0) translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
    }
  }

  /**
   * Updates camera framing smoothly across 3 cinematic phases:
   * Phase 1 (0.0 -> 0.45): Dynamic close-up framing of mechanical disassembly
   * Phase 2 (0.45 -> 0.55): Dramatic pause / showcase hold in 3D space
   * Phase 3 (0.55 -> 1.00): Wide glide to orthographic-style flat catalogue view
   * @param {number} progress
   */
  updateCameraFraming(progress) {
    if (!this.camera || !this.controls) return;

    // Dynamically fit catalogue camera to aspect ratio
    const aspect = (typeof window !== 'undefined' && window.innerHeight > 0) ? (window.innerWidth / window.innerHeight) : 16 / 9;
    const fittedCatalogueCam = this.choreography.calculateCatalogueCamera(aspect);
    this.cameraCatalogue.position.copy(fittedCatalogueCam.position);
    this.cameraCatalogue.target.copy(fittedCatalogueCam.target);

    const p = Math.max(0, Math.min(1, progress));
    const camExplodedPos = new THREE.Vector3(1.25, 1.10, 2.30);
    const camExplodedTarget = new THREE.Vector3(0.0, 0.45, 0.0);
    const camHoldPos = new THREE.Vector3(1.15, 1.00, 2.45);

    if (p <= 0.45) {
      const t = this.choreography.easeInOutCubic(p / 0.45);
      this.camera.position.lerpVectors(this.cameraAssembled.position, camExplodedPos, t);
      this.controls.target.lerpVectors(this.cameraAssembled.target, camExplodedTarget, t);
    } else if (p <= 0.55) {
      const t = (p - 0.45) / 0.10;
      this.camera.position.lerpVectors(camExplodedPos, camHoldPos, t);
      this.controls.target.copy(camExplodedTarget);
    } else {
      const t = this.choreography.easeInOutCubic((p - 0.55) / 0.45);
      this.camera.position.lerpVectors(camHoldPos, this.cameraCatalogue.position, t);
      this.controls.target.lerpVectors(camExplodedTarget, this.cameraCatalogue.target, t);
    }

    this.controls.update();
  }

  /**
   * Evaluates the animation and applies transforms at normalized progress.
   * @param {number} progress Normalized progress [0.0, 1.0]
   */
  applyProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));

    if (p <= 0.0) {
      if (this.detailController) {
        this.detailController.exitDetailView(true);
        this.detailController.setEnabled(false);
      }
      this.restoreAssembly();
      if (this.labelOverlay) this.labelOverlay.style.display = 'none';
      return;
    }

    if (p >= 0.999 && !this.isPlaying) {
      if (this.detailController) this.detailController.setEnabled(true);
    } else {
      if (this.detailController) {
        this.detailController.setEnabled(false);
        if (p < 0.95) this.detailController.exitDetailView(true);
      }
    }

    const outputMap = this.choreography.evaluateAtProgress(p);

    for (const [name, baseline] of this.componentBaselines.entries()) {
      const motion = outputMap.get(name);
      if (motion) {
        baseline.mesh.position.set(
          baseline.initialPosition.x + motion.positionOffset.x,
          baseline.initialPosition.y + motion.positionOffset.y,
          baseline.initialPosition.z + motion.positionOffset.z
        );
        baseline.mesh.rotation.set(
          baseline.initialRotation.x + motion.rotationChange.x,
          baseline.initialRotation.y + motion.rotationChange.y,
          baseline.initialRotation.z + motion.rotationChange.z
        );
        if (motion.scale) {
          baseline.mesh.scale.copy(motion.scale);
        }
        baseline.currentOffset.copy(motion.positionOffset);
        baseline.currentRotationChange.copy(motion.rotationChange);
      } else {
        baseline.mesh.position.copy(baseline.initialPosition);
        baseline.mesh.rotation.copy(baseline.initialRotation);
        baseline.mesh.scale.copy(baseline.initialScale);
        baseline.currentOffset.set(0, 0, 0);
        baseline.currentRotationChange.set(0, 0, 0);
      }
    }

    // Update camera and labels
    this.updateCameraFraming(p);
    this.updateLabelPositions();
  }

  /**
   * Restores all 33 components to exact initial assembled transforms.
   */
  restoreAssembly() {
    if (this.detailController) {
      this.detailController.exitDetailView(true);
      this.detailController.setEnabled(false);
    }

    for (const baseline of this.componentBaselines.values()) {
      baseline.mesh.visible = true;
      baseline.mesh.position.copy(baseline.initialPosition);
      baseline.mesh.rotation.copy(baseline.initialRotation);
      baseline.mesh.scale.copy(baseline.initialScale);
      baseline.currentOffset.set(0, 0, 0);
      baseline.currentRotationChange.set(0, 0, 0);
    }

    if (this.labelOverlay) {
      this.labelOverlay.style.display = 'none';
      for (const badge of this.labelElements.values()) {
        badge.style.opacity = '0';
      }
    }

    // Restore assembled camera framing
    if (this.camera && this.controls) {
      this.camera.position.copy(this.cameraAssembled.position);
      this.controls.target.copy(this.cameraAssembled.target);
      this.controls.enabled = true;
      this.controls.update();
    }
  }

  /**
   * Starts playback forward toward EXPLODED state (or reverse if speed < 0).
   * @param {number} [speed=1.0]
   */
  play(speed = 1.0) {
    this.playbackSpeed = Math.abs(speed);
    this.playbackDirection = speed >= 0 ? 1 : -1;

    if (this.playbackDirection === 1 && this._progress >= 1.0) {
      this._progress = 0.0;
    } else if (this.playbackDirection === -1 && this._progress <= 0.0) {
      this._progress = 1.0;
    }

    this.isPlaying = true;
    this._state = this.playbackDirection === -1 ? ANIMATION_STATES.RESETTING : ANIMATION_STATES.DISSECTION;
    this.updateButtonState();
    this.notifyListeners();
  }

  /**
   * Pauses the animation.
   */
  pause() {
    this.isPlaying = false;
    this.updateButtonState();
    this.notifyListeners();
  }

  /**
   * Resets the animation to the original ASSEMBLED state.
   * @param {boolean} [instant=false] Smooth animated reset by default, or immediate if true
   */
  reset(instant = false) {
    if (this.detailController) {
      this.detailController.exitDetailView(true);
      this.detailController.setEnabled(false);
    }

    if (instant) {
      this.isPlaying = false;
      this._progress = 0.0;
      this._targetProgress = 0.0;
      this.restoreAssembly();
      this._state = ANIMATION_STATES.ASSEMBLED;
      this.updateButtonState();
      this.notifyListeners();
    } else {
      this._targetProgress = 0.0;
      this.playbackDirection = -1;
      this.isPlaying = true;
      this._state = ANIMATION_STATES.RESETTING;
      this.updateButtonState();
      this.notifyListeners();
    }
  }

  /**
   * Gets or sets the timeline progress [0.0 - 1.0].
   * @param {number} [value]
   * @returns {number}
   */
  progress(value) {
    if (value !== undefined && typeof value === 'number') {
      const clamped = Math.max(0, Math.min(1, value));
      this._progress = clamped;
      this._targetProgress = clamped;
      this.applyProgress(this._progress);

      if (this._progress <= 0.0001) {
        this._state = ANIMATION_STATES.ASSEMBLED;
        if (this.detailController) {
          this.detailController.exitDetailView(true);
          this.detailController.setEnabled(false);
        }
      } else if (this._progress >= 0.9999) {
        this._state = ANIMATION_STATES.EXPLODED;
        if (this.detailController) {
          this.detailController.setEnabled(true);
        }
      } else {
        if (this._state !== ANIMATION_STATES.RESETTING) {
          this._state = ANIMATION_STATES.DISSECTION;
        }
        if (this.detailController) {
          this.detailController.exitDetailView(true);
          this.detailController.setEnabled(false);
        }
      }

      this.updateButtonState();
      this.notifyListeners();
      return this._progress;
    }
    return this._progress;
  }

  /**
   * Returns current animation state string.
   * @returns {string}
   */
  state() {
    return this._state;
  }

  /**
   * Update method called each frame in Three.js render loop.
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (this.detailController) {
      this.detailController.update(deltaTime);
    }

    if (this.isPlaying) {
      // Clamp deltaTime to max 100ms (0.1s) to prevent frame-spike skips while maintaining accurate 1:1 real-time tracking
      const safeDelta = Math.min(Math.max(0, deltaTime), 0.10);
      const deltaProgress = (safeDelta / this.duration) * this.playbackSpeed * this.playbackDirection;
      this._progress += deltaProgress;

      if (this.playbackDirection === 1 && this._progress >= 1.0) {
        this._progress = 1.0;
        this.isPlaying = false;
        this._state = ANIMATION_STATES.EXPLODED;
        this.applyProgress(1.0);
        if (this.detailController) {
          this.detailController.setEnabled(true);
        }
        this.updateButtonState();
        this.notifyListeners();
        return;
      }

      if (this.playbackDirection === -1 && this._progress <= 0.0) {
        this._progress = 0.0;
        this.isPlaying = false;
        this.restoreAssembly();
        this._state = ANIMATION_STATES.ASSEMBLED;
        this.updateButtonState();
        this.notifyListeners();
        return;
      }

      this.applyProgress(this._progress);
      this.updateButtonState();
      this.notifyListeners();
    } else {
      // In catalogue view, keep labels pinned to components
      if (this._progress >= 0.82) {
        this.updateLabelPositions();
      }
    }
  }

  /**
   * Updates primary UI button text and styling according to current state.
   */
  updateButtonState() {
    if (!this.primaryButton) return;

    if (this._state === ANIMATION_STATES.ASSEMBLED) {
      this.primaryButton.innerHTML = `
        <span class="btn-icon">⚡</span>
        <span class="btn-text">DISSECT GOMIKIN</span>
      `;
      this.primaryButton.className = 'btn-dissect-primary state-assembled';
      this.primaryButton.title = 'Click to smoothly disassemble Gomikin into an organized 3D component catalogue';
    } else if (this._state === ANIMATION_STATES.DISSECTION) {
      this.primaryButton.innerHTML = `
        <span class="btn-icon btn-spin">⚙</span>
        <span class="btn-text">DISSECTING (${Math.round(this._progress * 100)}%)</span>
      `;
      this.primaryButton.className = 'btn-dissect-primary state-dissecting';
      this.primaryButton.title = 'Dissection animation in progress...';
    } else if (this._state === ANIMATION_STATES.EXPLODED) {
      this.primaryButton.innerHTML = `
        <span class="btn-icon">↺</span>
        <span class="btn-text">RESET GOMIKIN</span>
      `;
      this.primaryButton.className = 'btn-dissect-primary state-exploded';
      this.primaryButton.title = 'Click to reassemble Gomikin back to its original Fusion state';
    } else if (this._state === ANIMATION_STATES.RESETTING) {
      this.primaryButton.innerHTML = `
        <span class="btn-icon btn-spin">↺</span>
        <span class="btn-text">RESETTING (${Math.round(this._progress * 100)}%)</span>
      `;
      this.primaryButton.className = 'btn-dissect-primary state-resetting';
      this.primaryButton.title = 'Restoring original assembly...';
    }
  }

  /**
   * Subscribes a listener to state and progress updates.
   * @param {Function} callback
   */
  subscribe(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
    }
  }

  /**
   * Unsubscribes a listener.
   * @param {Function} callback
   */
  unsubscribe(callback) {
    const idx = this.listeners.indexOf(callback);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb({
          state: this._state,
          progress: this._progress,
          isPlaying: this.isPlaying
        });
      } catch (err) {
        console.error('[GomikinAnimation] Listener error:', err);
      }
    }
  }

  /**
   * Diagnostic verification helper.
   * @returns {Object}
   */
  verifyController() {
    const totalComponents = this.componentBaselines.size;
    let allTransformsMatch = true;
    const mismatches = [];

    for (const [name, baseline] of this.componentBaselines.entries()) {
      const posDist = baseline.mesh.position.distanceTo(baseline.initialPosition);
      const rotDiff = Math.abs(baseline.mesh.rotation.x - baseline.initialRotation.x) +
                      Math.abs(baseline.mesh.rotation.y - baseline.initialRotation.y) +
                      Math.abs(baseline.mesh.rotation.z - baseline.initialRotation.z);

      if (posDist > 1e-5 || rotDiff > 1e-5) {
        allTransformsMatch = false;
        mismatches.push({ name, posDist, rotDiff });
      }
    }

    return {
      ready: true,
      totalComponents,
      expectedComponents: 33,
      allComponentsLoaded: totalComponents === 33,
      allTransformsMatch,
      mismatches,
      state: this._state,
      progress: this._progress,
      labelsCount: this.labelElements.size
    };
  }
}

/**
 * Creates the primary "DISSECT GOMIKIN" button and injects sleek presentation styles.
 *
 * @param {DissectionAnimationController} controller
 * @returns {HTMLButtonElement}
 */
export function createPrimaryDissectButton(controller) {
  // Remove any legacy test buttons
  const oldTestBtn = document.getElementById('btn-test-dissection');
  if (oldTestBtn) oldTestBtn.remove();

  const existing = document.getElementById('btn-dissect-gomikin');
  if (existing) existing.remove();

  // Inject primary button CSS styles
  if (!document.getElementById('gomikin-dissect-button-styles')) {
    const style = document.createElement('style');
    style.id = 'gomikin-dissect-button-styles';
    style.textContent = `
      .btn-dissect-primary {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1500;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 26px;
        background: rgba(10, 15, 24, 0.92);
        border: 1.5px solid #00ffcc;
        border-radius: 30px;
        color: #00ffcc;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        cursor: pointer;
        backdrop-filter: blur(14px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 255, 204, 0.35), inset 0 0 12px rgba(0, 255, 204, 0.15);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      .btn-dissect-primary:hover {
        background: rgba(0, 255, 204, 0.18);
        border-color: #38bdf8;
        color: #ffffff;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.85), 0 0 30px rgba(0, 255, 204, 0.6), inset 0 0 16px rgba(0, 255, 204, 0.25);
        transform: translateX(-50%) translateY(-2px) scale(1.02);
      }
      .btn-dissect-primary:active {
        transform: translateX(-50%) translateY(1px) scale(0.98);
      }
      .btn-dissect-primary.state-dissecting {
        border-color: #38bdf8;
        color: #38bdf8;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.4);
      }
      .btn-dissect-primary.state-exploded {
        border-color: #10b981;
        color: #10b981;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75), 0 0 24px rgba(16, 185, 129, 0.45);
      }
      .btn-dissect-primary.state-exploded:hover {
        background: rgba(16, 185, 129, 0.2);
        color: #ffffff;
        border-color: #34d399;
      }
      .btn-dissect-primary.state-resetting {
        border-color: #f59e0b;
        color: #f59e0b;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.75), 0 0 20px rgba(245, 158, 11, 0.4);
      }
      .btn-dissect-primary .btn-spin {
        display: inline-block;
        animation: gomikin-spin 1.5s linear infinite;
      }
      @keyframes gomikin-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  const btn = document.createElement('button');
  btn.id = 'btn-dissect-gomikin';
  btn.className = 'btn-dissect-primary state-assembled';
  btn.innerHTML = `
    <span class="btn-icon">⚡</span>
    <span class="btn-text">DISSECT GOMIKIN</span>
  `;
  btn.title = 'Click to smoothly disassemble Gomikin into an organized 3D component catalogue';

  btn.addEventListener('click', () => {
    const currentState = controller.state();
    if (currentState === ANIMATION_STATES.ASSEMBLED) {
      controller.play(1.0);
    } else if (currentState === ANIMATION_STATES.EXPLODED) {
      controller.reset(false); // smooth animated reverse reassembly
    } else if (currentState === ANIMATION_STATES.DISSECTION) {
      if (controller.isPlaying) {
        controller.pause();
      } else {
        controller.play(1.0);
      }
    } else if (currentState === ANIMATION_STATES.RESETTING) {
      if (controller.isPlaying) {
        controller.pause();
      } else {
        controller.play(-1.0);
      }
    }
  });

  document.body.appendChild(btn);
  controller.primaryButton = btn;
  controller.updateButtonState();

  return btn;
}

/**
 * Initializes the complete Gomikin Dissection Experience and exposes the developer API.
 *
 * @param {ComponentRegistry} componentRegistry
 * @param {THREE.PerspectiveCamera} [camera]
 * @param {OrbitControls} [controls]
 * @returns {Object} Public API on window.gomikinAnimation
 */
export function initDissectionAnimationSystem(componentRegistry, camera = null, controls = null) {
  const controller = new DissectionAnimationController(componentRegistry, camera, controls);

  // The developer-only control API:
  const api = {
    play: (speed) => controller.play(speed),
    pause: () => controller.pause(),
    reset: (instant = false) => controller.reset(instant),
    progress: (value) => controller.progress(value),
    state: () => controller.state(),

    // Component Detail View API
    controller,
    detailController: controller.detailController,
    enterDetail: (name) => controller.detailController.enterDetailView(name),
    exitDetail: (immediate) => controller.detailController.exitDetailView(immediate),
    focusController: controller.detailController,
    focus: (name) => controller.detailController.enterDetailView(name),
    unfocus: (immediate) => controller.detailController.exitDetailView(immediate),
    verify: () => controller.verifyController()
  };

  if (typeof window !== 'undefined') {
    window.gomikinAnimation = api;
  }

  // Create Primary "DISSECT GOMIKIN" button
  if (typeof document !== 'undefined') {
    createPrimaryDissectButton(controller);
  }

  console.log(
    '%c🚀 Gomikin 3D Interactive Dissection System ready. Click "DISSECT GOMIKIN" to start.',
    'color: #00ffcc; font-weight: bold; font-size: 13px;'
  );

  return api;
}
