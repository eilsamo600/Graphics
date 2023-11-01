import * as THREE from './node_modules/three/build/three.module.js'
import { OrbitControls } from "./node_modules/three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js"

class App {
    constructor() {
        const divContainer = document.querySelector("#webgl-container");
        this._divContainer = divContainer;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        divContainer.appendChild(renderer.domElement);

        this._renderer = renderer;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        this._scene = scene;

        this._setupCamera();
        this._setupLight();
        this._setupModel();
        this._setupControls();

        window.onresize = this.resize.bind(this);
        this.resize();

        requestAnimationFrame(this.render.bind(this));
    }

    _setupControls() {
        new OrbitControls(this._camera, this._divContainer);
    }

    changeAnimation(animationName) {
        const previousAnimationAction = this._currentAnimationAction;
        this._currentAnimationAction = this._animationsMap[animationName];

        if(previousAnimationAction !== this._currentAnimationAction) {
            previousAnimationAction.fadeOut(0.5);
            this._currentAnimationAction.reset().fadeIn(0.5).play();
        }
    }
    
    _setupAnimation(gltf){
        const model = gltf.scene;
        const mixer = new THREE.AnimationMixer(model);
        const gltfAnimation = gltf.animations;
        const domControls = document.querySelector("#controls");
        const animationMap = {};

        gltfAnimation.forEach(animationClip => {
            const name = animationClip.name;
            console.log(name);

            const domButton = document.createElement("div");
            domButton.classList.add('button');
            domButton.innerText = name;
            domControls.appendChild(domButton);
            this._animationsMap = animationMap;
            
            domButton.addEventListener("click", () => {
                const animationName = domButton.innerHTML;
                console.log(animationName);
                this.changeAnimation(animationName);
            });

            const animationAction = mixer.clipAction(animationClip);
            animationMap[name] = animationAction;
        });

        this._mixer = mixer;
        this._animationMap = animationMap;
        this._currentAnimationAction = this._animationMap["walk"];
        this._currentAnimationAction.play();
    }

    _setupModel() {

        new GLTFLoader().load("./resources/marshal/marshal.glb" , (gltf) => {
            const model = gltf.scene;
            this._scene.add(model);

            this._setupAnimation(gltf);
        });
    }

    _setupCamera() {
        const camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            100
        );

        camera.position.z = 8;
        this._camera = camera;
    }

    _setupLight() {
        const color = 0xffffff;
        const intensity = 3;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 1);
        this._scene.add(light);
    }

    update(time) {
        time *= 0.001; // second unit

        if(this._mixer) {
            const deltaTime = time - this._previousTime;
            this._mixer.update(deltaTime);
        }

        this._previousTime = time;
    }

    render(time) {
        this._renderer.render(this._scene, this._camera);   
        this.update(time);

        requestAnimationFrame(this.render.bind(this));
    }

    resize() {
        const width = this._divContainer.clientWidth;
        const height = this._divContainer.clientHeight;

        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
        
        this._renderer.setSize(width, height);
    }
}

window.onload = function () {
    new App();
}