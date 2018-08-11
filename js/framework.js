var game = {
	camera: null,
	renderer: null,
	scene: null,
	world: null,
	renderWidth: 600,
	renderHeight: 400,
	renderNearDistance: 0.1,
	renderFarDistance: 1000,
	fov: 45,
	fps: 60,
	renderTimer: null,
	timeStep:1/60,
	getRatio: function() {
		return this.renderWidth / this.renderHeight;
	},
	init: function() {
		// instanciate
		this.world = new CANNON.World();
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			this.fov,
			this.getRatio(),
			this.renderNearDistance,
			this.renderFarDistance
		)
		this.renderer = new THREE.WebGLRenderer();
		
		// configure
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.solver.iterations = 10;
		this.world.gravity.set(0, -10, 0);
		
		this.renderer.setSize(
			this.renderWidth,
			this.renderHeight
		)
		
		// start rendering timer
		this.renderTimer = setInterval(
			this.render.bind(this),
			parseInt(1000 / this.fps)
		);
	},
	render: function() {
		this.world.step(this.timeStep);
	
		this.renderer.render(
			this.scene,
			this.camera
		)
	}
}