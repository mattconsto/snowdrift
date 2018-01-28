var SnowDrift = {
	Info: {
		name: "SnowDrift",
		path: "snowdrift",
		description: "It's something, I guess"
	},
	Context: {},
	State: {},
	Resources: {
		flag: "flag.png",
		player: "player.png",
		spritesheet: "spritesheet.png",
		world: "world.csv"
	},
	Entities: {}
};

SnowDrift.Entities.Particle = function(x, y, vx, vy, ax, ay) {
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	this.ax = ax;
	this.ay = ay;

	this.alive = true;

	this.logic = function(delta,state) {
		var old = {x: this.x, y: this.y};
		this.x  += this.vx*delta;
		this.y  += this.vy*delta;
		this.checkBounds(old, state);
		this.vx += this.ax*delta;
		this.vy += this.ay*delta;
	}

	this.checkBounds = function(old, state) {
		if(Math.round(this.y) < 0 || Math.ceil(this.y) >= state.world.length) {
			this.y = old.y;
			this.vy = 0;
		}
		if(Math.round(this.x) < 0 || Math.ceil(this.x) >= state.world[Math.ceil(this.y)].length) {
			this.x = old.x;
		}

		// Walls
		if(
			Math.round(this.y) >= 0 && Math.ceil(this.y) < state.world.length && 
			Math.round(this.x) >= 0 && Math.ceil(this.x+1) < state.world[Math.ceil(this.y)].length && 
			(state.world[Math.round(this.y)][Math.round(this.x+0.125)] > 1 ||
			state.world[Math.round(this.y)][Math.round(this.x+0.875)] > 1)
		) {
			this.x = old.x;
		}

		// Gravity
		if(
			Math.round(this.y) >= 0 && Math.ceil(this.y) < state.world.length && 
			Math.round(this.x) >= 0 && Math.ceil(this.x+1) < state.world[Math.ceil(this.y)].length && 
			(
			(state.world[Math.round(this.y)][Math.round(this.x+0.125)] > 1 ||
			state.world[Math.round(this.y)][Math.round(this.x+0.625)] > 1)||
			(state.world[Math.round(this.y)][Math.round(this.x+0.625)] > 1 ||
			state.world[Math.round(this.y)][Math.round(this.x+0.875)] > 1))
		) {
			this.y = old.y;
			this.x = old.x;
			this.vy = 0;
		}
	}
}

SnowDrift.Entities.Player = function(x, y) {
	this.prototype = new SnowDrift.Entities.Particle();
	this.prototype.constructor.call(this, x, y, 0, 0, 0, 0.00005);

	this.canJump = true;
	this.movementTimer = 0;
	this.jumpTimer = 0;
	this.movementDirection = "none";

	this.logic = function(delta,state) {
		this.prototype.logic.call(this, delta,state);
		this.movementTimer = Math.max(0, this.movementTimer - delta);
		this.jumpTimer = Math.max(0, this.jumpTimer - delta);
		if(this.movementTimer == 0) this.movementDirection = "none";
		if(Math.abs(this.vy) < 0.002) this.canJump = true;
	}

	this.render = function(state, context, res) {
		context.drawImage(
			res.player,
			8 * {"none": 2, "left": 1, "right": 3}[this.movementDirection], 0,
			8, 8,
			(this.x - state.camera.x) + (context.canvas.width - state.size.scale * state.upscale) / 2,
			(this.y - state.camera.y) + (context.canvas.height - state.size.scale * state.upscale) / 2,
			state.size.scale * state.upscale, state.size.scale * state.upscale
		);
	}

	this.jump = function(state) {
		if(!this.canJump || this.jumpTimer > 0) return;
		this.vy -= 0.015;
		this.canJump = false;
		this.jumpTimer = 500;
		this.movementTimer = 250;
		this.movementDirection = "none";
	}

	this.left = function(amount,state) {
		var old = {x: this.x, y: this.y};
		this.x -= amount;
		this.checkBounds(old, state);
		this.movementTimer = 250;
		this.movementDirection = "left";
	}

	this.right = function(amount,state) {
		var old = {x: this.x, y: this.y};
		this.x += amount;
		this.checkBounds(old, state);
		this.movementTimer = 250;
		this.movementDirection = "right";
	}
}

