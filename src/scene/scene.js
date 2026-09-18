import * as THREE from 'three';
import { setupCamera } from './camera.js';
import { setupLighting } from './lighting.js';

export function initScene(canvasElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0d); // Dark industrial background

  const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const { camera, controls } = setupCamera(renderer);
  setupLighting(scene);

  // Subtle dark ground plane
  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshStandardMaterial({ 
    color: 0x050508, 
    roughness: 0.8,
    metalness: 0.2,
    depthWrite: false 
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  
  // Very subtle grid
  const grid = new THREE.GridHelper(50, 100, 0x111118, 0x111118);
  grid.material.opacity = 0.4;
  grid.material.transparent = true;
  
  scene.add(ground);
  scene.add(grid);

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls };
}
