import './style.css';
import * as THREE from 'three';
import { initScene } from './scene/scene.js';
import { createHousing } from './components/housing.js';
import { DemoController } from './interaction/demoController.js';
import { initUI } from './ui/demoUI.js';

function init() {
  const canvas = document.querySelector('#app-canvas');
  const { scene, camera, renderer, controls } = initScene(canvas);

  // Main Gomikin Group
  const gomikin = new THREE.Group();
  gomikin.name = 'Gomikin';

  // Add Housing
  const housing = createHousing();
  gomikin.add(housing);

  scene.add(gomikin);

  // Initialize Interaction Controller
  const demoController = new DemoController(gomikin, camera, controls);
  
  // Expose it to the global window object so the future UI can easily hook into it
  window.demoController = demoController;

  // Initialize UI
  initUI();

  const clock = new THREE.Clock();

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    
    // Update the controller for continuous animations (if any are active)
    demoController.update(deltaTime);
    
    controls.update();
    renderer.render(scene, camera);
  }

  animate();
}

init();
