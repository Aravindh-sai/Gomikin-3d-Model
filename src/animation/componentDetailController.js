import * as THREE from 'three';

/**
 * ComponentDetailController
 * 
 * Implements the Gomikin Component Detail Inspection Experience:
 * - NO hover reactions (hover enlargement/movement/focus completely removed)
 * - Click component in grid -> switch to full Component Detail Mode
 * - In Detail Mode: hides all other 32 components and labels; selected component is centered and scaled for inspection
 * - Click selected component again or "← BACK TO CATALOGUE" -> returns smoothly to 3D catalogue grid
 * - CAD Viewport Controls:
 *     In Grid Mode: Wheel = Zoom camera, MMB = Pan camera, Shift+MMB = Orbit camera
 *     In Detail Mode: Wheel = Zoom component, MMB = Pan component, Shift+MMB = Orbit component
 * - Left click is strictly reserved for clicking/selecting components (no LMB drag orbit)
 */
export class ComponentDetailController {
  constructor(componentRegistry, choreography, camera, controls, domElement) {
    this.registry = componentRegistry;
    this.choreography = choreography;
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement || document.body;

    // Raycaster & pointer
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-1000, -1000);

    // Mesh map: Mesh -> componentName
    this.meshMap = new Map();
    this.raycastTargets = [];
    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        this.meshMap.set(mesh, name);
        this.raycastTargets.push(mesh);
      }
    }

    // State machine: 'CATALOGUE' | 'TRANSITIONING' | 'DETAIL'
    this.mode = 'CATALOGUE';
    this.selectedName = null;
    this.transitionProgress = 0.0;
    this.targetTransitionProgress = 0.0;
    this.enabled = false;

    // Detail CAD Viewport Offsets
    this.detailOrbit = new THREE.Vector2(0, 0);
    this.targetOrbit = new THREE.Vector2(0, 0);
    this.detailPan = new THREE.Vector2(0, 0);
    this.targetPan = new THREE.Vector2(0, 0);
    this.detailZoom = 1.0;
    this.targetZoom = 1.0;

    // Grid View CAD Camera State
    this.gridCameraTarget = new THREE.Vector3(0.0, -0.05, 0.0);
    this.gridRadius = 9.2;
    this.gridTheta = 0;
    this.gridPhi = Math.PI / 2;

    // Drag tracking
    this.isDragging = false;
    this.dragButton = -1;
    this.dragStart = { x: 0, y: 0 };
    this.pointerDownPos = { x: 0, y: 0 };
    this.isShiftPressed = false;

    // UI elements
    this.detailOverlay = null;
    this._createDetailUI();
    this._bindEvents();
  }

  _createDetailUI() {
    if (document.getElementById('gomikin-detail-ui')) return;

    const style = document.createElement('style');
    style.id = 'gomikin-detail-styles';
    style.textContent = `
      #gomikin-detail-ui {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 1200;
        opacity: 0;
        transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        display: none;
      }
      #gomikin-detail-ui.detail-active {
        opacity: 1;
        display: block;
      }

      /* Top Header Card */
      .detail-header {
        position: absolute;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        background: rgba(10, 15, 24, 0.92);
        border: 1px solid rgba(0, 255, 204, 0.4);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), inset 0 0 16px rgba(0, 255, 204, 0.1);
        backdrop-filter: blur(14px);
        border-radius: 12px;
        padding: 10px 28px;
        pointer-events: auto;
        user-select: none;
      }
      .detail-category {
        display: inline-block;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: #00ffcc;
        font-weight: 700;
        margin-bottom: 3px;
        background: rgba(0, 255, 204, 0.12);
        padding: 2px 8px;
        border-radius: 4px;
      }
      .detail-title {
        font-size: 20px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 0.5px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      /* Back to Catalogue Button */
      .btn-back-catalogue {
        position: absolute;
        top: 26px;
        left: 28px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(10, 15, 24, 0.92);
        border: 1px solid rgba(0, 255, 204, 0.45);
        color: #00ffcc;
        border-radius: 24px;
        padding: 9px 18px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        cursor: pointer;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
        pointer-events: auto;
        user-select: none;
        transition: all 0.25s ease;
      }
      .btn-back-catalogue:hover {
        background: rgba(0, 255, 204, 0.2);
        border-color: #38bdf8;
        color: #ffffff;
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 255, 204, 0.35);
      }

      /* Bottom CAD Control Hint */
      .detail-cad-hint {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(10, 15, 24, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        padding: 6px 20px;
        color: #94a3b8;
        font-size: 11px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        pointer-events: none;
        user-select: none;
      }
      .detail-cad-hint kbd {
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 1px 5px;
        color: #00ffcc;
        font-family: monospace;
        font-size: 10px;
        font-weight: 600;
      }
      .detail-cad-divider {
        width: 1px;
        height: 12px;
        background: rgba(255, 255, 255, 0.15);
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'gomikin-detail-ui';
    overlay.innerHTML = `
      <button class="btn-back-catalogue" id="btn-back-to-grid">
        <span>←</span>
        <span>BACK TO CATALOGUE</span>
      </button>

      <div class="detail-header">
        <div class="detail-category" id="detail-category-tag">SUBSYSTEM</div>
        <div class="detail-title" id="detail-component-title">Component Name</div>
      </div>

      <div class="detail-cad-hint">
        <span><kbd>Scroll</kbd> Zoom</span>
        <div class="detail-cad-divider"></div>
        <span><kbd>MMB</kbd> Pan</span>
        <div class="detail-cad-divider"></div>
        <span><kbd>Shift + MMB</kbd> Rotate</span>
        <div class="detail-cad-divider"></div>
        <span><kbd>Click Component</kbd> Return</span>
      </div>
    `;
    document.body.appendChild(overlay);

    const backBtn = document.getElementById('btn-back-to-grid');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.exitDetailView();
      });
    }

    this.detailOverlay = overlay;
  }

  _bindEvents() {
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onWheel = this._handleWheel.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);
    this._onContextMenu = (e) => {
      if (this.enabled) e.preventDefault();
    };

    window.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('contextmenu', this._onContextMenu);
  }

  initGridCameraState() {
    this.gridCameraTarget = new THREE.Vector3(0.0, -0.05, 0.0);
    if (this.camera) {
      const offset = new THREE.Vector3().subVectors(this.camera.position, this.gridCameraTarget);
      this.gridRadius = Math.max(5.0, offset.length());
      this.gridTheta = Math.atan2(offset.x, offset.z);
      this.gridPhi = Math.acos(THREE.MathUtils.clamp(offset.y / this.gridRadius, -1, 1));
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
    if (this.enabled) {
      if (this.controls) this.controls.enabled = false;
      this.initGridCameraState();
    } else {
      if (this.mode === 'DETAIL') {
        this.exitDetailView(true);
      }
      if (this.controls) this.controls.enabled = true;
    }
  }

  _handleKeyDown(e) {
    if (e.key === 'Shift') this.isShiftPressed = true;
    if (e.key === 'Escape' && this.mode === 'DETAIL') {
      this.exitDetailView();
    }
  }

  _handleKeyUp(e) {
    if (e.key === 'Shift') this.isShiftPressed = false;
  }

  _updatePointerCoordinates(e) {
    this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  _raycastUnderPointer() {
    if (!this.camera) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // Raycast only against visible meshes
    const visibleTargets = this.raycastTargets.filter(m => m.visible);
    const intersects = this.raycaster.intersectObjects(visibleTargets, true);
    if (intersects.length > 0) {
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

  orbitGridCamera(dx, dy) {
    if (!this.camera) return;
    this.gridTheta -= dx * 0.006;
    this.gridPhi = THREE.MathUtils.clamp(this.gridPhi - dy * 0.006, 0.1, Math.PI - 0.1);

    const sinPhi = Math.sin(this.gridPhi);
    this.camera.position.x = this.gridCameraTarget.x + this.gridRadius * sinPhi * Math.sin(this.gridTheta);
    this.camera.position.y = this.gridCameraTarget.y + this.gridRadius * Math.cos(this.gridPhi);
    this.camera.position.z = this.gridCameraTarget.z + this.gridRadius * sinPhi * Math.cos(this.gridTheta);
    this.camera.lookAt(this.gridCameraTarget);
    if (this.controls) this.controls.target.copy(this.gridCameraTarget);
  }

  panGridCamera(dx, dy) {
    if (!this.camera) return;
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    this.camera.matrix.extractBasis(right, up, new THREE.Vector3());

    const panFactor = Math.max(0.001, this.gridRadius * 0.0012);
    const delta = new THREE.Vector3()
      .addScaledVector(right, -dx * panFactor)
      .addScaledVector(up, dy * panFactor);

    this.camera.position.add(delta);
    this.gridCameraTarget.add(delta);
    this.camera.lookAt(this.gridCameraTarget);
    if (this.controls) this.controls.target.copy(this.gridCameraTarget);
  }

  zoomGridCamera(deltaY) {
    if (!this.camera) return;
    const offset = new THREE.Vector3().subVectors(this.camera.position, this.gridCameraTarget);
    let radius = offset.length();
    const zoomFactor = 1 + deltaY * 0.001;
    const newRadius = THREE.MathUtils.clamp(radius * zoomFactor, 3.5, 25.0);

    this.gridRadius = newRadius;
    offset.multiplyScalar(newRadius / Math.max(0.001, radius));
    this.camera.position.copy(this.gridCameraTarget).add(offset);
    this.camera.lookAt(this.gridCameraTarget);
    if (this.controls) this.controls.target.copy(this.gridCameraTarget);
  }

  resetGridCamera() {
    if (!this.camera) return;
    const aspect = (typeof window !== 'undefined' && window.innerHeight > 0) ? (window.innerWidth / window.innerHeight) : 16 / 9;
    const fitted = this.choreography.calculateCatalogueCamera(aspect);
    this.gridCameraTarget.copy(fitted.target);
    this.camera.position.copy(fitted.position);
    this.camera.lookAt(this.gridCameraTarget);
    if (this.controls) this.controls.target.copy(this.gridCameraTarget);
    this.initGridCameraState();
  }

  _handleWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();

    if (this.mode === 'DETAIL') {
      const zoomDelta = e.deltaY * 0.0012;
      this.targetZoom = THREE.MathUtils.clamp(this.targetZoom * (1 - zoomDelta), 0.35, 5.0);
    } else if (this.mode === 'CATALOGUE') {
      this.zoomGridCamera(e.deltaY);
    }
  }

  _handlePointerDown(e) {
    if (!this.enabled) return;

    if (e.target.closest('#btn-dissect-gomikin') || e.target.closest('#gomikin-dissect-primary-ui') || e.target.closest('.btn-back-catalogue')) {
      return;
    }

    this._updatePointerCoordinates(e);
    this.isDragging = true;
    this.dragButton = e.button;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;
    this.pointerDownPos.x = e.clientX;
    this.pointerDownPos.y = e.clientY;
  }

  _handlePointerMove(e) {
    if (!this.enabled) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    this.dragStart.x = e.clientX;
    this.dragStart.y = e.clientY;

    if (!this.isDragging) {
      // CRITICAL: HOVER INTERACTION IS COMPLETELY REMOVED.
      return;
    }

    // CAD Controls handling during drag
    if (this.dragButton === 1) { // Middle Mouse Button (MMB)
      if (e.shiftKey || this.isShiftPressed) {
        // Shift + MMB: ORBIT
        if (this.mode === 'DETAIL') {
          this.targetOrbit.x += dx * 0.007; // Yaw
          this.targetOrbit.y = THREE.MathUtils.clamp(this.targetOrbit.y + dy * 0.007, -Math.PI * 0.45, Math.PI * 0.45); // Pitch
        } else if (this.mode === 'CATALOGUE') {
          this.orbitGridCamera(dx, dy);
        }
      } else {
        // MMB: PAN
        if (this.mode === 'DETAIL') {
          this.targetPan.x += dx * 0.0035;
          this.targetPan.y -= dy * 0.0035;
        } else if (this.mode === 'CATALOGUE') {
          this.panGridCamera(dx, dy);
        }
      }
    }
  }

  _handlePointerUp(e) {
    if (!this.enabled) return;

    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    this.isDragging = false;
    this.dragButton = -1;

    // Deliberate click with Left Mouse Button (0)
    if (dist < 6 && e.button === 0) {
      this._updatePointerCoordinates(e);
      const hitName = this._raycastUnderPointer();

      if (this.mode === 'CATALOGUE') {
        if (hitName) {
          this.enterDetailView(hitName);
        }
      } else if (this.mode === 'DETAIL') {
        if (hitName === this.selectedName) {
          this.exitDetailView();
        }
      }
    }
  }

  /**
   * Enters Detail Mode for the specified component.
   * @param {string} name
   */
  enterDetailView(name) {
    if (!this.registry.has(name)) return;

    this.selectedName = name;
    this.mode = 'DETAIL';
    this.targetTransitionProgress = 1.0;

    const comp = this.choreography.componentData.get(name);

    // 1. Hide every other component
    for (const otherName of this.registry.getNames()) {
      const otherMesh = this.registry.get(otherName);
      if (otherMesh) {
        otherMesh.visible = (otherName === name);
      }
    }

    // 2. Hide catalogue labels
    const labelOverlay = document.getElementById('gomikin-catalogue-labels');
    if (labelOverlay) {
      labelOverlay.style.display = 'none';
    }

    // 3. Update Detail UI texts
    if (this.detailOverlay) {
      const catEl = document.getElementById('detail-category-tag');
      const titleEl = document.getElementById('detail-component-title');
      if (catEl) catEl.textContent = (comp ? comp.groupTitle : 'SUBSYSTEM').toUpperCase();
      if (titleEl) titleEl.textContent = comp ? comp.displayName : name;
      this.detailOverlay.classList.add('detail-active');
    }

    // 4. Reset inspection offsets
    this.targetOrbit.set(0, 0);
    this.targetPan.set(0, 0);
    this.targetZoom = 1.0;
  }

  /**
   * Exits Detail Mode and smoothly restores the full 33-component Catalogue Grid.
   * @param {boolean} [immediate=false]
   */
  exitDetailView(immediate = false) {
    if (this.mode === 'CATALOGUE' && this.targetTransitionProgress === 0.0) return;

    this.targetTransitionProgress = 0.0;
    this.mode = 'CATALOGUE';

    if (this.detailOverlay) {
      this.detailOverlay.classList.remove('detail-active');
    }

    // 1. Restore visibility of ALL 33 components
    for (const name of this.registry.getNames()) {
      const mesh = this.registry.get(name);
      if (mesh) {
        mesh.visible = true;
      }
    }

    // 2. Restore catalogue labels
    const labelOverlay = document.getElementById('gomikin-catalogue-labels');
    if (labelOverlay) {
      labelOverlay.style.display = 'block';
    }

    // 3. Restore catalogue camera
    this.resetGridCamera();

    if (immediate) {
      this.transitionProgress = 0.0;
      this.targetOrbit.set(0, 0);
      this.targetPan.set(0, 0);
      this.targetZoom = 1.0;
      this.detailOrbit.set(0, 0);
      this.detailPan.set(0, 0);
      this.detailZoom = 1.0;

      if (this.selectedName) {
        const comp = this.choreography.componentData.get(this.selectedName);
        if (comp && comp.mesh) {
          this._applyCatalogueTransform(comp);
        }
      }
      this.selectedName = null;
    }
  }

  /**
   * Applies the exact catalogue grid transform with pivot-offset correction.
   * @param {Object} comp
   */
  _applyCatalogueTransform(comp) {
    const targetLocalCenter = new THREE.Vector3(
      comp.targetWorldCenter.x * 1000,
      -comp.targetWorldCenter.z * 1000,
      comp.targetWorldCenter.y * 1000
    );
    const scale = new THREE.Vector3().copy(comp.initialScale).multiplyScalar(comp.catalogueScaleMultiplier);
    const q = new THREE.Quaternion().setFromEuler(comp.presentationRotation);
    const scaledOffset = new THREE.Vector3().copy(comp.geomCenter).multiply(scale).applyQuaternion(q);
    const meshPos = new THREE.Vector3().subVectors(targetLocalCenter, scaledOffset);

    comp.mesh.position.copy(meshPos);
    comp.mesh.rotation.copy(comp.presentationRotation);
    comp.mesh.scale.copy(scale);
  }

  /**
   * Calculates adaptive detail inspection scale multiplier so the component fills ~40% of the viewport.
   * Target visual diameter ~2.4m in world units.
   * @param {string} name
   * @returns {number}
   */
  calculateDetailScaleMultiplier(name) {
    const comp = this.choreography.componentData.get(name);
    if (!comp) return 2.0;

    const maxDim = Math.max(
      comp.worldDimensions.x,
      comp.worldDimensions.y,
      comp.worldDimensions.z
    );

    // Target visual diameter ~2.4m in world space
    const baseMult = THREE.MathUtils.clamp(2.4 / Math.max(0.008, maxDim), 1.2, 240.0);
    return baseMult * this.detailZoom;
  }

  /**
   * Per-frame update method called from main animation loop.
   * @param {number} deltaTime
   */
  update(deltaTime) {
    if (!this.enabled && this.transitionProgress <= 0.001) return;

    // Smoothly damp transition progress
    this.transitionProgress = THREE.MathUtils.damp(
      this.transitionProgress,
      this.targetTransitionProgress,
      9.0,
      deltaTime
    );

    // Smoothly damp CAD inspection offsets
    this.detailPan.x = THREE.MathUtils.damp(this.detailPan.x, this.targetPan.x, 10.0, deltaTime);
    this.detailPan.y = THREE.MathUtils.damp(this.detailPan.y, this.targetPan.y, 10.0, deltaTime);
    this.detailOrbit.x = THREE.MathUtils.damp(this.detailOrbit.x, this.targetOrbit.x, 10.0, deltaTime);
    this.detailOrbit.y = THREE.MathUtils.damp(this.detailOrbit.y, this.targetOrbit.y, 10.0, deltaTime);
    this.detailZoom = THREE.MathUtils.damp(this.detailZoom, this.targetZoom, 10.0, deltaTime);

    // Check if fully returned to catalogue
    if (this.targetTransitionProgress === 0.0 && this.transitionProgress < 0.005) {
      if (this.selectedName) {
        const comp = this.choreography.componentData.get(this.selectedName);
        if (comp && comp.mesh) {
          this._applyCatalogueTransform(comp);
        }
        this.selectedName = null;
        this.transitionProgress = 0.0;
      }
      return;
    }

    if (!this.selectedName) return;

    const comp = this.choreography.componentData.get(this.selectedName);
    if (!comp || !comp.mesh) return;

    const tp = this.transitionProgress;
    const easeT = tp < 0.5 ? 4 * tp * tp * tp : (tp - 1) * (2 * tp - 2) * (2 * tp - 2) + 1;

    // Target world center in Detail view
    const detailWorldCenter = new THREE.Vector3(this.detailPan.x, 0.0 + this.detailPan.y, 0.0);
    const currentWorldCenter = new THREE.Vector3().lerpVectors(comp.targetWorldCenter, detailWorldCenter, easeT);

    // Convert to local parent space
    const targetLocalCenter = new THREE.Vector3(
      currentWorldCenter.x * 1000,
      -currentWorldCenter.z * 1000,
      currentWorldCenter.y * 1000
    );

    // Interpolate rotation: presentationRotation -> presentationRotation + orbit
    const rotX = comp.presentationRotation.x + this.detailOrbit.y * easeT;
    const rotY = comp.presentationRotation.y + this.detailOrbit.x * easeT;
    const rotZ = comp.presentationRotation.z;
    const currentRot = new THREE.Euler(rotX, rotY, rotZ);

    // Interpolate scale multiplier
    const targetDetailMult = this.calculateDetailScaleMultiplier(this.selectedName);
    const currentMult = THREE.MathUtils.lerp(comp.catalogueScaleMultiplier, targetDetailMult, easeT);
    const currentScale = new THREE.Vector3().copy(comp.initialScale).multiplyScalar(currentMult);

    // Pivot-offset correction: mathematically keeps center at targetLocalCenter
    const q = new THREE.Quaternion().setFromEuler(currentRot);
    const scaledOffset = new THREE.Vector3().copy(comp.geomCenter).multiply(currentScale).applyQuaternion(q);
    const meshPos = new THREE.Vector3().subVectors(targetLocalCenter, scaledOffset);

    comp.mesh.position.copy(meshPos);
    comp.mesh.rotation.copy(currentRot);
    comp.mesh.scale.copy(currentScale);
  }

  dispose() {
    window.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('contextmenu', this._onContextMenu);
    if (this.detailOverlay) this.detailOverlay.remove();
  }
}
