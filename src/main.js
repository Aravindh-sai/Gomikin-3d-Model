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

function createLoadingHUD() {
  const overlay = document.createElement('div');
  overlay.id = 'gomikin-loading-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(10, 10, 13, 0.92);
    backdrop-filter: blur(12px);
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
    <div style="font-size: 32px; margin-bottom: 8px;">🏛️</div>
    <div style="font-size: 15px; font-weight: 700; letter-spacing: 1.5px; color: #00ffcc; margin-bottom: 4px;">GOMIKIN 3D CAD MODEL</div>
    <div id="loading-status-text" style="font-size: 12px; color: #94a3b8; margin-bottom: 16px;">Loading CAD Model Assembly...</div>
    <div style="width: 220px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
      <div id="loading-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ffcc, #00b4d8); transition: width 0.15s ease;"></div>
    </div>
    <div id="loading-percent-text" style="font-size: 11px; font-weight: 600; color: #38bdf8;">0%</div>
    <div id="loading-error-box" style="display: none; margin-top: 14px; text-align: center;">
      <div style="color: #ef4444; font-size: 12px; margin-bottom: 10px;">Failed to load CAD assembly. Check network connection.</div>
      <button id="loading-retry-btn" style="background: rgba(0,255,204,0.2); border: 1px solid #00ffcc; color: #00ffcc; border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer;">Retry Load</button>
    </div>
  `;
  document.body.appendChild(overlay);
  return {
    setProgress: (pct) => {
      const p = Math.min(100, Math.max(0, pct));
      const bar = document.getElementById('loading-progress-bar');
      const txt = document.getElementById('loading-percent-text');
      if (bar) bar.style.width = `${p.toFixed(0)}%`;
      if (txt) txt.textContent = `${p.toFixed(0)}%`;
    },
    showError: (onRetry) => {
      const errBox = document.getElementById('loading-error-box');
      const statusTxt = document.getElementById('loading-status-text');
      const pctTxt = document.getElementById('loading-percent-text');
      if (errBox) errBox.style.display = 'block';
      if (statusTxt) statusTxt.textContent = 'Load Error';
      if (pctTxt) pctTxt.textContent = '';
      const retryBtn = document.getElementById('loading-retry-btn');
      if (retryBtn) retryBtn.onclick = onRetry;
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

  function loadUSDZ() {
    const usdLoader = new USDLoader();
    usdLoader.load(
      'https://eqvmxwue8iejzeky.public.blob.vercel-storage.com/gomikin_disection.usdz',
      (usdModel) => {
        usdModel.name = 'Fusion360_USDZ_Model';
        scene.add(usdModel);
        window.usdModel = usdModel;
        console.log('USDZ model loaded successfully:', usdModel);

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
      (progress) => {
        if (progress.total) {
          const pct = (progress.loaded / progress.total) * 100;
          loadingHUD.setProgress(pct);
          console.log(`Loading USDZ: ${pct.toFixed(1)}%`);
        }
      },
      (error) => {
        console.error('Error loading USDZ:', error);
        loadingHUD.showError(() => loadUSDZ());
      }
    );
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

