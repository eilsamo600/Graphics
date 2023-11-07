/**
 * Original code
 * https://github.com/simondevyoutube/
 */

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


class BasicCharacterController {
  constructor(params) {
    this._Init(params);
  }

  _Init(params) {
    this._params = params;
    this._decceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);
    this._acceleration = new THREE.Vector3(1, 0.25, 50.0);
    this._velocity = new THREE.Vector3(0, 0, 0);
    this.target = null;
    this._animations = {};
    this._LoadModels();
    this._input = new BasicCharacterControllerInput();
    this._stateMachine = new CharacterFSM(
      this._animations);


  }


  _LoadModels() {
    const loader = new GLTFLoader();
    loader.load('../resources/marshal/marshal.glb', (gltf) => {
      this.target = gltf.scene;

      this.target.position.set(0, 1, 0);
      this._params.scene.add(this.target);

      this._mixer = new THREE.AnimationMixer(this.target);
      const gltfAnimation = gltf.animations;

      gltfAnimation.forEach(animationClip => {
        const name = animationClip.name;
        this._animations[name] = animationClip;
        const animationAction = this._mixer.clipAction(animationClip);
        this._animations[name] = animationAction;
      });

      this._stateMachine.SetState('idle');
    });
  }

  Update(timeInSeconds, check) {
    if (this.target == null) {
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

    const controlObject = this.target;
    const _Q = new THREE.Quaternion();
    const _A = new THREE.Vector3();
    const _R = controlObject.quaternion.clone();

    const acc = this._acceleration.clone();

    if (this._input._keys.forward) {
      velocity.z += acc.z * timeInSeconds;
      if (check) {
        velocity.z = 0;
      }
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

    console.log(check);
    if (check == 1) {
      return;
    } else {
      controlObject.position.add(forward);
    }

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
    this._animations = null;
  }

  _AddState(name, type, animations) {
    this._states[name] = type;
    this._animations = animations;
  }

  SetState(name) {
    const prevState = this._currentState;
    const animations = this._animations;

    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }

    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState, animations);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
};


class CharacterFSM extends FiniteStateMachine {
  constructor(animations) {
    super();
    this._animations = animations;
    this._Init();
  }

  _Init() {
    this._AddState('idle', IdleState, this._animations);
    this._AddState('walk', WalkState, this._animations);
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

  changeAnimation(curAction, prevAction) {
    const previousAnimationAction = prevAction;
    this._currentAnimationAction = curAction;

    if (previousAnimationAction !== this._currentAnimationAction) {
      previousAnimationAction.fadeOut(0.5);
      this._currentAnimationAction.reset().fadeIn(0.5).play();
    }
  }
  Enter(prevState, animations) {
    const curAction = animations["walk01"];
    if (prevState) {
      const prevAction = animations["walk"];
      this.changeAnimation(curAction, prevAction)
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

  changeAnimation(idleAction, prevAction) {
    const previousAnimationAction = prevAction;
    this._currentAnimationAction = idleAction;

    if (previousAnimationAction !== this._currentAnimationAction) {
      previousAnimationAction.fadeOut(0.5);
      this._currentAnimationAction.reset().fadeIn(0.5).play();
    }
  }

  Enter(prevState, animations) {
    const idleAction = animations["walk"];
    if (prevState) {
      const prevAction = animations["walk01"];
      this.changeAnimation(idleAction, prevAction);
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

class ThirdPersonCamera {
  constructor(params) {
    this._params = params;
    this._camera = params.camera;

    this._currentPosition = new THREE.Vector3();
    this._currentLookat = new THREE.Vector3();
  }

  _CaculateIdealOffset(target) {
    const idealOffset = new THREE.Vector3(0, 10, -25);
    idealOffset.applyQuaternion(target.quaternion);
    idealOffset.add(target.position);
    return idealOffset;
  }

  _CaculateIdealLookat(target) {
    const idealLookat = new THREE.Vector3(0, 0, 15);
    idealLookat.applyQuaternion(target.quaternion);
    idealLookat.add(target.position);
    return idealLookat;
  }

  Update(timeElapsed, target) {
    const idealOffset = this._CaculateIdealOffset(target);
    const idealLookat = this._CaculateIdealLookat(target);

    this._currentPosition.copy(idealOffset);
    this._currentLookat.copy(idealLookat);

    this._camera.position.copy(this._currentPosition);
    this._camera.lookAt(this._currentLookat);
  }
}

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
    document.addEventListener('keydown', (e) => this._OnKeyDown(e), false);

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

    this._scene.background = new THREE.Color(0xFFFFFF);
    this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    this._scene.add(hemiLight);

    const listener = new THREE.AudioListener();
    this._scene.add(listener);

    const sound = new THREE.Audio(listener);

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./sounds/animal_crossing.ogg', (buffer) => {
      //const sound = new THREE.Audio(this._controls.listener);
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.2);
      sound.play();
    });


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

    this._CreateOrbitControls(); // 새로운 메서드 호출

    this._previousRAF = null;

    this._loadMap();
    this._LoadAnimatedModel();
    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
    });


