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
 * Manages minimal, elegant status transitions:
 * - Idle Preview (Interactive invitation on landing page)
 * - Fullscreen Loading (Percentage only, word "Loading", never "Downloading")
 * - Fullscreen Ready (Reveal 3D model, enable OrbitControls)
 * - Fullscreen Error / Retry (Clean recovery action without page reload)
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
    hideIdle: () => {
      if (idleOverlay) idleOverlay.style.display = 'none';
    },
    showLoading: () => {
      if (idleOverlay) idleOverlay.style.display = 'none';
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
      }
      if (errorOverlay) errorOverlay.style.display = 'none';
      if (statusDot) statusDot.className = 'status-dot loading';
    },
    hideLoading: () => {
      if (loadingOverlay) loadingOverlay.style.display = 'none';
    },
    setProgress: (pct) => {
      const p = Math.min(100, Math.max(0, pct || 0));
      if (progressFill) progressFill.style.width = `${p.toFixed(0)}%`;
      if (progressPct) progressPct.textContent = `${p.toFixed(0)}%`;
      if (loadingStatus) loadingStatus.textContent = `Loading... ${p.toFixed(0)}%`;
    },
    setStatus: (statusText) => {
      if (loadingStatus && statusText) loadingStatus.textContent = statusText;
    },
    setParsing: (isParsing) => {
      if (loadingStatus && isParsing) {
        loadingStatus.textContent = 'Loading... Preparing 3D model...';
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
    hideError: () => {
      if (errorOverlay) errorOverlay.style.display = 'none';
    },
    complete: () => {
      if (statusDot) statusDot.className = 'status-dot active';
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 350);
      }
    }
  };
}

