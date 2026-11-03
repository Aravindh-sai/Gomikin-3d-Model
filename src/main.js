import './style.css';
import * as THREE from 'three';
import { USDLoader } from 'three/addons/loaders/USDLoader.js';
import { buildComponentRegistry } from './components/componentRegistry.js';
import { initDissectionAnimationSystem } from './animation/dissectionAnimationSystem.js';
import { initScene } from './scene/scene.js';
import { createGomikinEnvelope } from './components/envelope.js';
import { createHousing } from './components/housing.js';
import { DemoController } from './interaction/demoController.js';
import { initUI } from './ui/demoUI.js';
import { InspectionController } from './interaction/inspectionController.js';
import { WorkflowController } from './animation/workflowController.js';
import { initUnifiedInspectionUI } from './ui/unifiedInspectionUI.js';
import { ModuleViewController } from './animation/moduleViewController.js';
import { PhysicalFlowController } from './animation/physicalFlowController.js';
import { initModularControlBar } from './ui/modularControlBar.js';

import { ViewTransitionCoordinator } from './animation/viewTransitionCoordinator.js';
import { VirtualDoorAssembly } from './components/virtualDoorAssembly.js';
import { ResilientModelLoader, DEFAULT_MODEL_CONFIG } from './utils/resilientModelLoader.js';

/**
 * In-Canvas State HUD Controller
 * Manages minimal, elegant in-canvas status transitions without blocking the landing page:
 * - State 1 & 2: Idle Preview (Invitation to explore 3D CAD model)
 * - State 3: Model Download (Clean horizontal progress bar, percentage only)
 * - State 4: Model Initialization ("Preparing 3D experience...")
 * - State 5: Model Ready (Smooth transition to live Three.js viewport)
 * - State 6: Error / Retry (Clean recovery action without page reload)
 */
function initCanvasHUD() {
  const idleOverlay = document.getElementById('canvas-idle-overlay');
  const loadingOverlay = document.getElementById('canvas-loading-overlay');
  const errorOverlay = document.getElementById('canvas-error-overlay');
  const statusDot = document.getElementById('canvas-status-dot');
  const loadingStatus = document.getElementById('canvas-loading-status');
  const progressFill = document.getElementById('canvas-progress-fill');
  const progressPct = document.getElementById('canvas-progress-pct');
  const errorMsg = document.getElementById('canvas-error-msg');
  const retryBtn = document.getElementById('btn-canvas-retry');
  const cloudBtn = document.getElementById('btn-canvas-cloud');

  return {
    showIdle: () => {
      if (idleOverlay) idleOverlay.style.display = 'flex';
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (errorOverlay) errorOverlay.style.display = 'none';
      if (statusDot) statusDot.className = 'status-dot idle';
    },
    showLoading: () => {
      if (idleOverlay) idleOverlay.style.display = 'none';
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
      }
      if (errorOverlay) errorOverlay.style.display = 'none';
      if (statusDot) statusDot.className = 'status-dot loading';
      if (progressFill) {
        progressFill.style.width = '0%';
        progressFill.classList.remove('pulse-anim');
      }
      if (progressPct) progressPct.textContent = '0%';
      if (loadingStatus) loadingStatus.textContent = 'Downloading product model...';
    },
    setProgress: (pct) => {
      const p = Math.min(100, Math.max(0, pct || 0));
      if (progressFill) progressFill.style.width = `${p.toFixed(0)}%`;
      if (progressPct) progressPct.textContent = `${p.toFixed(0)}%`;
    },
    setStatus: (statusText) => {
      if (loadingStatus && statusText) loadingStatus.textContent = statusText;
    },
    setParsing: (isParsing) => {
      if (loadingStatus && isParsing) {
        loadingStatus.textContent = 'Preparing 3D experience...';
      }
      if (progressFill && isParsing) {
        progressFill.style.width = '100%';
        progressFill.classList.add('pulse-anim');
      }
    },
    showError: (errMsg, onRetry, onForceCloud) => {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (errorOverlay) errorOverlay.style.display = 'flex';
      if (statusDot) statusDot.className = 'status-dot idle';
      if (errorMsg && errMsg) errorMsg.textContent = errMsg;
      if (retryBtn) retryBtn.onclick = onRetry;
      if (cloudBtn) cloudBtn.onclick = onForceCloud || onRetry;
    },
    complete: () => {
      if (statusDot) statusDot.className = 'status-dot active';
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 400);
      }
    }
  };
}

