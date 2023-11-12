
window.onload = function init() {

	const canvas = document.getElementById("gl-canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let hasMouseClickExecuted = false;
	const renderer = new THREE.WebGLRenderer({ canvas });
	renderer.setSize(canvas.width, canvas.height);
	renderer.setClearColor(0x000000, 0); // Transparent background
	const scene = new THREE.Scene();
	this.check = 1;
	scene.background = new THREE.CanvasTexture(generateGradientCanvas(this.check));

	const textContainer = document.getElementById("text-container");


	camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);

	camera.position.y = 10;
	camera.position.z = 10;

	// Create light (color, intensity)
	const light1 = new THREE.PointLight(0xFFFFFF, 1);
	light1.position.set(-30, 4, -10); // Adjust light position
	scene.add(light1); // Add light to the scene

	scene.add(new THREE.AmbientLight(0xdde4f0));

	const controls = new THREE.OrbitControls(camera, renderer.domElement);

	controls.enableRotate = false; // Disables mouse rotation
	controls.enableZoom = false; // Disables zooming

	let plane;

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

	/*
		Load the cabin model and add it to the scene
	*/

	loader.load(
		"resources/map/map_ball.glb",
		function (gltf) {
			cabin = gltf.scene;
			cabin.scale.set(7, 7, 7);
			cabin.position.setY(-2);

			scene.add(cabin);
			if (this.cabin) {
				this.cabin.visible = !this.cabin.visible;
			}
		},
		undefined,
		function (error) {
			console.error(error);
		}
	);

	/*
		Load the paper_plane model and add it to the scene
	*/
	loader.load('resources/paper_plane/scene.gltf', function (gltf) {
		plane = gltf.scene;

		plane.rotation.x = 1.1;
		plane.rotation.y = Math.PI / -2.0;
		plane.rotation.z = -5;

		scene.add(plane);

		animate();
	}, undefined, function (error) {
		console.error(error);
	});

	let time = 0;
	/*
		Description: Animates the scene. Make the plane rotate.
		Param: noting.
		Returns: noting.
	*/
	function animate() {
		controls.update();
		requestAnimationFrame(animate);

		plane.rotation.z = -100;
		plane.rotation.x = Math.sin(time) * 0.4;
		renderer.render(scene, camera);

		time += 0.045; // Control the rotation speed of the plane
	}



	/*
		Description: Generates a gradient canvas based on the screen size and a specific check value.
		Param: A value used to determine the gradient.
		Returns: {HTMLCanvasElement} - The canvas with a generated gradient.
	*/
	function generateGradientCanvas(check) {

		// Determine the screen properties
		const dpi = window.devicePixelRatio || 1;
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		// Create a canvas element
		const canvas = document.createElement("canvas");
		canvas.width = screenWidth * dpi;
		canvas.height = screenHeight * dpi;

		const context = canvas.getContext("2d");
		context.scale(dpi, dpi);

		// Define a linear gradient across the canvas
		const gradient = context.createLinearGradient(0, 0, screenWidth, screenHeight);
		gradient.addColorStop(0.8, '#e1f5fc');
		gradient.addColorStop(0, '#dff3f7');
		gradient.addColorStop(0.4, '#d1e6ff');
		gradient.addColorStop(1, '#ffe3f9');

		context.fillStyle = gradient;
		context.fillRect(0, 0, screenWidth, screenHeight);

		return canvas;
	}

	const planeSpeed = 5.0;
	let isSoundPlaying = true;

	/*
		Description: Handles the mouse click event.
		Param: {MouseEvent} - The mouse click event.
		Returns: noting.
	*/
	function handleMouseClick(event) {

		if (!hasMouseClickExecuted && plane) {
			hasMouseClickExecuted = true;

			sound.play();

			isSoundPlaying = false;
			// remove mouse click event listener
			window.removeEventListener('click', handleMouseClick);

			const interval1StartTime = Date.now();

			const interval1 = setInterval(() => {
				plane.position.x -= planeSpeed * 0.3;

				// If the plane's x-position reaches the desired location, the interval stops
				if (plane.position.x <= -37) {
					clearInterval(interval1);
					const interval1EndTime = Date.now() + 1000;
					const interval1Duration = interval1EndTime - interval1StartTime;
					setTimeout(() => {

						startSecondInterval();
						// Resetting the sound playback state to true enables the next sound to play
						isSoundPlaying = true;
					}, interval1Duration);

				}
			}, 23);



		}

		/*
			Description: Handles the second interval.
			Param: noting.
			Returns: noting.
		*/
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
					isSoundPlaying = false; // Altering the variable value to ensure the sound plays only once.
				}

				plane.position.x += planeSpeed * 0.3;
				plane.position.y += planeSpeed * 0.02;
				plane.position.z -= planeSpeed * 0.2;

				if (plane.position.x >= 120) {
					clearInterval(interval2);

					// Change cabin visibility to true
					if (this.cabin) {
						this.cabin.visible = !this.cabin.visible;

						scene.remove(plane);

						let fov = 60;
						let aspect = 1920 / 1080;
						let near = 1.0;
						let far = 1000.0;

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


						const uniforms = {
							"topColor": { value: new THREE.Color(0x0077ff) },
							"bottomColor": { value: new THREE.Color(0xffffff) },
							"offset": { value: 33 },
							"exponent": { value: 0.6 }
						};
						uniforms["topColor"].value.copy(hemiLight.color);

						// Create light (color, intensity)
						const light = new THREE.PointLight(0x002fff, 3);
						light.position.set(1, 0, 5); // Adjust light position
						scene.add(light); // Add light to the scene

						scene.add(new THREE.AmbientLight(0x303030, 9));

						scene.add(new THREE.AmbientLight(0x000030, 3));

						controls.enableDamping = true;

						controls.enableRotate = true; // mouse move
						controls.enableZoom = true; // mouse wheel


					}
				}

			}, 23);

		}



	}
	/*
		Description: Handles the window resize event. The canvas size changes according to the changing window size.
		Param: noting.
		Returns: noting.
	*/
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
	/*
		Description: Handles the mouse move event. Double-click changes the camera's position into the cabin, 
		effectively entering the glass sphere
		Param: noting.
		Returns: noting.
	*/
	function handleMouseMove() {
		camera.position.x = 0;
		camera.position.y = 10;
		camera.position.z = 10;

		const interval = setInterval(() => {
			camera.position.y -= zoomSpeed * 0.55;
			camera.position.z -= zoomSpeed * 0.2;
			cabin.rotation.x += 0.09;

			if (camera.position.y < -7) {
				clearInterval(interval);
			}
		}, 40);

		if (cabin) {
			window.removeEventListener("dblclick", handleMouseMove);

			setTimeout(function () {
				window.location.href = "/animal_crossing.html"; // Move to the next page

			}, 1000); // Wait 1 second before moving to the next page
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


