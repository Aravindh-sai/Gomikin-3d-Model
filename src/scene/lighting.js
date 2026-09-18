import * as THREE from 'three';

export function setupLighting(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  keyLight.position.set(4, 6, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.bias = -0.001;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xaaccff, 0.5);
  fillLight.position.set(-4, 3, 4);
  scene.add(fillLight);
  
  const rimLight = new THREE.DirectionalLight(0xaaccff, 0.8);
  rimLight.position.set(0, 5, -6);
  scene.add(rimLight);
}