function init() {
  const canvas = document.querySelector('#app-canvas');
  if (!canvas) {
    console.warn('Gomikin #app-canvas element not found.');
    return;
  }

  // 1. Initialize Three.js Scene within the canvas container
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

  // Initially disable OrbitControls during idle so clicking canvas doesn't spin empty studio
  controls.enabled = false;

  // 2. Initialize Canvas HUD Controller
  const canvasHUD = initCanvasHUD();
  canvasHUD.showIdle();

  // 3. Dismiss Minimal Initialization Screen
  const initScreen = document.getElementById('gomikin-init-screen');
  if (initScreen) {
    setTimeout(() => {
      initScreen.classList.add('hidden');
      setTimeout(() => initScreen.remove(), 400);
    }, 80);
  }

  // 4. Model State & Background CAD Loading Architecture
  const modelState = {
    status: 'idle', // 'idle' | 'loading' | 'parsing' | 'ready' | 'error'
    progress: 0,
    error: null,
    isFullscreen: false,
    loadPromise: null
  };
  window.gomikinModelState = modelState;

  function startBackgroundLoad(forcedSource = null) {
    if (modelState.status === 'ready') return Promise.resolve();
    if (modelState.status === 'loading' && modelState.loadPromise && !forcedSource) {
      return modelState.loadPromise;
    }

    modelState.status = 'loading';
    modelState.progress = 0;
    modelState.error = null;

    if (modelState.isFullscreen) {
      canvasHUD.showLoading();
      canvasHUD.setProgress(0);
    }

    const loaderConfig = {};
    if (forcedSource === 'cloud') {
      loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => !s.isLocal);
    } else if (forcedSource === 'local') {
      loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => s.isLocal);
    }

    const modelLoader = new ResilientModelLoader(loaderConfig);

    modelState.loadPromise = (async () => {
      try {
        const buffer = await modelLoader.loadModelBuffer({
          onStatus: () => {},
          onProgress: (progress) => {
            modelState.progress = Math.min(100, Math.max(0, progress.percent || 0));
            // Only update loading overlay if fullscreen is active
            if (modelState.isFullscreen) {
              canvasHUD.setProgress(modelState.progress);
            }
          }
        });

        modelState.status = 'parsing';
        if (modelState.isFullscreen) {
          canvasHUD.setParsing(true);
        }

        await new Promise((resolve, reject) => {
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
              modelState.status = 'ready';

              if (modelState.isFullscreen) {
                canvasHUD.complete();
                window.dispatchEvent(new Event('resize'));
              } else {
                const statusDot = document.getElementById('canvas-status-dot');
                if (statusDot) statusDot.className = 'status-dot active';
              }

              resolve(usdModel);
            },
            (error) => {
              console.error('Error parsing USDZ:', error);
              modelState.status = 'error';
              modelState.error = 'Failed to parse 3D CAD data.';
              if (modelState.isFullscreen) {
                canvasHUD.showError(
                  modelState.error,
                  () => startBackgroundLoad(),
                  () => startBackgroundLoad('cloud')
                );
              }
              reject(error);
            }
          );
        });
      } catch (loadErr) {
        console.error('Error loading CAD model:', loadErr);
        modelState.status = 'error';
        modelState.error = loadErr.message || 'Failed to download CAD assembly.';
        if (modelState.isFullscreen) {
          canvasHUD.showError(
            modelState.error,
            () => startBackgroundLoad(),
            () => startBackgroundLoad('cloud')
          );
        }
        throw loadErr;
      }
    })();

    return modelState.loadPromise;
  }

  // Kick off background model loading immediately (quiet, non-blocking)
  startBackgroundLoad();

  // 5. Fullscreen 3D Launch Experience Transitions
  function enterFullscreen3D() {
    const canvasWrapper = document.getElementById('gomikin-canvas-wrapper');
    if (!canvasWrapper) return;

    canvasWrapper.classList.add('fullscreen-mode');
    modelState.isFullscreen = true;

    const fullscreenText = document.getElementById('fullscreen-text');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    if (fullscreenText) fullscreenText.textContent = 'Exit Fullscreen';
    if (fullscreenIcon) fullscreenIcon.textContent = '✕';

    // Hide idle preview overlay in fullscreen
    canvasHUD.hideIdle();

    if (modelState.status === 'ready') {
      // Model is already ready! Reveal immediately
      canvasHUD.hideLoading();
      canvasHUD.hideError();
      controls.enabled = true;
    } else if (modelState.status === 'loading') {
      // Background download in progress: show fullscreen loading overlay with percentage only
      canvasHUD.showLoading();
      canvasHUD.setProgress(modelState.progress);
    } else if (modelState.status === 'parsing') {
      canvasHUD.showLoading();
      canvasHUD.setParsing(true);
    } else if (modelState.status === 'error') {
      canvasHUD.showError(
        modelState.error || 'Failed to load CAD assembly.',
        () => startBackgroundLoad(),
        () => startBackgroundLoad('cloud')
      );
    } else if (modelState.status === 'idle') {
      startBackgroundLoad();
      canvasHUD.showLoading();
    }

    window.dispatchEvent(new Event('resize'));
  }

  function exitFullscreen3D() {
    const canvasWrapper = document.getElementById('gomikin-canvas-wrapper');
    if (!canvasWrapper) return;

    canvasWrapper.classList.remove('fullscreen-mode');
    modelState.isFullscreen = false;

    const fullscreenText = document.getElementById('fullscreen-text');
    const fullscreenIcon = document.getElementById('fullscreen-icon');
    if (fullscreenText) fullscreenText.textContent = 'Fullscreen';
    if (fullscreenIcon) fullscreenIcon.textContent = '⛶';

    // If model is not ready, restore idle invitation in hero card
    if (modelState.status !== 'ready') {
      canvasHUD.showIdle();
      canvasHUD.hideLoading();
    }

    window.dispatchEvent(new Event('resize'));
  }

  window.enterFullscreen3D = enterFullscreen3D;
  window.exitFullscreen3D = exitFullscreen3D;

  // 6. Wire User Interactive Triggers
  const heroExploreBtn = document.getElementById('btn-hero-explore');
  const canvasExploreBtn = document.getElementById('btn-canvas-explore');
  const canvasIdleOverlay = document.getElementById('canvas-idle-overlay');
  const canvasFullscreenBtn = document.getElementById('btn-canvas-fullscreen');

  if (heroExploreBtn) {
    heroExploreBtn.addEventListener('click', enterFullscreen3D);
  }

  if (canvasExploreBtn) {
    canvasExploreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      enterFullscreen3D();
    });
  }

  if (canvasIdleOverlay) {
    canvasIdleOverlay.addEventListener('click', enterFullscreen3D);
  }

  if (canvasFullscreenBtn) {
    canvasFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modelState.isFullscreen) {
        exitFullscreen3D();
      } else {
        enterFullscreen3D();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modelState.isFullscreen) {
      exitFullscreen3D();
    }
  });

  // 7. Preserved Controllers & Legacy Infrastructure
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

  // 8. Unified Render Loop
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
