import * as THREE from 'three';

/**
 * ComponentFocusController
 * 
 * Implements game-style inventory inspection for the 3D Gomikin Component Catalogue:
 * - Desktop hover & mobile tap detection via Three.js Raycaster
 * - Smooth cinematic lift, center translation, and size-normalized zoom
 * - CAD/Fusion-style inspection controls (Wheel: Zoom, MMB: Pan, Shift+MMB or drag: Orbit)
 * - Anti-flicker focus lock & smooth return to catalogue
 * - Unobtrusive CAD HUD hint
 */
export class ComponentFocusController {
  constructor(componentRegistry, choreography, camera, controls, domElement) {
    this.registry = componentRegistry;
    this.choreography = choreography;
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement || document.body;

    // Raycaster & pointer
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-1000, -1000);
    this.clientPointer = { x: -1000, y: -1000 };

    // Active target meshes for raycasting
    this.meshMap = new Map(); // mesh -> componentName
    this.raycastTargets = [];
    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        this.meshMap.set(mesh, name);
        this.raycastTargets.push(mesh);
      }
    }

    // State
    this.enabled = false;
    this.focusedName = null;
    this.hoveredName = null;
    this.focusProgress = 0.0;
    this.targetFocusProgress = 0.0;

    // CAD Inspection Offsets
    this.focusPan = new THREE.Vector2(0, 0);
    this.targetPan = new THREE.Vector2(0, 0);
    this.focusOrbit = new THREE.Vector2(0, 0);
    this.targetOrbit = new THREE.Vector2(0, 0);
    this.focusZoom = 1.0;
    this.targetZoom = 1.0;

    // Pointer drag tracking
    this.isDragging = false;
    this.dragButton = -1;
    this.dragStart = { x: 0, y: 0 };
    this.isShiftPressed = false;
    this.pointerDownOnFocused = false;

    // Target Focus Point in World Space (Centered in front of catalogue camera)
    // Camera is at (0, -0.05, 8.8). Focus at Z = 4.5 gives ideal 4.3m viewing distance.
    this.focusWorldCenter = new THREE.Vector3(0.0, 0.05, 4.5);

    // Callbacks
    this.onFocusChange = null;

    // Setup UI & Listeners
    this._createHud();
    this._bindEvents();
  }

  _createHud() {
    if (document.getElementById('gomikin-inspection-hud')) return;

    const style = document.createElement('style');
    style.id = 'gomikin-hud-styles';
    style.textContent = `
      #gomikin-inspection-hud {
        position: absolute;
        top: 22px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(10, 15, 24, 0.88);
        border: 1px solid rgba(0, 255, 204, 0.35);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(0, 255, 204, 0.08);
        backdrop-filter: blur(10px);
        border-radius: 30px;
        padding: 6px 18px;
        color: #94a3b8;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11.5px;
        letter-spacing: 0.3px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        user-select: none;
      }
      #gomikin-inspection-hud.hud-visible {
        opacity: 1;
        pointer-events: auto;
      }
      .hud-pill {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .hud-pill kbd {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 10px;
        font-family: monospace;
        color: #00ffcc;
        font-weight: 600;
      }
      .hud-divider {
        width: 1px;
        height: 14px;
        background: rgba(255, 255, 255, 0.15);
      }
      .hud-close-btn {
        background: rgba(0, 255, 204, 0.12);
        border: 1px solid rgba(0, 255, 204, 0.4);
        color: #00ffcc;
        border-radius: 12px;
        padding: 2px 10px;
        cursor: pointer;
        font-size: 10px;
        font-weight: 600;
        transition: background 0.2s;
      }
      .hud-close-btn:hover {
        background: rgba(0, 255, 204, 0.25);
      }
    `;
    document.head.appendChild(style);

    const hud = document.createElement('div');
    hud.id = 'gomikin-inspection-hud';
    hud.innerHTML = `
      <span class="hud-pill"><kbd>Scroll</kbd> Zoom</span>
      <div class="hud-divider"></div>
      <span class="hud-pill"><kbd>MMB</kbd> Pan</span>
      <div class="hud-divider"></div>
      <span class="hud-pill"><kbd>Shift+MMB</kbd> Orbit</span>
      <div class="hud-divider"></div>
      <button class="hud-close-btn" id="btn-hud-exit">✕ RETURN TO CATALOGUE</button>
    `;
    document.body.appendChild(hud);

    const closeBtn = document.getElementById('btn-hud-exit');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unfocus();
      });
    }

    this.hudElement = hud;
  }

  _bindEvents() {
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onWheel = this._handleWheel.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onContextMenu = (e) => {
      if (this.focusedName) e.preventDefault();
    };

    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (!this.enabled && this.focusedName) {
      this.unfocus(true);
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Shift') this.isShiftPressed = true;
    if (e.key === 'Escape' && this.focusedName) {
      this.unfocus();
    }
  }

  _handleKeyUp(e) {
    if (e.key === 'Shift') this.isShiftPressed = false;
  }

  _handleWheel(e) {
    if (!this.enabled || !this.focusedName) return;

    e.preventDefault();
    const zoomDelta = e.deltaY * 0.0012;
    this.targetZoom = THREE.MathUtils.clamp(this.targetZoom * (1 - zoomDelta), 0.45, 3.8);
  }

  _updatePointerCoordinates(e) {
    this.clientPointer.x = e.clientX;
    this.clientPointer.y = e.clientY;
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _raycastUnderPointer() {
    if (!this.camera) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.raycastTargets, true);
    if (intersects.length > 0) {
      // Find top-level component mesh in map
      let obj = intersects[0].object;
      while (obj) {
        if (this.meshMap.has(obj)) {
          return this.meshMap.get(obj);
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  _handlePointerDown(e) {
    if (!this.enabled) return;

    // Ignore clicks on primary action button or HUD
    if (e.target.closest('#gomikin-dissect-primary-ui') || e.target.closest('#gomikin-inspection-hud')) {
      return;
    }

    this._updatePointerCoordinates(e);
    this.isDragging = true;
    this.dragButton = e.button;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;

    const hit = this._raycastUnderPointer();

    if (this.focusedName) {
      // Already focused: check if clicked on focused object or empty background
      if (hit === this.focusedName) {
        this.pointerDownOnFocused = true;
      } else if (hit && hit !== this.focusedName) {
        // Clicked another component: switch focus directly!
        this.focus(hit);
        this.pointerDownOnFocused = true;
      } else {
        // Clicked empty background
        this.pointerDownOnFocused = false;
        // If left-click on empty background, return to catalogue
        if (e.button === 0) {
          this.unfocus();
        }
      }
    } else {
      // No component focused: click focuses component
      if (hit) {
        this.focus(hit);
        this.pointerDownOnFocused = true;
      }
    }
  }

  _handlePointerMove(e) {
    if (!this.enabled) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    this._updatePointerCoordinates(e);

    if (this.isDragging && this.focusedName) {
      // CAD Interaction during Drag
      // Middle Mouse Button (button 1) or Left Mouse on focused object:
      if (this.dragButton === 1) {
        if (e.shiftKey || this.isShiftPressed) {
          // Shift + MMB: Rotate / Orbit
          this.targetOrbit.x += dx * 0.007; // Yaw
          this.targetOrbit.y = THREE.MathUtils.clamp(this.targetOrbit.y + dy * 0.007, -Math.PI * 0.45, Math.PI * 0.45);
        } else {
          // MMB: Pan
          this.targetPan.x += dx * 0.0035;
          this.targetPan.y -= dy * 0.0035;
        }
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        return;
      }

      // Left Mouse Drag (button 0) on focused component: natural CAD orbit
      if (this.dragButton === 0 && this.pointerDownOnFocused) {
        this.targetOrbit.x += dx * 0.007;
        this.targetOrbit.y = THREE.MathUtils.clamp(this.targetOrbit.y + dy * 0.007, -Math.PI * 0.45, Math.PI * 0.45);
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        return;
      }
    }

    // Desktop Hover Interaction (when not dragging)
    if (!this.isDragging) {
      const hit = this._raycastUnderPointer();
      this.hoveredName = hit;

      if (!this.focusedName) {
        // No component focused: hovering a component triggers focus!
        if (hit) {
          this.focus(hit);
        }
      } else {
        // A component is already focused
        if (hit && hit !== this.focusedName) {
          // Hovered over another component: switch focus smoothly
          this.focus(hit);
        } else if (!hit) {
          // Pointer in empty space: anti-flicker check
          // If pointer is far away from center inspection zone (> 380px from screen center), return to catalogue
          const cx = window.innerWidth * 0.5;
          const cy = window.innerHeight * 0.5;
          const distFromCenter = Math.hypot(e.clientX - cx, e.clientY - cy);
          if (distFromCenter > 380) {
            this.unfocus();
          }
        }
      }
    }
  }

  _handlePointerUp(e) {
    this.isDragging = false;
    this.dragButton = -1;
    this.pointerDownOnFocused = false;
  }

  /**
   * Focuses on a specific component for detailed CAD inspection.
   * @param {string} name Component name in registry
   */
  focus(name) {
    if (!this.registry.has(name)) return;

    if (this.focusedName !== name) {
      // If switching from another component, reset inspection offsets
      if (this.focusedName) {
        this.resetInspectionOffsets();
      }
      this.focusedName = name;
      this.targetFocusProgress = 1.0;

      if (this.hudElement) {
        this.hudElement.classList.add('hud-visible');
      }

      if (this.onFocusChange) {
        this.onFocusChange(name, true);
      }
    }
  }

  /**
   * Unfocuses the active component and smoothly returns it to the catalogue grid.
   * @param {boolean} [immediate=false]
   */
  unfocus(immediate = false) {
    if (!this.focusedName && this.targetFocusProgress === 0.0) return;

    this.targetFocusProgress = 0.0;
    this.targetPan.set(0, 0);
    this.targetOrbit.set(0, 0);
    this.targetZoom = 1.0;

    if (this.hudElement) {
      this.hudElement.classList.remove('hud-visible');
    }

    if (immediate) {
      this.focusProgress = 0.0;
      this.focusPan.set(0, 0);
      this.focusOrbit.set(0, 0);
      this.focusZoom = 1.0;
      const oldName = this.focusedName;
      this.focusedName = null;
      if (this.onFocusChange) {
        this.onFocusChange(oldName, false);
      }
    }
  }

  resetInspectionOffsets() {
    this.targetPan.set(0, 0);
    this.targetOrbit.set(0, 0);
    this.targetZoom = 1.0;
  }

  /**
   * Calculates size-normalized scale factor based on bounding box.
   * Small sensors scale up to 4.5x; large housing scales moderately (1.15x).
   * @param {string} name
   * @returns {number}
   */
  calculateFocusScale(name) {
    const comp = this.choreography.componentData.get(name);
    if (!comp) return 1.5;

    const maxDim = Math.max(
      comp.worldDimensions.x,
      comp.worldDimensions.y,
      comp.worldDimensions.z
    );
    const boundingRadius = maxDim * 0.5;

    // Target visual radius ~0.42m
    const baseScale = THREE.MathUtils.clamp(0.42 / Math.max(0.02, boundingRadius), 1.15, 4.5);
    return baseScale * this.focusZoom;
  }

  /**
   * Converts world coordinates to local coordinates inside Fusion360_USDZ_Model.
   * Local X = World X * 1000
   * Local Y = -World Z * 1000
   * Local Z = World Y * 1000
   */
  worldToLocalOffset(worldVec) {
    return new THREE.Vector3(
      worldVec.x * 1000,
      -worldVec.z * 1000,
      worldVec.y * 1000
    );
  }

  /**
   * Per-frame update method called from main animation loop.
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (!this.enabled && this.focusProgress <= 0.001) return;

    // Smoothly damp focus progress
    this.focusProgress = THREE.MathUtils.damp(
      this.focusProgress,
      this.targetFocusProgress,
      8.0,
      deltaTime
    );

    // Smoothly damp CAD inspection offsets
    this.focusPan.x = THREE.MathUtils.damp(this.focusPan.x, this.targetPan.x, 10.0, deltaTime);
    this.focusPan.y = THREE.MathUtils.damp(this.focusPan.y, this.targetPan.y, 10.0, deltaTime);
    this.focusOrbit.x = THREE.MathUtils.damp(this.focusOrbit.x, this.targetOrbit.x, 10.0, deltaTime);
    this.focusOrbit.y = THREE.MathUtils.damp(this.focusOrbit.y, this.targetOrbit.y, 10.0, deltaTime);
    this.focusZoom = THREE.MathUtils.damp(this.focusZoom, this.targetZoom, 10.0, deltaTime);

    // If fully returned to catalogue, clear focusedName
    if (this.targetFocusProgress === 0.0 && this.focusProgress < 0.005) {
      if (this.focusedName) {
        const comp = this.choreography.componentData.get(this.focusedName);
        if (comp && comp.mesh) {
          // Ensure exact catalogue transform restored
          comp.mesh.scale.set(1, 1, 1);
        }
        const oldName = this.focusedName;
        this.focusedName = null;
        this.focusProgress = 0.0;
        if (this.onFocusChange) {
          this.onFocusChange(oldName, false);
        }
      }
      return;
    }

    if (!this.focusedName) return;

    const comp = this.choreography.componentData.get(this.focusedName);
    if (!comp || !comp.mesh) return;

    const fp = this.focusProgress; // 0.0 -> 1.0
    const easeF = fp < 0.5 ? 4 * fp * fp * fp : (fp - 1) * (2 * fp - 2) * (2 * fp - 2) + 1;

    // 1. World focus position with pan offset applied in camera space
    const targetWorldPos = new THREE.Vector3().copy(this.focusWorldCenter);
    targetWorldPos.x += this.focusPan.x;
    targetWorldPos.y += this.focusPan.y;

    // Delta from initial world center to target focus world center
    const focusDeltaW = new THREE.Vector3().subVectors(targetWorldPos, comp.initialWorldCenter);
    const focusLocalOffset = this.worldToLocalOffset(focusDeltaW);

    // 2. Interpolate position from catalogueLocalOffset to focusLocalOffset
    // Lift slightly forward along Z during transition for cinematic feel
    const currentPosOffset = new THREE.Vector3().lerpVectors(
      comp.catalogueLocalOffset,
      focusLocalOffset,
      easeF
    );

    // 3. Interpolate rotation: presentationRotation -> presentationRotation + orbit
    const baseRot = comp.presentationRotation;
    const currentRotX = baseRot.x + this.focusOrbit.y * easeF;
    const currentRotY = baseRot.y + this.focusOrbit.x * easeF;
    const currentRotZ = baseRot.z;

    // 4. Interpolate scale: 1.0 -> targetScale
    const targetScale = this.calculateFocusScale(this.focusedName);
    const currentScale = THREE.MathUtils.lerp(1.0, targetScale, easeF);

    // Apply to mesh
    comp.mesh.position.set(
      comp.initialPosition.x + currentPosOffset.x,
      comp.initialPosition.y + currentPosOffset.y,
      comp.initialPosition.z + currentPosOffset.z
    );
    comp.mesh.rotation.set(
      comp.initialRotation.x + currentRotX,
      comp.initialRotation.y + currentRotY,
      comp.initialRotation.z + currentRotZ
    );
    comp.mesh.scale.set(currentScale, currentScale, currentScale);
  }

  dispose() {
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    if (this.hudElement) this.hudElement.remove();
  }
}
