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

  // Test loading Fusion 360 USDZ model
  const usdLoader = new USDLoader();
  usdLoader.load(
    'Gomikin/gomikin_disection.usdz',
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

      // Mount Modern Glassmorphism Modular Control Bar & Workflow Sim Dock
      initModularControlBar({
        moduleViewController,
        physicalFlowController,
        dissectionAnimationController: gomikinAnimation.controller
      });
    },
    (progress) => {
      if (progress.total) {
        console.log(`Loading USDZ: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
      }
    },
    (error) => {
      console.error('Error loading USDZ:', error);
    }
  );

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

    // Update Dissection Animation System
    if (window.gomikinAnimation && window.gomikinAnimation.controller) {
      window.gomikinAnimation.controller.update(deltaTime);
    }

    // Update Modular View Controller
    if (window.moduleViewController) {
      window.moduleViewController.update(deltaTime);
    }

    // Update Physical Flow Controller
    if (window.physicalFlowController) {
      window.physicalFlowController.update(deltaTime);
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

