import * as THREE from 'three';
import { setupCamera } from './camera.js';
import { setupLighting } from './lighting.js';

export function initScene(canvasElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0d); // Dark industrial background

  const renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true });

  const getContainerDimensions = () => {
    const parent = canvasElement.parentElement;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      return { width: parent.clientWidth, height: parent.clientHeight };
    }
    return { width: window.innerWidth, height: window.innerHeight };
  };

  const initialDims = getContainerDimensions();
  renderer.setSize(initialDims.width, initialDims.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const { camera, controls } = setupCamera(renderer);
  camera.aspect = initialDims.width / initialDims.height;
  camera.updateProjectionMatrix();

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

  // Dynamic Resize Handler for responsive container or window resize
  const handleResize = () => {
    const dims = getContainerDimensions();
    if (dims.width > 0 && dims.height > 0) {
      camera.aspect = dims.width / dims.height;
      camera.updateProjectionMatrix();
      renderer.setSize(dims.width, dims.height);
    }
  };

  window.addEventListener('resize', handleResize);
  if (typeof ResizeObserver !== 'undefined' && canvasElement.parentElement) {
    const ro = new ResizeObserver(handleResize);
    ro.observe(canvasElement.parentElement);
  }

  return { scene, camera, renderer, controls };
}