/**
 * Configures the responsive Fullscreen mode for the product canvas container.
 */
function setupFullscreenToggle() {
  const fullscreenBtn = document.getElementById('btn-canvas-fullscreen');
  const canvasWrapper = document.getElementById('gomikin-canvas-wrapper');
  const fullscreenText = document.getElementById('fullscreen-text');
  const fullscreenIcon = document.getElementById('fullscreen-icon');

  if (!fullscreenBtn || !canvasWrapper) return;

  const toggle = () => {
    const isFull = canvasWrapper.classList.toggle('fullscreen-mode');
    if (isFull) {
      if (fullscreenText) fullscreenText.textContent = 'Exit Fullscreen';
      if (fullscreenIcon) fullscreenIcon.textContent = '✕';
      document.body.style.overflow = 'hidden';
    } else {
      if (fullscreenText) fullscreenText.textContent = 'Fullscreen';
      if (fullscreenIcon) fullscreenIcon.textContent = '⛶';
      document.body.style.overflow = '';
    }
    window.dispatchEvent(new Event('resize'));
  };

  fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && canvasWrapper.classList.contains('fullscreen-mode')) {
      toggle();
    }
  });
}

function init() {
  const canvas = document.querySelector('#app-canvas');
  if (!canvas) {
    console.warn('Gomikin #app-canvas element not found.');
    return;
  }

  // 1. Initialize Three.js Scene within the embedded canvas container
  const { scene, camera, renderer, controls } = initScene(canvas);

  // Baseline Parametric Envelope (preserved intact, hidden for loaded CAD assembly)
  const gomikinEnvelope = createGomikinEnvelope();
  gomikinEnvelope.visible = false;
  scene.add(gomikinEnvelope);
  window.gomikinEnvelope = gomikinEnvelope;
  window.THREE = THREE;
  window.camera = camera;
  window.controls = controls;
  window.scene = scene;
  window.renderer = renderer;

  // Frame camera on the 1020 mm envelope (center at Y = 0.51 m)
  camera.position.set(0.95, 1.15, 1.55);
  controls.target.set(0, 0.51, 0);
  controls.update();

  // Initially disable OrbitControls during idle/loading so cursor clicks don't spin empty studio
  controls.enabled = false;

  // 2. Initialize in-canvas HUD controller
  const canvasHUD = initCanvasHUD();
  canvasHUD.showIdle();

  // 3. Setup Fullscreen toggling
  setupFullscreenToggle();

  // Model loading state flags
  let isLoadingModel = false;
  let isModelLoaded = false;

  // 4. On-Demand CAD Model Loader (Decoupled from landing page startup)
  async function loadUSDZ(forcedSource = null) {
    if (isModelLoaded || isLoadingModel) return;
    isLoadingModel = true;

    canvasHUD.showLoading();

    try {
      const loaderConfig = {};
      if (forcedSource === 'cloud') {
        loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => !s.isLocal);
      } else if (forcedSource === 'local') {
        loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => s.isLocal);
      }

      const modelLoader = new ResilientModelLoader(loaderConfig);

      // Download archive buffer with progress telemetry
      const buffer = await modelLoader.loadModelBuffer({
        onStatus: (statusText) => {
          // Minimal status update
        },
        onProgress: (progress) => {
          // STRICT REQUIREMENT: Only percentage displayed in UI, no numerical MB or speed
          canvasHUD.setProgress(progress.percent);
        }
      });

      // Parsing phase (State 4)
      canvasHUD.setParsing(true);

      const usdLoader = new USDLoader();
      usdLoader.parse(
        buffer,
        '',
        (usdModel) => {
          usdModel.name = 'Fusion360_USDZ_Model';
          scene.add(usdModel);
          window.usdModel = usdModel;
          console.log('USDZ model loaded and parsed successfully:', usdModel);

          // Build clean component registry for animation control
          const componentRegistry = buildComponentRegistry(usdModel, true);
          window.componentRegistry = componentRegistry;

          // Initialize Procedural Virtual Door Assembly for Leftover Food Compartment
          const virtualDoor = new VirtualDoorAssembly(scene, componentRegistry, renderer);
          window.virtualDoorAssembly = virtualDoor;

          // Initialize Gomikin Interactive Dissection & 3D Catalogue System
          const gomikinAnimation = initDissectionAnimationSystem(componentRegistry, camera, controls);
          window.gomikinAnimation = gomikinAnimation;

          // Initialize Modular View Controller & Physical Flow Controller
          const moduleViewController = new ModuleViewController(componentRegistry, camera, controls);
          window.moduleViewController = moduleViewController;

          const physicalFlowController = new PhysicalFlowController(componentRegistry, scene, camera, controls);
          window.physicalFlowController = physicalFlowController;

          // Initialize Authoritative View Transition Coordinator
          const viewCoordinator = new ViewTransitionCoordinator({
            componentRegistry,
            camera,
            controls,
            moduleViewController,
            dissectionController: gomikinAnimation.controller,
            physicalFlowController
          });
          window.viewCoordinator = viewCoordinator;

          // Mount Modern Glassmorphism Modular Control Bar & Workflow Sim Dock
          initModularControlBar({
            viewCoordinator,
            moduleViewController,
            physicalFlowController,
            dissectionAnimationController: gomikinAnimation.controller
          });

          // Enable controls for user exploration
          controls.enabled = true;
          isModelLoaded = true;
          isLoadingModel = false;

          canvasHUD.complete();
        },
        (error) => {
          console.error('Error parsing USDZ:', error);
          isLoadingModel = false;
          canvasHUD.showError(
            'Failed to parse 3D CAD data.',
            () => loadUSDZ(),
            () => loadUSDZ('cloud')
          );
        }
      );
    } catch (loadErr) {
      console.error('Error loading CAD model:', loadErr);
      isLoadingModel = false;
      canvasHUD.showError(
        loadErr.message || 'Failed to download CAD assembly.',
        () => loadUSDZ(),
        () => loadUSDZ('cloud')
      );
    }
  }

  // 5. Wire User Interactive Triggers
  const heroExploreBtn = document.getElementById('btn-hero-explore');
  const canvasExploreBtn = document.getElementById('btn-canvas-explore');
  const canvasIdleOverlay = document.getElementById('canvas-idle-overlay');

  const startExploring = () => {
    if (!isModelLoaded && !isLoadingModel) {
      loadUSDZ();
    }
  };

  if (heroExploreBtn) {
    heroExploreBtn.addEventListener('click', () => {
      startExploring();
      const wrapper = document.getElementById('gomikin-canvas-wrapper');
      if (wrapper) {
        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  if (canvasExploreBtn) {
    canvasExploreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startExploring();
    });
  }

  if (canvasIdleOverlay) {
    canvasIdleOverlay.addEventListener('click', () => {
      startExploring();
    });
  }

  // 6. Preserved Controllers & Legacy Infrastructure
  const inspectionController = new InspectionController(gomikinEnvelope, camera, controls);
  const workflowController = new WorkflowController(gomikinEnvelope, scene);
  window.inspectionController = inspectionController;
  window.workflowController = workflowController;

  const unifiedUI = initUnifiedInspectionUI(gomikinEnvelope, inspectionController, workflowController, camera, controls);
  window.unifiedUI = unifiedUI;
  const rightPanel = document.getElementById('gomikin-right-panel');
  if (rightPanel) rightPanel.style.display = 'none';

  const gomikin = new THREE.Group();
  gomikin.name = 'LegacyGomikin';
  const housing = createHousing();
  housing.visible = false;
  gomikin.add(housing);
  gomikin.visible = false;
  scene.add(gomikin);

  const demoController = new DemoController(gomikin, camera, controls);
  window.demoController = demoController;

  initUI();
  const legacyUI = document.getElementById('gomikin-ui');
  const legacyToggleBtn = document.getElementById('ui-toggle-btn');
  if (legacyUI) legacyUI.style.display = 'none';
  if (legacyToggleBtn) legacyToggleBtn.style.display = 'none';

  // 7. Unified Render Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.1);

    if (window.virtualDoorAssembly) {
      window.virtualDoorAssembly.update(deltaTime);
    }

    if (window.viewCoordinator) {
      window.viewCoordinator.update(deltaTime);
    } else {
      if (window.gomikinAnimation && window.gomikinAnimation.controller) {
        window.gomikinAnimation.controller.update(deltaTime);
      }
      if (window.moduleViewController) {
        window.moduleViewController.update(deltaTime);
      }
      if (window.physicalFlowController) {
        window.physicalFlowController.update(deltaTime);
      }
    }

    if (workflowController) {
      workflowController.update(deltaTime);
    }

    if (demoController) {
      demoController.update(deltaTime);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
