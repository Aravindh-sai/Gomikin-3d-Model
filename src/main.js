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
 * Manages loading telemetry and error handling:
 * - Percentage-only display with word "Loading" (strictly no "Downloading" and no MB/speed metrics)
 * - Fades out seamlessly when Three.js CAD scene is ready
 */
function initCanvasHUD() {
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
    showLoading: () => {
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

  // 1. Initialize Three.js Scene within canvas container (Canvas remains hidden pre-launch)
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

  // Initially disable OrbitControls so cursor interactions do not spin hidden studio
  controls.enabled = false;

  // 2. Initialize Canvas HUD Controller
  const canvasHUD = initCanvasHUD();

  // 3. Dismiss Minimal Skeleton Initialization Screen
  const initScreen = document.getElementById('gomikin-init-screen');
  if (initScreen) {
    setTimeout(() => {
      initScreen.classList.add('hidden');
      setTimeout(() => initScreen.remove(), 400);
    }, 100);
  }

  // 4. Model State & Background CAD Pre-Loading
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

              modelState.status = 'ready';

              if (modelState.isFullscreen) {
                // In fullscreen: reveal 3D canvas and enable OrbitControls
                const appCanvas = document.getElementById('app-canvas');
                if (appCanvas) {
                  appCanvas.style.display = 'block';
                  appCanvas.style.opacity = '1';
                }
                controls.enabled = true;
                const modularNav = document.getElementById('gomikin-modular-nav');
                if (modularNav) modularNav.style.display = 'flex';

                canvasHUD.complete();
                window.dispatchEvent(new Event('resize'));
              } else {
                // On landing page: Keep 3D canvas, controls, and dissect buttons strictly hidden!
                const appCanvas = document.getElementById('app-canvas');
                if (appCanvas) appCanvas.style.display = 'none';
                controls.enabled = false;
                const modularNav = document.getElementById('gomikin-modular-nav');
                if (modularNav) modularNav.style.display = 'none';
                const dissectBtn = document.getElementById('btn-dissect-gomikin');
                if (dissectBtn) dissectBtn.style.display = 'none';

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

  // 5. Cinematic Fullscreen Expansion & Exit Animation (FLIP-style shared element)
  let isAnimatingTransition = false;
  let placeholderEl = null;
  let initialRect = null;

  function launchCinematicFullscreen() {
    if (isAnimatingTransition || modelState.isFullscreen) return;
    isAnimatingTransition = true;

    const canvasWrapper = document.getElementById('gomikin-canvas-wrapper');
    const staticPreview = document.getElementById('static-product-preview');
    const fullscreenHeader = document.getElementById('fullscreen-header-bar');
    const appCanvas = document.getElementById('app-canvas');

    if (!canvasWrapper) {
      isAnimatingTransition = false;
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      canvasWrapper.classList.add('fullscreen-mode');
      document.body.classList.add('in-fullscreen-cad');
      if (staticPreview) staticPreview.style.display = 'none';
      if (fullscreenHeader) fullscreenHeader.style.display = 'flex';
      modelState.isFullscreen = true;

      if (modelState.status === 'ready') {
        if (appCanvas) appCanvas.style.display = 'block';
        controls.enabled = true;
        const modularNav = document.getElementById('gomikin-modular-nav');
        if (modularNav) modularNav.style.display = 'flex';
        canvasHUD.hideLoading();
      } else if (modelState.status === 'loading' || modelState.status === 'parsing') {
        canvasHUD.showLoading();
      } else if (modelState.status === 'error') {
        canvasHUD.showError(modelState.error || 'Failed to load CAD assembly.', () => startBackgroundLoad(), () => startBackgroundLoad('cloud'));
      }

      window.dispatchEvent(new Event('resize'));
      isAnimatingTransition = false;
      return;
    }

    // Normal Motion: Capture initial bounding rect
    initialRect = canvasWrapper.getBoundingClientRect();

    // Create placeholder in document flow to prevent layout shift
    if (!placeholderEl) {
      placeholderEl = document.createElement('div');
      placeholderEl.id = 'canvas-placeholder';
      placeholderEl.style.width = initialRect.width + 'px';
      placeholderEl.style.height = initialRect.height + 'px';
      placeholderEl.style.visibility = 'hidden';
      placeholderEl.style.pointerEvents = 'none';
      placeholderEl.style.flexShrink = '0';
      canvasWrapper.parentNode.insertBefore(placeholderEl, canvasWrapper);
    } else {
      placeholderEl.style.width = initialRect.width + 'px';
      placeholderEl.style.height = initialRect.height + 'px';
    }

    // Lock wrapper into fixed position at exact current coordinates
    canvasWrapper.style.position = 'fixed';
    canvasWrapper.style.top = initialRect.top + 'px';
    canvasWrapper.style.left = initialRect.left + 'px';
    canvasWrapper.style.width = initialRect.width + 'px';
    canvasWrapper.style.height = initialRect.height + 'px';
    canvasWrapper.style.margin = '0';
    canvasWrapper.style.zIndex = '9999';
    canvasWrapper.style.borderRadius = '18px';
    canvasWrapper.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.5)';
    canvasWrapper.style.transition = 'top 700ms cubic-bezier(0.16, 1, 0.3, 1), left 700ms cubic-bezier(0.16, 1, 0.3, 1), width 700ms cubic-bezier(0.16, 1, 0.3, 1), height 700ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 700ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 700ms cubic-bezier(0.16, 1, 0.3, 1)';

    // Fade surrounding landing page elements
    document.body.classList.add('cinematic-transitioning');
    if (staticPreview) {
      staticPreview.style.transition = 'opacity 350ms ease';
      staticPreview.style.opacity = '0';
    }

    // Force reflow
    void canvasWrapper.offsetHeight;

    // Animate to full viewport bounds
    canvasWrapper.style.top = '0px';
    canvasWrapper.style.left = '0px';
    canvasWrapper.style.width = '100vw';
    canvasWrapper.style.height = '100vh';
    canvasWrapper.style.borderRadius = '0px';
    canvasWrapper.style.boxShadow = 'none';

    setTimeout(() => {
      canvasWrapper.classList.add('fullscreen-mode');
      // Clear inline styles once class is applied
      canvasWrapper.style.position = '';
      canvasWrapper.style.top = '';
      canvasWrapper.style.left = '';
      canvasWrapper.style.width = '';
      canvasWrapper.style.height = '';
      canvasWrapper.style.margin = '';
      canvasWrapper.style.zIndex = '';
      canvasWrapper.style.borderRadius = '';
      canvasWrapper.style.boxShadow = '';
      canvasWrapper.style.transition = '';

      document.body.classList.remove('cinematic-transitioning');
      document.body.classList.add('in-fullscreen-cad');

      if (staticPreview) {
        staticPreview.style.display = 'none';
      }
      if (fullscreenHeader) {
        fullscreenHeader.style.display = 'flex';
      }

      modelState.isFullscreen = true;

      if (modelState.status === 'ready') {
        if (appCanvas) {
          appCanvas.style.display = 'block';
          appCanvas.style.opacity = '1';
        }
        controls.enabled = true;
        const modularNav = document.getElementById('gomikin-modular-nav');
        if (modularNav) modularNav.style.display = 'flex';
        const dissectBtn = document.getElementById('btn-dissect-gomikin');
        if (dissectBtn) dissectBtn.style.display = 'flex';
        canvasHUD.hideLoading();
      } else if (modelState.status === 'loading' || modelState.status === 'parsing') {
        canvasHUD.showLoading();
        if (modelState.status === 'parsing') {
          canvasHUD.setParsing(true);
        } else {
          canvasHUD.setProgress(modelState.progress);
        }
      } else if (modelState.status === 'error') {
        canvasHUD.showError(modelState.error || 'Failed to load CAD assembly.', () => startBackgroundLoad(), () => startBackgroundLoad('cloud'));
      }

      window.dispatchEvent(new Event('resize'));
      isAnimatingTransition = false;
    }, 700);
  }

  function exitCinematicFullscreen() {
    if (isAnimatingTransition || !modelState.isFullscreen) return;
    isAnimatingTransition = true;

    const canvasWrapper = document.getElementById('gomikin-canvas-wrapper');
    const staticPreview = document.getElementById('static-product-preview');
    const fullscreenHeader = document.getElementById('fullscreen-header-bar');
    const appCanvas = document.getElementById('app-canvas');
    const modularNav = document.getElementById('gomikin-modular-nav');

    if (!canvasWrapper) {
      isAnimatingTransition = false;
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      canvasWrapper.classList.remove('fullscreen-mode');
      document.body.classList.remove('in-fullscreen-cad');
      if (staticPreview) {
        staticPreview.style.display = 'flex';
        staticPreview.style.opacity = '1';
      }
      if (fullscreenHeader) fullscreenHeader.style.display = 'none';
      if (modularNav) modularNav.style.display = 'none';
      const dissectBtn = document.getElementById('btn-dissect-gomikin');
      if (dissectBtn) dissectBtn.style.display = 'none';
      const subNav = document.getElementById('gomikin-sub-nav');
      if (subNav) subNav.style.display = 'none';
      const flowConsole = document.getElementById('gomikin-flow-console');
      if (flowConsole) flowConsole.style.display = 'none';
      const partCard = document.getElementById('gomikin-part-card');
      if (partCard) partCard.style.display = 'none';
      if (appCanvas) appCanvas.style.display = 'none';
      controls.enabled = false;
      canvasHUD.hideLoading();
      if (placeholderEl && placeholderEl.parentNode) placeholderEl.remove();
      placeholderEl = null;
      modelState.isFullscreen = false;
      window.dispatchEvent(new Event('resize'));
      isAnimatingTransition = false;
      return;
    }

    // Normal Motion: Animate back to original bounds
    const targetRect = placeholderEl ? placeholderEl.getBoundingClientRect() : initialRect;

    // Hide fullscreen header, 3D navigation, and floating dissect controls immediately
    if (fullscreenHeader) fullscreenHeader.style.display = 'none';
    if (modularNav) modularNav.style.display = 'none';
    const dissectBtn = document.getElementById('btn-dissect-gomikin');
    if (dissectBtn) dissectBtn.style.display = 'none';
    const subNav = document.getElementById('gomikin-sub-nav');
    if (subNav) subNav.style.display = 'none';
    const flowConsole = document.getElementById('gomikin-flow-console');
    if (flowConsole) flowConsole.style.display = 'none';
    const partCard = document.getElementById('gomikin-part-card');
    if (partCard) partCard.style.display = 'none';
    canvasHUD.hideLoading();

    // Hide 3D canvas so it doesn't leak onto the landing page
    if (appCanvas) appCanvas.style.display = 'none';

    // Reveal static preview and fade it in
    if (staticPreview) {
      staticPreview.style.display = 'flex';
      staticPreview.style.opacity = '0';
      staticPreview.style.transition = 'opacity 500ms ease';
    }

    // Lock wrapper to fixed fullscreen coordinates
    canvasWrapper.classList.remove('fullscreen-mode');
    canvasWrapper.style.position = 'fixed';
    canvasWrapper.style.top = '0px';
    canvasWrapper.style.left = '0px';
    canvasWrapper.style.width = '100vw';
    canvasWrapper.style.height = '100vh';
    canvasWrapper.style.margin = '0';
    canvasWrapper.style.zIndex = '9999';
    canvasWrapper.style.borderRadius = '0px';
    canvasWrapper.style.transition = 'top 650ms cubic-bezier(0.16, 1, 0.3, 1), left 650ms cubic-bezier(0.16, 1, 0.3, 1), width 650ms cubic-bezier(0.16, 1, 0.3, 1), height 650ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 650ms cubic-bezier(0.16, 1, 0.3, 1)';

    // Bring back surrounding landing page elements
    document.body.classList.remove('in-fullscreen-cad');
    document.body.classList.add('cinematic-transitioning');

    // Force reflow
    void canvasWrapper.offsetHeight;

    // Animate wrapper back to original card dimensions
    canvasWrapper.style.top = (targetRect ? targetRect.top : 100) + 'px';
    canvasWrapper.style.left = (targetRect ? targetRect.left : 100) + 'px';
    canvasWrapper.style.width = (targetRect ? targetRect.width : 500) + 'px';
    canvasWrapper.style.height = (targetRect ? targetRect.height : 500) + 'px';
    canvasWrapper.style.borderRadius = '18px';

    if (staticPreview) {
      staticPreview.style.opacity = '1';
    }

    setTimeout(() => {
      // Clear inline styles
      canvasWrapper.style.position = '';
      canvasWrapper.style.top = '';
      canvasWrapper.style.left = '';
      canvasWrapper.style.width = '';
      canvasWrapper.style.height = '';
      canvasWrapper.style.margin = '';
      canvasWrapper.style.zIndex = '';
      canvasWrapper.style.borderRadius = '';
      canvasWrapper.style.transition = '';

      document.body.classList.remove('cinematic-transitioning');

      if (placeholderEl && placeholderEl.parentNode) {
        placeholderEl.remove();
        placeholderEl = null;
      }

      modelState.isFullscreen = false;
      controls.enabled = false;

      window.dispatchEvent(new Event('resize'));
      isAnimatingTransition = false;
    }, 650);
  }

  window.launchCinematicFullscreen = launchCinematicFullscreen;
  window.exitCinematicFullscreen = exitCinematicFullscreen;

  // 6. Wire User Interactive Triggers
  const heroExploreBtn = document.getElementById('btn-hero-explore');
  const canvasExploreBtn = document.getElementById('btn-canvas-explore');
  const staticProductPreview = document.getElementById('static-product-preview');
  const canvasFullscreenBtn = document.getElementById('btn-canvas-fullscreen');

  if (heroExploreBtn) {
    heroExploreBtn.addEventListener('click', launchCinematicFullscreen);
  }

  if (canvasExploreBtn) {
    canvasExploreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      launchCinematicFullscreen();
    });
  }

  if (staticProductPreview) {
    staticProductPreview.addEventListener('click', launchCinematicFullscreen);
  }

  if (canvasFullscreenBtn) {
    canvasFullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (modelState.isFullscreen) {
        exitCinematicFullscreen();
      } else {
        launchCinematicFullscreen();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modelState.isFullscreen) {
      exitCinematicFullscreen();
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

    // Only render scene if model is ready and in fullscreen (or if user requested)
    if (modelState.isFullscreen && modelState.status === 'ready') {
      controls.update();
      renderer.render(scene, camera);
    }
  }

  animate();
}

init();
