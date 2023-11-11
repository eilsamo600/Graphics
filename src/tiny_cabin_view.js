import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';

class App {
  constructor() {
    this.init();
  }

  init() {
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.CanvasTexture(this.generateGradientCanvas());

    this.fov = 60;
    this.aspect = window.innerWidth / window.innerHeight; // Fix aspect ratio
    this.near = 1.0;
    this.far = 1000.0;

    this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
    this.camera.position.set(25, 10, 25);

    this.addLights();
    this.addCabin();
    this.addPlane();

    this.controls = new OrbitControls(this.camera, this._threejs.domElement);
    this.controls.enableRotate = true;
    this.controls.enableZoom = false;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('click', this.handleMouseMove);

    this.animate();
  }

  _OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  addLights() {
    const light = new THREE.PointLight(0xffffff, 2);
    light.position.set(1, 1, 1);
    this.scene.add(light);

    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this.scene.add(hemiLight);

    this.scene.add(new THREE.AmbientLight(0x303030, 8));
  }

  addCabin() {
    const loader = new GLTFLoader();
    loader.load(
      'resources/map/map_ball.glb',
      (gltf) => {
        this.cabin = gltf.scene;
        this.cabin.scale.set(9, 9, 9);
        this.cabin.position.setY(-5);
        this.cabin.rotation.x = -0.5;

        this.scene.add(this.cabin);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
  }

  addPlane() {
    const loader = new GLTFLoader();
    const planeSpeed = 5.0;

    loader.load(
      'resources/paper_plane/scene.gltf',
      (gltf) => {
        this.plane = gltf.scene;
        this.plane.rotation.x = -36;
        this.plane.rotation.y = Math.PI / -2.6;
        this.plane.rotation.z = Math.PI / 3.5;
        this.plane.position.x = 30;
        this.plane.position.y = 10;
        this.plane.position.z = 15;
        this.camera.position.y = 12;
        this.camera.position.z = 13;

        this.scene.add(this.plane);

        const interval = setInterval(() => {
          this.plane.position.x -= planeSpeed * 0.1;
          this.plane.position.y -= planeSpeed * 0.2;
          this.plane.position.z -= planeSpeed * 0.2;

          if (this.plane.position.x <= 0) {
            clearInterval(interval);
            this.scene.remove(this.plane);
          }
        }, 28);
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );
  }

  animate() {
    this.controls.update();
    requestAnimationFrame(() => this.animate());
    this._threejs.render(this.scene, this.camera);
  }

  generateGradientCanvas() {
    const dpi = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const canvas = document.createElement('canvas');
    canvas.width = screenWidth * dpi;
    canvas.height = screenHeight * dpi;

    const context = canvas.getContext('2d');
    context.scale(dpi, dpi);

    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#e3f2ff');
    gradient.addColorStop(0.5, '#ede3ff');
    gradient.addColorStop(1, '#ffe3f9');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'rgb(255, 255, 255)';

    return canvas;
  }

  handleMouseMove(event) {
    // Your mouse move logic here
  }

  handleResize() {
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

window.onload = function () {
  new App();
};
