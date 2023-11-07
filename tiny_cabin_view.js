window.onload = function init() {
  const canvas = document.getElementById("gl-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setClearColor(0x000000, 0); // 투명 배경
  const scene = new THREE.Scene();
  scene.background = new THREE.CanvasTexture(generateGradientCanvas());

  camera = new THREE.PerspectiveCamera(
    75,
    canvas.width / canvas.height,
    0.1,
    1000
  );

  //camera.position.x = 7;
  camera.position.y = 10;
  camera.position.z = 10;

  // 빛을 생성합니다. (색상, 세기)
  const light = new THREE.PointLight(0xffffff, 3);
  light.position.set(1, 1, 1); // 빛의 위치를 조절합니다.
  scene.add(light); // 빛을 씬에 추가합니다.

  scene.add(new THREE.AmbientLight(0xdde4f0));

  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.enableRotate = true; //마우스로 움직이는거 함
  controls.enableZoom = false; //마우스로 확대축소 안함

  let cabin;
  let plane;

  const loader = new THREE.GLTFLoader();
  loader.load(
    "resources/map/map_ball.glb",
    function (gltf) {
      cabin = gltf.scene;
      cabin.scale.set(7, 7, 7);
      cabin.position.setY(-5);
      cabin.rotation.x = -0.5;

      scene.add(cabin);

      animate();
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  loader.load(
    "resources/paper_plane/scene.gltf",
    function (gltf) {
      plane = gltf.scene;

      plane.rotation.x = -36;
      plane.rotation.y = Math.PI / -2.6;
      plane.rotation.z = Math.PI / 3.5;

      plane.position.x = 30;
      plane.position.y = 10;
      plane.position.z = 15;
      camera.position.y = 12;
      camera.position.z = 13;

      scene.add(plane);

      animate();
      const interval = setInterval(() => {
        plane.position.x -= planeSpeed * 0.1;
        plane.position.y -= planeSpeed * 0.2;
        plane.position.z -= planeSpeed * 0.2;

        //console.log(plane.position.x);

        if (plane.position.x <= 0) {
          clearInterval(interval);
          scene.remove(plane);
        }
      }, 28);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  function animate() {
    controls.update();
    requestAnimationFrame(animate);
    //if (plane) { plane.rotation.y += 0.01; }

    renderer.render(scene, camera);
  }

  function generateGradientCanvas() {
    const dpi = window.devicePixelRatio || 1; // 현재 장치의 DPI를 가져옵니다.
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const canvas = document.createElement("canvas");
    canvas.width = screenWidth * dpi;
    canvas.height = screenHeight * dpi;

    const context = canvas.getContext("2d");
    context.scale(dpi, dpi); // 캔버스의 크기를 DPI에 맞게 확대합니다.

    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#e3f2ff");
    gradient.addColorStop(0.5, "#ede3ff");
    gradient.addColorStop(1, "#ffe3f9");

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgb(255, 255, 255)";

    return canvas;
  }

  const planeSpeed = 5.0;

  function handleMouseMove(event) {
    //event.preventDefault();

    if (cabin) {
      window.removeEventListener("click", handleMouseMove);

      setTimeout(function () {
        window.location.href = "./index.html"; // 새로운 페이지로 이동
      }, 1000); // 5000 밀리초 (5초) 지연
    }
  }

  function handleResize() {
    const canvas = document.getElementById("gl-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvas.width, canvas.height);
    scene.background = new THREE.CanvasTexture(generateGradientCanvas());
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("click", handleMouseMove);
};
