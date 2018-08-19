var game = {
	camera: null,
	renderer: null,
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
	gameOptions: {
		timeStep:1/60,
		gravity: -10,
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
			this.objects[key].mesh.position.copy(
				this.objects[key].body.position
			)
			this.objects[key].mesh.quaternion.copy(
				this.objects[key].body.quaternion
			)
		}
	},
	on: function(eventName, eventHandler) {
		if(this.eventsPermitted.indexOf(eventName) !== -1){
			eventHandlers[eventName] = eventHandler.bind(this);
			addEventListener(eventName, eventHandlers[eventName], false);
			return true;
		}
		return false;
	},
	addBox: function(userOptions) {
		var options = {
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
		var mesh = new THREE.Mesh(
			meshGeometry,
			meshMaterial
		);
		
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
		this.world.gravity.set(0, options.gravity, 0);

		this.renderer.setSize(
			options.renderWidth,
			options.renderHeight
		);
		
		// options overwrite
		if(typeof options !== "undefined"){
			if("after" in options){
				options.after.bind(this)();
			}
			if("gameFrame" in options){
				this.gameFrame = options.gameFrame;
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
	}
}
