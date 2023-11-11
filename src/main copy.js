/**
 * Original code
 * https://github.com/simondevyoutube/
 */

import * as THREE from '../node_modules/three/build/three.module.js'
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js"


class paper1{
  constructor() {
    this._Initialize();
  }

  _Initialize() {
   // Renderer
   this._threejs = new THREE.WebGLRenderer({ antialias: true });
   this._threejs.outputEncoding = THREE.sRGBEncoding;
   this._threejs.gammaFactor = 2.2;
   this._threejs.shadowMap.enabled = true;
   this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
   this._threejs.setPixelRatio(window.devicePixelRatio);
   this._threejs.setSize(window.innerWidth, window.innerHeight);
   this._threejs.domElement.id = 'threejs';
   document.getElementById('container').appendChild(this._threejs.domElement);

   // Window resize event
   window.addEventListener('resize', () => {
     this._OnWindowResize();
   }, false);

    // Camera
    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    // Scene
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color('#4682b4');

    // Light
    const light = new THREE.PointLight(0xFFFFFF, 1);
    light.position.set(-30, 4, -10);
    this._scene.add(light);

    // Ambient Light
    this._scene.add(new THREE.AmbientLight(0xdde4f0));

    this._controls = new OrbitControls(this._camera, this._threejs.domElement);

    const cubeGeometry = new THREE.BoxGeometry(5, 5, 5);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this._scene.add(cubeMesh);


    // Animation loop
    this.animate();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }
  animate() {
    this._controls.update();
    requestAnimationFrame(() => this.animate());
    this._threejs.render(this._scene, this._camera);
  }

  

}
  // window.addEventListener('resize', handleResize);
let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new paper1();
});



