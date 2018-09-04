var game = {
	camera: null,
	renderer: null,
	canvas: null,
	scene: null,
	world: null,
	renderTimer: null,
	objects: {},
	objectKeyIndex: 0,
	objectKeyPrefix: 'obj',
	eventHandlers: {},
	eventsPermitted: [
		'click',
		'mousedown',
		'mousemove',
		'mouseup',
		'keydown',
		'keyup',
		'keypressed',
	],
	gameFrame: null,
	gameFrameAfterRender: null,
	gameOptions: {
		timeStep:1/60,
		gravity: {
			x: 0,
			y: -10,
			z: 0,
		},
		fov: 45,
		fps: 60,
		renderWidth: 600,
		renderHeight: 400,
		renderNearDistance: 0.1,
		renderFarDistance: 1000,
	},
	getRatio: function() {
		return this.gameOptions.renderWidth / this.gameOptions.renderHeight;
	},
	updateMeshes: function() {
		for(key in this.objects){
			if(
				this.objects[key].mesh !== null && this.objects[key].body !== null
			){
				this.objects[key].mesh.position.copy(
					this.objects[key].body.position
				)
				this.objects[key].mesh.quaternion.copy(
					this.objects[key].body.quaternion
				)
			}
		}
	},
	on: function(eventName, eventHandler) {
		if(this.eventsPermitted.indexOf(eventName) !== -1){
			this.eventHandlers[eventName] = eventHandler.bind(this);
			addEventListener(eventName, this.eventHandlers[eventName], false);
			return true;
		}
		return false;
	},
	addBox: function(userOptions) {
		var options = {
			hasMesh: true,
			hasBody: true,
			sizeX: 1,
			sizeY: 1,
			sizeZ: 1,
			positionX: 0,
			positionY: 0,
			positionZ: 0,
			mass: 1,
			materialType: 'basic',
			materialColor: 0xffffff,
			materialAffectedByFog: true,
			texture: null,
		}
		Object.assign(options, userOptions);
		
		var object = {
			body: null,
			mesh: null,
			key: 0,
		}

		var body = null, mesh = null;
		
		if(options.hasBody){
			body = new CANNON.Body({
				mass: options.mass,
			});
		
			var shape = new CANNON.Box(	
				new CANNON.Vec3(
					options.sizeX,
					options.sizeY,
					options.sizeZ
				)
			);
			
			var body = new CANNON.Body({
				mass: options.mass,
			});
			
			body.addShape(shape);
			body.position.x = options.positionX;
			body.position.y = options.positionY;
			body.position.z = options.positionZ;
		
		}
		
		if(options.hasMesh){
			var meshGeometry = new THREE.BoxGeometry(
				options.sizeX * 2,
				options.sizeY * 2,
				options.sizeZ * 2
			)
			var meshMaterial;
			switch(options.materialType){
				case 'lambert':
					meshMaterial = new THREE.MeshLambertMaterial({
						color: options.materialColor,
						fog: options.materialAffectedByFog,
					});
				break;
				case 'phong':
					meshMaterial = new THREE.MeshPhongMaterial({
						color: options.materialColor,
						fog: options.materialAffectedByFog,
					});
				break;
				default:
					meshMaterial = new THREE.MeshBasicMaterial({
						color: options.materialColor,
						fog: options.materialAffectedByFog,
					});
				break;
			}
			mesh = new THREE.Mesh(
				meshGeometry,
				meshMaterial
			);
		}
		
		this.objectKeyIndex++;
		
		object.body = body;
		object.mesh	= mesh;
		object.key = this.objectKeyPrefix + this.objectKeyIndex;
		
		this.world.addBody(object.body);
		this.scene.add(object.mesh);
		
		this.objects[object.key] = object;
		
		return object;
	},
	init: function(userOptions) {
		var options = this.gameOptions;
		
		// default options overwrite
		Object.assign(options, userOptions);
		Object.assign(this.gameOptions, options);
		
		// instanciate
		this.world = new CANNON.World();
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(
			options.fov,
			this.getRatio(),
			options.renderNearDistance,
			options.renderFarDistance
		)
		this.renderer = new THREE.WebGLRenderer();

		// configure
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.solver.iterations = 10;
		this.world.gravity.set(
			options.gravity.x,
			options.gravity.y,
			options.gravity.z
		);

		this.renderer.setSize(
			options.renderWidth,
			options.renderHeight
		);

		// set canvas object for quick access
		this.canvas = this.renderer.domElement;
		this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock;
		this.canvas.exitPointerLock  = this.canvas.exitPointerLock  || this.canvas.mozExitPointerLock;

		// options overwrite
		if(typeof options !== "undefined"){
			if("after" in options){
				options.after.bind(this)();
			}
			if("gameFrame" in options){
				this.gameFrame = options.gameFrame;
			}
			if("gameFrameAfterRender" in options){
				this.gameFrameAfterRender = options.gameFrameAfterRender;
			}
			if("events" in options){
				for(name in options.events){
					this.on(name, options.events[name].handler)
				}
			}
			if("wrapperElement" in options && typeof options.wrapperElement !== "undefined"){
				options.wrapperElement.appendChild(this.renderer.domElement);
			}
		}
		
		// start rendering timer
		this.render();
	},
	render: function() {
		requestAnimationFrame(this.render.bind(this));
		
		if(this.gameFrame !== null){
			this.gameFrame.bind(this)();
		}
		
		this.world.step(this.gameOptions.timeStep);
		this.updateMeshes();
		this.renderer.render(
			this.scene,
			this.camera
		)
		
		if(this.gameFrameAfterRender !== null){
			this.gameFrameAfterRender.bind(this)();
		}
	}
}
