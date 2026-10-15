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
import { ResilientModelLoader, DEFAULT_MODEL_CONFIG } from './utils/resilientModelLoader.js';

function createLoadingHUD() {
  const overlay = document.createElement('div');
  overlay.id = 'gomikin-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: radial-gradient(circle at center, rgba(17, 24, 39, 0.94) 0%, rgba(10, 10, 13, 0.98) 100%);
    backdrop-filter: blur(16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    transition: opacity 0.5s ease;
  `;
  overlay.innerHTML = `
    <div style="font-size: 34px; margin-bottom: 6px; filter: drop-shadow(0 0 12px rgba(0,255,204,0.4));">🏛️</div>
    <div style="font-size: 15px; font-weight: 800; letter-spacing: 2px; color: #00ffcc; margin-bottom: 6px; text-transform: uppercase;">GOMIKIN 3D CAD MODEL</div>
    <div id="loading-source-badge" style="font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 12px; background: rgba(56,189,248,0.12); border: 1px solid rgba(56,189,248,0.3); color: #38bdf8; margin-bottom: 10px; transition: all 0.3s ease;">
      Locating CAD Archive...
    </div>
    <div id="loading-status-text" style="font-size: 12px; color: #94a3b8; margin-bottom: 14px; max-width: 380px; text-align: center; min-height: 16px;">
      Loading CAD Model Assembly...
    </div>
    <div style="width: 260px; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 8px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);">
      <div id="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ffcc, #00b4d8); transition: width 0.15s ease; box-shadow: 0 0 8px rgba(0,255,204,0.6);"></div>
    </div>
    <div style="width: 260px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
      <span id="loading-size-text" style="color: #64748b;">0 MB / 268 MB</span>
      <span id="loading-percent-text" style="font-weight: 700; color: #38bdf8;">0%</span>
      <span id="loading-speed-text" style="color: #64748b;">-- MB/s</span>
    </div>
    <div id="loading-error-box" style="display: none; margin-top: 14px; text-align: center; max-width: 320px;">
      <div id="loading-error-msg" style="color: #ef4444; font-size: 12px; margin-bottom: 10px; line-height: 1.4;">Failed to load CAD assembly. Check network connection.</div>
      <div style="display: flex; gap: 8px; justify-content: center;">
        <button id="loading-retry-btn" style="background: rgba(0,255,204,0.18); border: 1px solid #00ffcc; color: #00ffcc; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer;">Retry Load</button>
        <button id="loading-force-cloud-btn" style="background: rgba(56,189,248,0.18); border: 1px solid #38bdf8; color: #38bdf8; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: 600; cursor: pointer;">Force Cloud</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  return {
    setSource: (label, id) => {
      const badge = document.getElementById('loading-source-badge');
      if (badge) {
        let icon = '📁';
        if (id === 'vercel-blob') icon = '☁️';
        if (id === 'cache') icon = '⚡';
        badge.textContent = `${icon} ${label}`;
        if (id === 'cache') {
          badge.style.color = '#a855f7';
          badge.style.borderColor = 'rgba(168,85,247,0.4)';
          badge.style.background = 'rgba(168,85,247,0.15)';
        } else if (id === 'vercel-blob') {
          badge.style.color = '#38bdf8';
          badge.style.borderColor = 'rgba(56,189,248,0.4)';
          badge.style.background = 'rgba(56,189,248,0.15)';
        } else {
          badge.style.color = '#00ffcc';
          badge.style.borderColor = 'rgba(0,255,204,0.4)';
          badge.style.background = 'rgba(0,255,204,0.15)';
        }
      }
    },
    setStatus: (text) => {
      const txt = document.getElementById('loading-status-text');
      if (txt) txt.textContent = text;
    },
    setProgress: (pct, loaded = 0, total = 0, speedMBps = 0, etaSeconds = 0) => {
      const p = Math.min(100, Math.max(0, pct));
      const bar = document.getElementById('loading-progress-bar');
      const pctTxt = document.getElementById('loading-percent-text');
      const sizeTxt = document.getElementById('loading-size-text');
      const speedTxt = document.getElementById('loading-speed-text');

      if (bar) bar.style.width = `${p.toFixed(0)}%`;
      if (pctTxt) pctTxt.textContent = `${p.toFixed(0)}%`;

      if (sizeTxt && total > 0) {
        const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (total / (1024 * 1024)).toFixed(1);
        sizeTxt.textContent = `${loadedMB} / ${totalMB} MB`;
      }

      if (speedTxt) {
        if (speedMBps > 0) {
          const etaStr = etaSeconds > 0 ? `ETA: ${etaSeconds}s` : '';
          speedTxt.textContent = `${speedMBps.toFixed(1)} MB/s${etaStr ? ` • ${etaStr}` : ''}`;
        } else {
          speedTxt.textContent = '';
        }
      }
    },
    setParsing: (isParsing) => {
      const bar = document.getElementById('loading-progress-bar');
      if (bar && isParsing) {
        bar.style.width = '100%';
        bar.style.background = 'linear-gradient(90deg, #38bdf8, #a855f7, #00ffcc)';
        bar.style.backgroundSize = '200% 100%';
        bar.style.animation = 'pulse 1.5s infinite';
      }
    },
    showError: (errMsg, onRetry, onForceCloud) => {
      const errBox = document.getElementById('loading-error-box');
      const errTxt = document.getElementById('loading-error-msg');
      const statusTxt = document.getElementById('loading-status-text');
      const pctTxt = document.getElementById('loading-percent-text');
      const speedTxt = document.getElementById('loading-speed-text');

      if (errBox) errBox.style.display = 'block';
      if (errTxt && errMsg) errTxt.textContent = errMsg;
      if (statusTxt) statusTxt.textContent = 'Load Error';
      if (pctTxt) pctTxt.textContent = '';
      if (speedTxt) speedTxt.textContent = '';

      const retryBtn = document.getElementById('loading-retry-btn');
      if (retryBtn) retryBtn.onclick = onRetry;

      const cloudBtn = document.getElementById('loading-force-cloud-btn');
      if (cloudBtn) {
        cloudBtn.onclick = onForceCloud || onRetry;
      }
    },
    complete: () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }
  };
}

