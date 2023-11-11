import * as THREE from '../node_modules/three/build/three.module.js';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../node_modules/three/examples/jsm/controls/OrbitControls.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.gammaFactor = 2.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.id = 'threejs';
    document.getElementById('container').appendChild(this.renderer.domElement);

    // Window resize event
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    this.hasMouseClickExecuted = false;
    this.check = 1;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.CanvasTexture(this.generateGradientCanvas(this.check));

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.y = 10;
    this.camera.position.z = 10;

    this.addLights();
    this.addPlane();
    this.addEventListeners();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.enableZoom = false;

    this.animate();
  }

  addLights() {
    const light = new THREE.PointLight(0xFFFFFF, 1);
    light.position.set(-30, 4, -10);
    this.scene.add(light);

    this.scene.add(new THREE.AmbientLight(0xdde4f0));
  }

  addPlane() {
    this.audioSetup();

    let plane;

    const loader = new GLTFLoader();
    loader.load('resources/paper_plane/scene.gltf', (gltf) => {
      plane = gltf.scene;

      plane.rotation.x = 1.1;
      plane.rotation.y = Math.PI / -2.0;
      plane.rotation.z = Math.PI / 2.5;

      this.scene.add(plane);
    }, undefined, (error) => {
      console.error(error);
    });
  }

  audioSetup() {
    const listener = new THREE.AudioListener();
    this.camera.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('sounds/Swoosh.ogg', (buffer) => {
      sound.setBuffer(buffer);
      sound.setVolume(0.2);
    });

    this.sound = sound;
  }

  animate() {
    this.controls.update();
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  generateGradientCanvas(check) {
    let text = '';
    if (check) {
      text = 'Click the screen to start';
    }

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

    const fontSize = canvas.width / (text.length * 1.8);
    context.font = fontSize + 'px Arial';
    context.fillStyle = 'rgb(255, 255, 255)';

    context.textAlign = 'end';
    context.textBaseline = 'end';

    const textMetrics = context.measureText(text);
    const textWidth = textMetrics.width;

    const textX = (canvas.width - textWidth) / 2;
    const textY = canvas.height / 8;

    context.fillText(text, textX, textY);

    return canvas;
  }

  handleMouseClick() {
    if (!this.hasMouseClickExecuted && this.sound) {
      this.hasMouseClickExecuted = true;

      this.sound.play();


    }
  }

  addEventListeners() {
    window.addEventListener('resize', () => {
      this._OnWindowResize();
    });

    window.addEventListener('click', () => {
      this.check = 0;
      this.scene.background = new THREE.CanvasTexture(this.generateGradientCanvas(this.check));
      this.handleMouseClick();
    });
  }

  _OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.scene.background = new THREE.CanvasTexture(this.generateGradientCanvas(this.check));
  }
}

window.onload = function () {
  new App();
};
