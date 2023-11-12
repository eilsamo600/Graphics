
window.onload = function init() {

	const canvas = document.getElementById("gl-canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let hasMouseClickExecuted = false;
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.width, canvas.height);
	renderer.setClearColor(0x000000, 0); // 투명 배경
	const scene = new THREE.Scene();
	this.check = 1;
	scene.background = new THREE.CanvasTexture(generateGradientCanvas(this.check));

	const textContainer = document.getElementById("text-container");


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

	let plane

	// create an AudioListener and add it to the camera
	const listener = new THREE.AudioListener();
	camera.add(listener);

	// create the PositionalAudio object (passing in the listener)
	const sound = new THREE.Audio(listener);

	// load a sound and set it as the PositionalAudio object's buffer
	const audioLoader = new THREE.AudioLoader();
	audioLoader.load('sounds/Swoosh.ogg', function (buffer) {
		sound.setBuffer(buffer);
		sound.setVolume(0.2);
	});

	const loader = new THREE.GLTFLoader();

	loader.load(
		"resources/map/map_ball.glb",
		function (gltf) {
			cabin = gltf.scene;
			cabin.scale.set(11, 11, 11);
			cabin.position.setY(-4);
			//plane.rotation.y = 1;

			scene.add(cabin);
			if (this.cabin) {
				this.cabin.visible = !this.cabin.visible;
			}

			//animate();
		},
		undefined,
		function (error) {
			console.error(error);
		}
	);

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
	function generateGradientCanvas(check) {
		// let text = "";
		// if (check) {
		// 	text = "Click the screen to start";
		// }

		const dpi = window.devicePixelRatio || 1;
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		const canvas = document.createElement("canvas");
		canvas.width = screenWidth * dpi;
		canvas.height = screenHeight * dpi;

		const context = canvas.getContext("2d");
		context.scale(dpi, dpi);

		const gradient = context.createLinearGradient(0, 0, screenWidth, screenHeight);
		gradient.addColorStop(0, '#e3f2ff');
		gradient.addColorStop(0.5, '#ede3ff');
		gradient.addColorStop(1, '#ffe3f9');

		context.fillStyle = gradient;
		context.fillRect(0, 0, screenWidth, screenHeight);

		return canvas;
	}



	const planeSpeed = 5.0;
	let isSoundPlaying = true;

	function handleMouseClick(event) {


		if (!hasMouseClickExecuted && plane) {
			hasMouseClickExecuted = true;

			sound.play();

			isSoundPlaying = false;
			// 마우스 이벤트 리스너 제거
			window.removeEventListener('click', handleMouseClick);

			const interval1StartTime = Date.now();

			const interval1 = setInterval(() => {
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

			if (plane) {


				// 5초 후에 페이지 이동
				// setTimeout(function () {
				// 	window.location.href = "./tiny_cabin_view.html"; // 새로운 페이지로 이동
				// }, 4500); // 5000 밀리초 (5초) 지연
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


				if (isSoundPlaying == true & plane.position.x == -25.5) {
					sound.pause();
					sound.play();
					isSoundPlaying = false; // 소리를 한 번만 재생하도록 변수 값을 변경합니다.
				}

				plane.position.x += planeSpeed * 0.3;
				plane.position.y += planeSpeed * 0.02;
				plane.position.z -= planeSpeed * 0.2;

				//console.log(plane.position.x);

				if (plane.position.x >= 120) {
					clearInterval(interval2);
					if (this.cabin) {
						this.cabin.visible = !this.cabin.visible;
						console.log("cabin");

						// Change 'const' to 'let'
						let fov = 60;
						let aspect = 1920 / 1080;
						let near = 1.0;
						let far = 1000.0;

						// Also changing 'camera' to 'let'
						let camera = new THREE.PerspectiveCamera(
							fov,
							aspect,
							near,
							far
						);
						camera.position.set(25, 10, 25);

						const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
						hemiLight.color.setHSL(0.6, 1, 0.6);
						hemiLight.groundColor.setHSL(0.095, 1, 0.75);

						scene.add(hemiLight);

						const hlight = new THREE.AmbientLight(0x404040, 1);
						scene.add(hlight);

						const uniforms = {
							"topColor": { value: new THREE.Color(0x0077ff) },
							"bottomColor": { value: new THREE.Color(0xffffff) },
							"offset": { value: 33 },
							"exponent": { value: 0.6 }
						};
						uniforms["topColor"].value.copy(hemiLight.color);

						// 빛을 생성합니다. (색상, 세기)
						let light = new THREE.PointLight(0x002fff, 3);
						light.position.set(1, 0, 1); // 빛의 위치를 조절합니다.
						scene.add(light); // 빛을 씬에 추가합니다.

						scene.add(new THREE.AmbientLight(0x303030, 9));

						//controls = new THREE.OrbitControls(camera, renderer.domElement);
						//const controls2 = new MapControls( camera, renderer.domElement );
						controls.enableDamping = true;

						controls.enableRotate = true; //마우스로 움직이는거 함
						controls.enableZoom = true; //마우스로 확대축소 함


					}
				}

			}, 23);

		}


		// 마우스 이벤트를 감지하고 위의 함수를 호출


	}
	function handleResize() {
		const canvas = document.getElementById("gl-canvas");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		camera.aspect = canvas.width / canvas.height;
		camera.updateProjectionMatrix();

		renderer.setSize(canvas.width, canvas.height);
		scene.background = new THREE.CanvasTexture(generateGradientCanvas(check));

	}
	const zoomSpeed = 1.5;
	function handleMouseMove() {
		camera.position.x = 0;
		camera.position.y = 10;
		camera.position.z = 10;


		const interval = setInterval(() => {
			camera.position.y -= zoomSpeed * 0.55;
			camera.position.z -= zoomSpeed * 0.2;
			cabin.rotation.x += 0.08;


			// console.log(camera.position.y);
			//console.log(camera.position.z);
			//console.log(cabin.rotation.x);


			if (camera.position.y < -9) {
				clearInterval(interval);
				//scene.remove(camera);
			}
		}, 40);

		if (cabin) {
			window.removeEventListener("dblclick", handleMouseMove);

			setTimeout(function () {
				window.location.href = "/index.html"; // 새로운 페이지로 이동

			}, 1000); // 5000 밀리초 (5초) 지연
		}
	}

	window.addEventListener('resize', handleResize);
	window.addEventListener("dblclick", handleMouseMove);
	window.addEventListener('click', () => {
		this.check = 0;
		// Call your function when the mouse is released
		scene.background = new THREE.CanvasTexture(generateGradientCanvas(check));
		textContainer.style.display = "none";
		console.log('click');
		handleMouseClick();

	});



}


