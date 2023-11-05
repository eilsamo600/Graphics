let canvas; // 캔버스 엘리먼트를 변수로 선언합니다.
let context; // 캔버스 컨텍스트를 변수로 선언합니다.

window.onload = function init() {

	const canvas = document.getElementById("gl-canvas");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.width, canvas.height);

	const scene = new THREE.Scene();
	scene.background = new THREE.CanvasTexture(generateGradientCanvas());


	camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);

	//camera.position.x = 7;
	camera.position.y = 10;
	camera.position.z = 10;

	// 빛을 생성합니다. (색상, 세기)
	const light = new THREE.PointLight(0xFFFFFF, 1);
	light.position.set(-30, 4, -10); // 빛의 위치를 조절합니다.
	scene.add(light); // 빛을 씬에 추가합니다.

	scene.add(new THREE.AmbientLight(0xdde4f0));

	const controls = new THREE.OrbitControls(camera, renderer.domElement);

	controls.enableRotate = false; //마우스로 움직이는거 안함
	controls.enableZoom = false; //마우스로 확대축소 안함
<<<<<<< Updated upstream
	let plane
=======

	// create an AudioListener and add it to the camera
	const listener = new THREE.AudioListener();
	camera.add(listener);

	// create the PositionalAudio object (passing in the listener)
	const sound = new THREE.Audio(listener);

	// load a sound and set it as the PositionalAudio object's buffer
	const audioLoader = new THREE.AudioLoader();
	audioLoader.load('sounds/Swoosh.ogg', function (buffer) {
		sound.setBuffer(buffer);
		//sound.setRefDistance(20);
		//sound.setLoop(true);
		sound.setVolume(0.2); // Corrected typo here
		//sound.play();
	});

>>>>>>> Stashed changes
	const loader = new THREE.GLTFLoader();
	loader.load('resources/paper_plane/scene.gltf', function (gltf) {
		plane = gltf.scene;

		plane.rotation.x = 1.1;
		plane.rotation.y = Math.PI / -2.0;
		plane.rotation.z = Math.PI / 2.5;

		scene.add(plane);

		animate();
	}, undefined, function (error) {
		console.error(error);
	});

	function animate() {
		controls.update();
		requestAnimationFrame(animate);
		//if (plane) { plane.rotation.y += 0.01; }

		renderer.render(scene, camera);
	}

	// 그라데이션 텍스처를 생성하는 함수
	function generateGradientCanvas() {
		const canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = 256;

		const context = canvas.getContext("2d");

		const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
		gradient.addColorStop(0, '#e3f2ff');
		gradient.addColorStop(0.5, '#ede3ff');
		gradient.addColorStop(1, '#ffe3f9');

		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = "16px Arial";
		context.fillStyle = "rgb(255, 255, 255)";
		const text = "Click the screen to start";
		const textWidth = context.measureText(text).width;
		const textX = (canvas.width - textWidth) / 2;
		const textY = canvas.height / 4;
		context.fillText(text, textX, textY);
		return canvas;
	}

	const planeSpeed = 5.0;
	let isSoundPlaying = true;

	function handleMouseMove(event) {
		event.preventDefault();
		if (event.buttons == 1 && plane) {
			sound.play();
			isSoundPlaying = false;
		}

		// 마우스로 클릭한 상태인 경우 비행기의 위치를 변경
		if (event.buttons == 1 && plane) {
			const canvas = document.createElement("canvas");
			const context = canvas.getContext("2d");
			context.clearRect(0, 0, canvas.width, canvas.height);
			const interval1StartTime = Date.now();

			const interval1 = setInterval(() => {
				// 비행기를 왼쪽으로 빠르게 이동시킴
				plane.position.x -= planeSpeed * 0.3;

				//console.log(plane.position.y);

				// plane.position.x가 원하는 위치에 도달하면 interval을 종료
				if (plane.position.x <= -37) {
					clearInterval(interval1);
					const interval1EndTime = Date.now() + 1000;
					const interval1Duration = interval1EndTime - interval1StartTime;
					setTimeout(() => {
						startSecondInterval();
						isSoundPlaying = true; // 소리 재생 상태를 다시 true로 설정하여 다음 소리 재생을 가능하게 합니다.
					}, interval1Duration);
				}
			}, 23);
		}
	}


	function startSecondInterval() {
		plane.rotation.y = Math.PI / 1.7;
		plane.rotation.z = Math.PI / -2.5;
		plane.position.x = -27
		plane.position.y -= 3;
		plane.position.z += 15;
		camera.position.y = 12;
		camera.position.z = 13;

		const interval2 = setInterval(() => {

			plane.position.x += planeSpeed * 0.3;
			plane.position.y += planeSpeed * 0.02;
			plane.position.z -= planeSpeed * 0.2;

			sound.play();

			//console.log(plane.position.x);

<<<<<<< Updated upstream
			// plane.position.x가 원하는 위치에 도달하면 interval을 종료
			if (plane.position.x >= 120) {
=======
			if (plane.position.x >= 80) {
>>>>>>> Stashed changes
				clearInterval(interval2);
			}
		}, 23);
	}


	// 마우스 이벤트를 감지하고 위의 함수를 호출
	window.addEventListener('mousemove', handleMouseMove);


}

