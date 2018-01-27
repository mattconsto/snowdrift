var GameJam = {
	Info: {
		name: "GameJam",
		path: "gamejam",
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

GameJam.Entities.Particle = function(x, y, vx, vy, ax, ay) {
	this.x = x;
	this.y = y;
	this.vx = vx;
	this.vy = vy;
	this.ax = ax;
	this.ay = ay;

	this.alive = true;

	this.logic = function(delta) {
		this.x  += this.vx*delta;
		this.y  += this.vy*delta;
		this.vx += this.ax*delta;
		this.vy += this.ay*delta;
	}
}

GameJam.Entities.Player = function(x, y) {
	this.prototype = new GameJam.Entities.Particle();
	this.prototype.constructor.call(this, x, y, 0, 0, 0, 0.0001);

	this.logic = function(delta) {
		this.prototype.logic.call(this, delta);
	}
}

/* Initialization */
GameJam.init = function(context) {
	GameJam.State = {
		size: {scale: 64, width: 80, height: 64, total: 80 * 64},
		running: true,
		generated: false,
		world: [],
		entities: [],
		player: null,
		camera: {x: 0, y: 0},
		spritesize: {x: 8, y: 8},
		backgroundColor: "#0055ff",
		playerSpeed: 0.01,
		upscale: 4,
	};

	GameJam.Resources = Resources.load(GameJam.Resources, "games/gamejam/");

	context.innerHTML = '<canvas id="canvas">Your browser doesn\'t support HTML5 Canvas!</canvas>';
	GameJam.Context = document.getElementById('canvas').getContext('2d');
	GameJam.Context.imageSmoothingEnabled= false

	let resizefunc = function() {
		console.log("Resize");
		GameJam.Context.canvas.width  = window.innerWidth;
		GameJam.Context.canvas.height = window.innerHeight;
		GameJam.State.size.scale = GameJam.Context.canvas.width/100;
	};
	window.addEventListener("resize", resizefunc);
	resizefunc();

	// Prepare world
	var splitworld = GameJam.Resources.world.trim().split("\n");
	for(index in splitworld) {
		GameJam.State.world.push(splitworld[index].split(","))
	}

	// Prepare player
	GameJam.State.player = new GameJam.Entities.Player(10, 10);

	GameJam.loop();
}

GameJam.events = function(state, context, res) {
	var old = {x: state.player.x, y: state.player.y}

	if(Keyboard.has(65) && !Keyboard.has(68)) {state.player.x -= state.playerSpeed * Timing.delta} // KeyA
	if(Keyboard.has(68) && !Keyboard.has(65)) {state.player.x += state.playerSpeed * Timing.delta} // KeyD

	if(Keyboard.once(32)) state.player.y -= 5;

	if(Math.round(state.player.y) < 0 || Math.round(state.player.y) >= state.world.length) {
		state.player.y = old.y;
		state.player.vy = 0;
	}
	if(Math.round(state.player.x) < 0 || Math.round(state.player.x) >= state.world[Math.round(state.player.y)].length) {
		state.player.x = old.x;
	}

	if(
		Math.round(state.player.y) >= 0 && Math.round(state.player.y) < state.world.length && 
		Math.round(state.player.x) >= 0 && Math.round(state.player.x) < state.world[Math.round(state.player.y)].length && 
		state.world[Math.round(state.player.y)][Math.round(state.player.x)] != 0
	) {
		state.player.x = old.x;
		state.player.y = old.y;
		state.player.vy = 0;
	}
}

/* Game update logic */
GameJam.logic = function(state, context, res) {
	var old = {x: state.player.x, y: state.player.y}

	state.player.logic(Timing.delta);

	if(Math.round(state.player.y) < 0 || Math.round(state.player.y) >= state.world.length) {
		state.player.y = old.y;
		state.player.vy = 0;
	}
	if(Math.round(state.player.x) < 0 || Math.round(state.player.x) >= state.world[Math.round(state.player.y)].length) {
		state.player.x = old.x;
	}

	if(
		Math.round(state.player.y) >= 0 && Math.round(state.player.y) < state.world.length && 
		Math.round(state.player.x) >= 0 && Math.round(state.player.x) < state.world[Math.round(state.player.y)].length && 
		state.world[Math.round(state.player.y)][Math.round(state.player.x)] != 0
	) {
		state.player.x = old.x;
		state.player.y = old.y;
		state.player.vy = 0;
	}

	state.camera.x = state.player.x;
	state.camera.y = state.player.y;
}

/* Renderer */
GameJam.render = function(state, context, res) {
	// Blank
	context.fillStyle = state.backgroundColor;
	context.fillRect(0, 0, context.canvas.width, context.canvas.height);

	// World
	for(y in state.world) {
		for(x in state.world[y]) {
			var val = state.world[y][x];
			context.drawImage(
				res.spritesheet,

				val * (state.spritesize.x + 1), 0,
				state.spritesize.x, state.spritesize.y,

				(x - state.camera.x) * state.upscale * state.size.scale + (context.canvas.width - state.size.scale * state.upscale) / 2,
				(y - state.camera.y) * state.upscale * state.size.scale + (context.canvas.height - state.size.scale * state.upscale) / 2,
				state.size.scale * state.upscale, state.size.scale * state.upscale
			);
		}
	}

	// Player
	context.drawImage(
		res.player,
		(state.player.x - state.camera.x) + (context.canvas.width - state.size.scale * state.upscale) / 2,
		(state.player.y - state.camera.y) + (context.canvas.height - state.size.scale * state.upscale) / 2,
		state.size.scale * state.upscale, state.size.scale * state.upscale
	);
}

/* Gameloop */

GameJam.loop = function() {
	Timing.refresh();

	if(GameJam.State.running) {
		GameJam.events(GameJam.State, GameJam.Context, GameJam.Resources);
		GameJam.logic(GameJam.State, GameJam.Context, GameJam.Resources);
	}
	GameJam.render(GameJam.State, GameJam.Context, GameJam.Resources);

	requestAnimationFrame(GameJam.loop);
}

/* Start */
addEventListener("load", function(){if(typeof Loader !== "undefined") Loader.register(GameJam);});
