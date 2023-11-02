import * as THREE from '../node_modules/three/build/three.module.js'
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js"

const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;

const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;

class BasicCharacterControllerProxy {
  constructor(animations) {
    this._animations = animations;
  }

  get animations() {
    return this._animations;
  }
};


class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);

    this._animations = {};

    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
      new BasicCharacterControllerProxy(this._animations));

    this._LoadModels();
  }


  _LoadModels() {
    const loader = new GLTFLoader();
    loader.load('../resources/marshal/marshal.glb', (gltf) => {

      this._target = gltf.scene;
      this._target .position.set(0, 1, 0);
      this._params.scene.add(this._target);

      const mixer = new THREE.AnimationMixer(this._target);   
      const gltfAnimation = gltf.animations;
      const animationMap = {};

      gltfAnimation.forEach(animationClip => {
        const name = animationClip.name;
        console.log(name);
        animationMap[name] = animationClip;
        
        const animationAction = mixer.clipAction(animationClip);
        animationMap[name] = animationAction;
      });

      this._animationMap = animationMap;
      this._mixer = mixer;

      
      // this._stateMachine.SetState('idle');
      console.log(this._animationMap);
      this._currentAnimationAction = this._animationMap["walk01"];
      this._currentAnimationAction.play();

    });
  }

  Update(timeInSeconds) {
    if (!this._target) {
      return;
    }

    this._stateMachine.Update(timeInSeconds, this._input);

    const velocity = this._velocity;
    const frameDecceleration = new THREE.Vector3(
      velocity.x * this._decceleration.x,
      velocity.y * this._decceleration.y,
      velocity.z * this._decceleration.z
    );
    frameDecceleration.multiplyScalar(timeInSeconds);
    frameDecceleration.z = Math.sign(frameDecceleration.z) * Math.min(
      Math.abs(frameDecceleration.z), Math.abs(velocity.z));

    velocity.add(frameDecceleration);

    const controlObject = this._target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
    }
    if (this._input._keys.backward) {
      velocity.z -= acc.z * timeInSeconds;
    }
    if (this._input._keys.left) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }
    if (this._input._keys.right) {
      _A.set(0, 1, 0);
      _Q.setFromAxisAngle(_A, 4.0 * -Math.PI * timeInSeconds * this._acceleration.y);
      _R.multiply(_Q);
    }

    controlObject.quaternion.copy(_R);

    const oldPosition = new THREE.Vector3();
    oldPosition.copy(controlObject.position);

    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyQuaternion(controlObject.quaternion);
    forward.normalize();

    const sideways = new THREE.Vector3(1, 0, 0);
    sideways.applyQuaternion(controlObject.quaternion);
    sideways.normalize();

    sideways.multiplyScalar(velocity.x * timeInSeconds);
    forward.multiplyScalar(velocity.z * timeInSeconds);

    controlObject.position.add(forward);
    controlObject.position.add(sideways);

    oldPosition.copy(controlObject.position);

    if (this._mixer) {
      this._mixer.update(timeInSeconds);
    }
  }
};

class BasicCharacterControllerInput {
  constructor() {
    this._Init();
  }

  _Init() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    document.addEventListener('keydown', (e) => this._onKeyDown(e), false);
    document.addEventListener('keyup', (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = true;
        break;
      case 65: // a
        this._keys.left = true;
        break;
      case 83: // s
        this._keys.backward = true;
        break;
      case 68: // d
        this._keys.right = true;
        break;
    }
  }

  _onKeyUp(event) {
    switch (event.keyCode) {
      case 87: // w
        this._keys.forward = false;
        break;
      case 65: // a
        this._keys.left = false;
        break;
      case 83: // s
        this._keys.backward = false;
        break;
      case 68: // d
        this._keys.right = false;
        break;
    }
  }
}

class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }

  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(proxy) {
    super();
    this._proxy = proxy;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState);
    this._AddState('walk', WalkState);
  }
};


class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() { }
  Exit() { }
  Update() { }
};



class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'walk';
  }

  Enter(prevState) {
    console.log("WalkState로 진입");
    const curAction = this._animationMap["walk"].play();
    console.log(curAction);
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;

      curAction.enabled = true;

      curAction.time = 0.0;
      curAction.setEffectiveTimeScale(1.0);
      curAction.setEffectiveWeight(1.0);

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {
  }

  Update(timeElapsed, input) {
    if (input._keys.forward || input._keys.backward) {
      return;
    }

    this._parent.SetState('idle');
  }
};



class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return 'idle';
  }

  Enter(prevState) {
    console.log("지금 idle");
    console.log(this._parent._proxy._animations);
    const idleAction = this._animationMap["walk"];
    idleAction.play
    if (prevState) {
      const prevAction = this._parent._proxy._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {
  }

  Update(_, input) {
    if (input._keys.forward || input._keys.backward) {
      this._parent.SetState('walk');
    }
  }
};


class AnimalCrossing {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.outputEncoding = THREE.sRGBEncoding;
    this._threejs.gammaFactor = 2.2;
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);
    this._threejs.domElement.id = 'threejs';

    document.getElementById('container').appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);


    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(25, 10, 25);

    this._scene = new THREE.Scene();

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 10, 0);
    controls.update();

    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    const uniforms = {
      "topColor": { value: new THREE.Color(0x0077ff) },
      "bottomColor": { value: new THREE.Color(0xffffff) },
      "offset": { value: 33 },
      "exponent": { value: 0.6 }
    };
    uniforms["topColor"].value.copy(hemiLight.color);

    this._scene.fog.color.copy(uniforms["bottomColor"].value);

    const skyGeo = new THREE.SphereGeometry(1000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: _VS,
      fragmentShader: _FS,
      side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this._scene.add(sky);

    this._previousRAF = null;
    this._RAF();
    this._LoadAnimatedModel();
    this._loadMap();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame((t) => {
      if (this._previousRAF === null) {
        this._previousRAF = t;
      }

      this._RAF();

      this._threejs.render(this._scene, this._camera);
      this._Step(t - this._previousRAF);
      this._previousRAF = t;
    });
  }

  _loadMap() {
    const loader = new GLTFLoader();
    // Load the GLTF model
    loader.load('resources/animal_crossing_map/scene.gltf', (gltf) => {
      const model = gltf.scene;

      // Adjust the position, scale, or rotation as needed
      model.position.set(-50, 0, 50);
      model.scale.set(100, 100, 100);
      model.rotation.set(0, 0, 0);

      // Add the model to the scene
      this._scene.add(model);
    });
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    }
    this._controls = new BasicCharacterController(params);
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }
  }

}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new AnimalCrossing();
});
