window.onload = function init() {
  const canvas = document.getElementById("gl-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(canvas.width, canvas.height);
  renderer.setClearColor(0x000000, 0); // 투명 배경
  const scene = new THREE.Scene();
  scene.background = new THREE.CanvasTexture(generateGradientCanvas());

  const fov = 60;
  const aspect = 1920 / 1080;
  const near = 1.0;
  const far = 1000.0;

  camera = new THREE.PerspectiveCamera(
    fov,
    aspect,
    near,
    far
  );

  camera.position.set(25, 10, 25);

  // 빛을 생성합니다. (색상, 세기)
  const light = new THREE.PointLight(0xffffff, 2);
  light.position.set(1, 1, 1); // 빛의 위치를 조절합니다.
  scene.add(light); // 빛을 씬에 추가합니다.
  const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);

  scene.add(hemiLight)

  const uniforms = {
    "topColor": { value: new THREE.Color(0x0077ff) },
    "bottomColor": { value: new THREE.Color(0xffffff) },
    "offset": { value: 33 },
    "exponent": { value: 0.6 }
  };
  uniforms["topColor"].value.copy(hemiLight.color);

  // 빛을 생성합니다. (색상, 세기)
  // const light = new THREE.PointLight(0xffffff, 3);
  // light.position.set(1, 1, 1); // 빛의 위치를 조절합니다.
  // scene.add(light); // 빛을 씬에 추가합니다.

  scene.add(new THREE.AmbientLight(0x303030 , 8));

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
      cabin.scale.set(9, 9, 9);
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
  const planeSpeed = 5.0;

  // controls.target.copy(cabin.position);

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

  const zoomSpeed = 1.5;

  function handleMouseMove(event) {
    camera.position.x = 0;
    camera.position.y = 10;
    camera.position.z = 10;


    const interval = setInterval(() => {
      camera.position.y -= zoomSpeed * 0.55;
      camera.position.z -= zoomSpeed * 0.2;
      cabin.rotation.x += 0.08;


      console.log(camera.position.y);
      //console.log(camera.position.z);
      //console.log(cabin.rotation.x);


      if (camera.position.y < -9) {
        clearInterval(interval);
        //scene.remove(camera);
      }
    }, 40);

    //menuClick('/index.html');
    if (cabin) {
      window.removeEventListener("click", handleMouseMove);

      setTimeout(function () {
        //window.location.href = "./index.html"; // 새로운 페이지로 이동

        movePage('. /index.html');
      }, 1000); // 5000 밀리초 (5초) 지연
    }
  }

  function movePage(url) {
    // if (url == '/tiny_cabin_view') {
    //   location.reload(true);
    //   return;
    // }
    var ajaxOption = {
      url: url,
      async: true,
      type: "POST",
      dataType: "html",
      cache: false
    };

    $.ajax(ajaxOption).done(function (data) {
      // Contents 영역 삭제
      $('#bodyContents').children().remove();
      // Contents 영역 교체
      $('#bodyContents').html(data);
    });
  };


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
