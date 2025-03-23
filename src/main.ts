import { Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, Scene, Mesh, Material, MeshLambertMaterial } from 'three';
import { MapControls } from 'three/examples/jsm/Addons.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PRNG } from './random.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import * as THREE from "three";

const spawnRange = 10000;
const count = 1000000;

const random = new PRNG(10000);
const main = new Main();
const camera = new PerspectiveCameraAuto(40, 0.1, 2000).translateZ(100).translateY(20);

const scene = new THREE.Scene();

// Add missing properties, even if they're undefined or null for now
(scene as any).continuousRaycasting = undefined;
(scene as any).continuousRaycastingDropTarget = undefined;
(scene as any).intersections = undefined;
(scene as any).intersectionsDropTarget = undefined;

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2.1;

const loader = new GLTFLoader();

const loadGLBModel = (path) => {
  return new Promise((resolve, reject) => {
    loader.load(path, (gltf) => {
      if (gltf.scene.children.length > 0) {
        resolve(gltf.scene.children[0]);
      } else {
        reject('Model does not contain any meshes.');
      }
    }, undefined, reject);
  });
};

// Load GLB models for LOD
const models = await Promise.all([
  loadGLBModel('/models/lod-high.glb'),
  loadGLBModel('/models/lod-medium.glb'),
  loadGLBModel('/models/lod-low.glb'),
]);

const modelHigh = models[0];  // High LOD model
const modelMedium = models[1]; // Medium LOD model
const modelLow = models[2];    // Low LOD model

// Fixed sizes for each LOD model
const sizeHigh = 1.0;
const sizeMedium = 0.5;
const sizeLow = 0.2;

// Function to apply the size to a model
const applySize = (model, size) => {
  model.scale.set(size, size, size);
};

// Apply size to each model
applySize(modelHigh, sizeHigh);
applySize(modelMedium, sizeMedium);
applySize(modelLow, sizeLow);

if (modelHigh && (modelHigh as THREE.Mesh).geometry) {
  const defaultMaterial = new MeshLambertMaterial({ color: 'green' });

  const instancedMesh = new InstancedMesh2(main.renderer, count, (modelHigh as THREE.Mesh).geometry, defaultMaterial);


  // Use different models for each LOD
  instancedMesh.addLOD((modelHigh as THREE.Mesh).geometry.clone(), new MeshLambertMaterial({ color: 'green' }), 100);  // LOD 100
  instancedMesh.addLOD((modelMedium as THREE.Mesh).geometry.clone(), new MeshLambertMaterial({ color: 'red' }), 200); // LOD 500
  instancedMesh.addLOD((modelLow as THREE.Mesh).geometry.clone(), new MeshLambertMaterial({ color: 'yellow' }), 300);   // LOD 1500
  

  instancedMesh.updateInstances((object, index) => {
    object.position.x = random.range(-spawnRange, spawnRange);
    object.position.z = random.range(-spawnRange, spawnRange);
  });

  instancedMesh.computeBVH();
  scene.add(camera, instancedMesh);
} else {
  console.error('Loaded GLB model does not have geometry or material.');
}

scene.add(new AmbientLight('white', 0.3));

const dirLight = new DirectionalLight('white', 2).translateZ(100).translateY(20);
camera.add(dirLight, dirLight.target);

main.createView({ scene, camera, enabled: false });

// const gui = new GUI();
// gui
//   .add(camera, 'far', 2000, 5000, 100)
//   .name('camera far')
//   .onChange(() => camera.updateProjectionMatrix());

// document.getElementById('loading').remove();