function init() {
  const canvas = document.querySelector('#app-canvas');
  const { scene, camera, renderer, controls } = initScene(canvas);

  // 1. Master Physical Envelope (Phase 1 Baseline Parametric Envelope)
  const gomikinEnvelope = createGomikinEnvelope();
  gomikinEnvelope.visible = false; // Preserved intact, hidden to display loaded USDZ model
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

  // Create loading HUD
  const loadingHUD = createLoadingHUD();

  async function loadUSDZ(forcedSource = null) {
    // Reset error box state on new attempt
    const errBox = document.getElementById('loading-error-box');
    if (errBox) errBox.style.display = 'none';

    try {
      const loaderConfig = {};
      if (forcedSource === 'cloud') {
        loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => !s.isLocal);
      } else if (forcedSource === 'local') {
        loaderConfig.sources = DEFAULT_MODEL_CONFIG.sources.filter(s => s.isLocal);
      }

      const modelLoader = new ResilientModelLoader(loaderConfig);

      const buffer = await modelLoader.loadModelBuffer({
        onStatus: (statusText) => {
          loadingHUD.setStatus(statusText);
        },
        onProgress: (progress) => {
          if (progress.sourceLabel) {
            loadingHUD.setSource(progress.sourceLabel, progress.sourceId);
          }
          loadingHUD.setProgress(
            progress.percent,
            progress.loaded,
            progress.total,
            progress.speedMBps,
            progress.etaSeconds
          );
        }
      });

      loadingHUD.setStatus('Decompressing USDZ archive & assembling 3D CAD meshes...');
      loadingHUD.setParsing(true);

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

          loadingHUD.complete();
        },
        (error) => {
          console.error('Error parsing USDZ:', error);
          loadingHUD.showError(
            'Failed to parse 3D CAD data.',
            () => loadUSDZ(),
            () => loadUSDZ('cloud')
          );
        }
      );
    } catch (loadErr) {
      console.error('Error loading CAD model:', loadErr);
      loadingHUD.showError(
        loadErr.message || 'Failed to download CAD assembly.',
        () => loadUSDZ(),
        () => loadUSDZ('cloud')
      );
    }
  }

  loadUSDZ();

  // Initialize Objective 1 Static Inspection Controller & Workflow Controller
  const inspectionController = new InspectionController(gomikinEnvelope, camera, controls);
  const workflowController = new WorkflowController(gomikinEnvelope, scene);
  window.inspectionController = inspectionController;
  window.workflowController = workflowController;

  // Initialize Unified Right-Side Inspection Console (Preserved underlying functionality, hidden for clean Dissection Experience)
  const unifiedUI = initUnifiedInspectionUI(gomikinEnvelope, inspectionController, workflowController, camera, controls);
  window.unifiedUI = unifiedUI;
  const rightPanel = document.getElementById('gomikin-right-panel');
  if (rightPanel) {
    rightPanel.style.display = 'none';
  }

  // 2. Preserved Legacy Components (kept intact, hidden to focus on Master Envelope)
  const gomikin = new THREE.Group();
  gomikin.name = 'LegacyGomikin';
  const housing = createHousing();
  housing.visible = false; // Preserved without deleting code
  gomikin.add(housing);
  gomikin.visible = false;
  scene.add(gomikin);

  // Preserved DemoController
  const demoController = new DemoController(gomikin, camera, controls);
  window.demoController = demoController;

  // Preserved Legacy UI (hidden for clean inspection console)
  initUI();
  const legacyUI = document.getElementById('gomikin-ui');
  const legacyToggleBtn = document.getElementById('ui-toggle-btn');
  if (legacyUI) legacyUI.style.display = 'none';
  if (legacyToggleBtn) legacyToggleBtn.style.display = 'none';

  const clock = new THREE.Clock();

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = Math.min(clock.getDelta(), 0.1);

    // Authoritative coordinator updates active view and camera interpolation
    if (window.viewCoordinator) {
      window.viewCoordinator.update(deltaTime);
    } else {
      // Fallback before model is loaded
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

    // Update Workflow controller
    if (workflowController) {
      workflowController.update(deltaTime);
    }

    // Update the legacy controller for continuous animations (if any are active)
    if (demoController) {
      demoController.update(deltaTime);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();

