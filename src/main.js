/**
 * Original code
 * https://github.com/simondevyoutube/
 */

import * as THREE from '../node_modules/three/build/three.module.js'
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js"
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js"
import {ExtrudeGeometry, Shape, Vector2} from "three";

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

  Update(timeInSeconds) {
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
    // I made idle action name as walk and real walk aniation name "walk01"
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

/* 안쓸 예정
class PrismGeometry extends THREE.ExtrudeGeometry {
  constructor(vertices, height) {
      const shape = new THREE.Shape();

      (function f(ctx) {
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertices.length; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.lineTo(vertices[0].x, vertices[0].y);
      })(shape);

      const settings = {
          amount: height,
          bevelEnabled: false,
      };

      super(shape, settings);
  }
}*/

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

    const prismVertices = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(20, 0),
      new THREE.Vector2(20, 20),
    ];
    
    const prismHeight = 2; // Set the desired height
    const prismGeometry = new PrismGeometry(prismVertices, prismHeight);
    
    const prismMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const prismMesh = new THREE.Mesh(prismGeometry, prismMaterial);
    prismMesh.position.set(41, 1, -28.3); // Set the position
    // rotation left 90 degree
    prismMesh.rotateY(Math.PI / 2); // Rotate 90 degrees counterclockwise (left)

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this._scene.add(sky);

    this._previousRAF = null;

    this._loadMap();
    this._LoadAnimatedModel();
    this._thirdPersonCamera = new ThirdPersonCamera({
      camera: this._camera,
    });
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

    loader.load('resources/animal_crossing_map/scene.gltf', (gltf) => {
      this.model = gltf.scene;

      this.model.position.set(-50, 0, 50);
      this.model.scale.set(100, 100, 100);
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

  _Step(timeElapsed) {
    const timeElapsedS = timeElapsed * 0.001;
    if (this._mixers) {
      this._mixers.map(m => m.update(timeElapsedS));
    }

    if (this._controls) {
      this._controls.Update(timeElapsedS);
    }

    if (this._controls.target != null) {
      this._thirdPersonCamera.Update(timeElapsedS, this._controls.target);
      const raycaster = new THREE.Raycaster();
      const characterPosition = this._controls.target.position;
      raycaster.set(characterPosition, new THREE.Vector3(0, -1, 0)); // Cast a ray downward

      // Check for intersections with the map mesh
      const intersections = raycaster.intersectObject(this.model);

      console.log(intersections);

      if (intersections.length > 0) {
        const collisionPoint = intersections[0].point;
        const distanceToGround = characterPosition.distanceTo(collisionPoint);

        // Clamping distanceToGround between 1 and 2
        const minDistance = 1;
        const maxDistance = 1;
        const clampedDistance = THREE.MathUtils.clamp(distanceToGround, minDistance, maxDistance);

        // Adjust the character's height to stay within the range
        const targetHeight = characterPosition.y + (clampedDistance - distanceToGround);
        this._controls.target.position.y = targetHeight;

        console.log('Clamped Distance to ground:', clampedDistance);
      } else {
        // No intersections, move the character up by 0.1 units
        this._controls.target.position.y += 0.1;
      }

    const frontRaycaster = new THREE.Raycaster();
    const backRaycaster = new THREE.Raycaster();

    // 레이 방향 설정
    const frontRayDirection = new THREE.Vector3(0, 0, 1); // 캐릭터의 앞쪽 방향
    const backRayDirection = new THREE.Vector3(0, 0, -1); // 캐릭터의 뒤쪽 방향

    // Raycaster를 설정하고 교차점을 얻습니다.
    frontRaycaster.set(characterPosition, frontRayDirection);
    const frontIntersections = frontRaycaster.intersectObject(this.model);

    backRaycaster.set(characterPosition, backRayDirection);
    const backIntersections = backRaycaster.intersectObject(this.model);

    // 이동 가능한 최소 및 최대 거리 설정
    const minFrontDistance = 0.1; // 캐릭터와 맵 사이 최소 거리
    const maxBackDistance = 0.5; // 뒤로 이동 가능한 최대 거리

    if (frontIntersections.length > 0) {
      // 앞쪽에 장애물이 있을 경우
      const frontDistance = characterPosition.distanceTo(frontIntersections[0].point);

      if (frontDistance <= minFrontDistance) {
        // 앞으로 이동을 제한
        // 캐릭터의 이동 로직 추가
      }
    }

    if (backIntersections.length > 0) {
      // 뒤쪽에 장애물이 있을 경우
      const backDistance = characterPosition.distanceTo(backIntersections[0].point);

      if (backDistance >= maxBackDistance) {
        // 뒤로 이동을 제한
        // 캐릭터의 이동 로직 추가
      }
    }
    }

    

  }

}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new AnimalCrossing();
});

// 오르막 좌표 x= 41, y = 1, z = -28.3
// 방향 -3.14 , 0 , -3.14

// 도착지 x = 41, y = 3, z = -45
// 방향 -3.14 , 1.361 , -3.14