/* Initialization */
SnowDrift.init = function(context) {
	SnowDrift.State = {
		size: {scale: 64, width: 80, height: 64, total: 80 * 64},
		running: true,
		generated: false,
		world: [],
		entities: [],
		player: null,
		camera: {x: 0, y: 0},
		spritesize: {x: 8, y: 8},
		backgroundColor: "#3388ff",
		playerSpeed: 0.005,
		upscale: 8,
		worldCache: null,
	};

	SnowDrift.Resources = Resources.load(SnowDrift.Resources, "games/snowdrift/");

	context.innerHTML = '<canvas id="canvas" class="pixelated">Your browser doesn\'t support HTML5 Canvas!</canvas>';
	SnowDrift.Context = document.getElementById('canvas').getContext('2d');
	SnowDrift.Context.imageSmoothingEnabled = false;

	let resizefunc = function() {
		console.log("Resize");
		SnowDrift.Context.canvas.width  = window.innerWidth;
		SnowDrift.Context.canvas.height = window.innerHeight;
		SnowDrift.Context.imageSmoothingEnabled = false; // Resets on resize
		SnowDrift.State.size.scale = SnowDrift.Context.canvas.width/200;
	};
	window.addEventListener("resize", resizefunc);
	resizefunc();

	setTimeout(SnowDrift.setup, 500); // Nasty hack to wait for images to load
}

SnowDrift.setup = function() {
	// Prepare world
	var splitworld = SnowDrift.Resources.world.trim().split("\n");
	for(index in splitworld) {
		var line = splitworld[index].split("");
		for(jndex in line) line[jndex] = parseInt(line[jndex], 36);
		SnowDrift.State.world.push(line);
	}

	SnowDrift.State.worldCache = SnowDrift.renderWorld(SnowDrift.State, SnowDrift.Resources);

	// Prepare player
	SnowDrift.State.player = new SnowDrift.Entities.Player(60, 0);

	SnowDrift.loop();
}

SnowDrift.events = function(state, context, res) {
	var old = {x: state.player.x, y: state.player.y}

	if(Keyboard.has(65) && !Keyboard.has(68) || Keyboard.has(37) && !Keyboard.has(39)) state.player.left(state.playerSpeed * Timing.delta, state); // KeyA
	if(Keyboard.has(68) && !Keyboard.has(65) || Keyboard.has(39) && !Keyboard.has(37)) state.player.right(state.playerSpeed * Timing.delta, state); // KeyD

	if(Keyboard.once(32) || Keyboard.once(87) || Keyboard.once(38)) state.player.jump(state);

	if(state.world[Math.round(state.player.y)][Math.round(state.player.x)] == 1) {
		alert("You died.")
	}

	if(state.world[Math.round(state.player.y)][Math.round(state.player.x)] == 9) {
		alert("You win!")
	}
}

/* Game update logic */
SnowDrift.logic = function(state, context, res) {
	state.player.logic(Timing.delta,state);

	state.camera.x = state.player.x;
	state.camera.y = state.player.y;
}

/* Renderer */
SnowDrift.renderWorld = function(state, res) {
	var canvas = document.createElement('canvas');
	canvas.context = canvas.getContext("2d");
	canvas.width = state.world[0].length * state.upscale;
	canvas.height = state.world.length * state.upscale;

	// World
	for(y in state.world) {
		for(x in state.world[y]) {
			var val = state.world[y][x];
			canvas.context.drawImage(
				res.spritesheet,

				val * state.spritesize.x, 0,
				state.spritesize.x, state.spritesize.y,

				x * state.upscale,
				y * state.upscale,
				state.upscale, state.upscale
			);
		}
	}

	return canvas;
}

/* Renderer */
SnowDrift.render = function(state, context, res) {
	// Blank
	context.fillStyle = state.backgroundColor;
	context.fillRect(0, 0, context.canvas.width, context.canvas.height);

	context.drawImage(
		state.worldCache,
		(-state.camera.x-1) * state.upscale * state.size.scale + (context.canvas.width) / 2,
		(-state.camera.y) * state.upscale * state.size.scale + (context.canvas.height) / 2,
		state.size.scale * state.worldCache.width, state.size.scale * state.worldCache.height
	);

	// Player
	state.player.render(state, context, res)
}

/* Gameloop */

SnowDrift.loop = function() {
	Timing.refresh();

	if(SnowDrift.State.running) {
		SnowDrift.events(SnowDrift.State, SnowDrift.Context, SnowDrift.Resources);
		SnowDrift.logic(SnowDrift.State, SnowDrift.Context, SnowDrift.Resources);
	}
	SnowDrift.render(SnowDrift.State, SnowDrift.Context, SnowDrift.Resources);

	requestAnimationFrame(SnowDrift.loop);
}

/* Start */
addEventListener("load", function(){if(typeof Loader !== "undefined") Loader.register(SnowDrift);});