    // 추가: R 키 눌렀을 때 카메라 전환 변수
    this._isOrbitCamera = false;

    this._RAF();

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

    loader.load('resources/map/ACmap.glb', (glb) => {
      this.model = glb.scene;

      this.model.position.set(-50, 0, 50);
      this.model.scale.set(15, 15, 15);
      this.model.rotation.set(0, 0, 0);

      this._scene.add(this.model);
    });
  }

  _LoadAnimatedModel() {
    const params = {
      camera: this._camera,
      scene: this._scene,
    }
    this._controls = new BasicCharacterController(params);

  }
  _CreateOrbitControls() {
    this._orbitControls = new OrbitControls(this._camera, this._threejs.domElement);
    this._orbitControls.enableDamping = true;
    this._orbitControls.dampingFactor = 0.05;
    this._orbitControls.screenSpacePanning = false;
    this._orbitControls.minDistance = 10;
    this._orbitControls.maxDistance = 50;
    this._orbitControls.maxPolarAngle = Math.PI / 2;
    this._orbitControls.target.set(0, 10, 0);

    // OrbitControls를 초기에 비활성화
    this._orbitControls.enabled = false;
  }

  _ToggleCameraMode() {
    this._isOrbitCamera = !this._isOrbitCamera;

    if (this._isOrbitCamera) {
      // Switch to OrbitControls and disable the third-person camera
      this._orbitControls.enabled = true;
      this.able = 1; // Add this method disable
    } else {
      // Switch back to third-person camera and disable OrbitControls
      this._orbitControls.enabled = false;
      this.able = 0;
      // this._thirdPersonCamera.Enable(); // Add this method enable
    }
  }

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    this.check = 0;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls.target != null) {
      //update thirdPersonCamera
      
      this._thirdPersonCamera.Update(timeElapsedS, this._controls.target);

      //ray for ground
      const raycaster = new THREE.Raycaster();
      const characterPosition = this._controls.target.position;
      raycaster.set(characterPosition, new THREE.Vector3(0, -1, 0));

      const intersections = raycaster.intersectObject(this.model);

      if (intersections.length > 0) {
        const collisionPoint = intersections[0].point;
        const distanceToGround = characterPosition.distanceTo(collisionPoint);

        const minDistance = 1;
        const maxDistance = 1;
        const clampedDistance = THREE.MathUtils.clamp(distanceToGround, minDistance, maxDistance);

        const targetHeight = characterPosition.y + (clampedDistance - distanceToGround);
        this._controls.target.position.y = targetHeight;

        // console.log('Clamped Distance to ground:', clampedDistance);
      } else {
        this._controls.target.position.y += 0.1;
      }

      //Ray for front and back
      const frontRaycaster = new THREE.Raycaster();
      const backRaycaster = new THREE.Raycaster();

      const frontRayDirection = new THREE.Vector3(0, 0, 1);
      frontRayDirection.applyQuaternion(this._controls.target.quaternion);

      const backRayDirection = new THREE.Vector3(0, 0, -1);
      backRayDirection.applyQuaternion(this._controls.target.quaternion);

      frontRaycaster.set(characterPosition, frontRayDirection);
      const frontIntersections = frontRaycaster.intersectObject(this.model);

      backRaycaster.set(characterPosition, backRayDirection);
      const backIntersections = backRaycaster.intersectObject(this.model);

      const minFrontDistance = 0.5;
      const maxBackDistance = 0.5;

      const oldPosition = new THREE.Vector3();
      oldPosition.copy(this._controls.target.position);

      if (frontIntersections.length > 0) {
        // 앞쪽에 장애물이 있을 경우
        const frontDistance = characterPosition.distanceTo(frontIntersections[0].point);
        console.log("앞에 거리:" + frontDistance);
        let oldPosition;
        if (frontDistance <= minFrontDistance) {
          // 앞으로 이동을 제한
          this.check = 1;
        }
      }

      // if (backIntersections.length > 0) {
      //   // 뒤쪽에 장애물이 있을 경우
      //   const backDistance = characterPosition.distanceTo(backIntersections[0].point);
      //   console.log("뒤에 거리:"+backDistance);
      //   if (backDistance <= maxBackDistance) {
      //     // 뒤로 이동을 제한
      //     this.check = 1;
      //   }
      // }

      if (this._isOrbitCamera) {
        this._orbitControls.update();
      }
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS, this.check);
    }


  }

  _OnKeyDown(event) {
    switch (event.keyCode) {
      case 82: // R
        this._ToggleCameraMode();
        break;
    }
  }

}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new AnimalCrossing();
});
