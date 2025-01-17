const GRID_HEIGHT = parseInt("###GRID_HEIGHT###");
const GRID_WIDTH = parseInt("###GRID_WIDTH###");

// Hacky wrapper to work with a callback instead of a string
function setInterval(cb, ms) {
	evalStr = "(" + cb.toString() + ")();";
	return app.setInterval(evalStr, ms);
}

var TICK_INTERVAL = 50;

// Globals
var pixel_fields = [];
var field = [];
var score = 0;
var time_ms = 0;
var interval = 0;

let frame = 0;
let duration = data.length;

function game_init() {
	// and initialize game state
	for (let x = 0; x < GRID_WIDTH; ++x) {
		pixel_fields[x] = [];
		field[x] = [];
		for (let y = 0; y < GRID_HEIGHT; ++y) {
			pixel_fields[x][y] = this.getField(`P_${x}_${y}`);
			field[x][y] = false;
		}
	}


	// Start timer
	interval = setInterval(game_tick, TICK_INTERVAL);

	// Hide start button
	this.getField("B_start").hidden = true;

	draw_field();
}

function game_over() {
	app.clearInterval(interval);
	app.alert(`Game over! Score: ${score}\nRefresh to restart.`);
}

function handle_input(event) {
	switch (event.change) {
		case 'w': rotate_piece(); break;
		case 'a': move_left(); break;
		case 'd': move_right(); break;
		case 's': lower_piece(); break;
	}
}

function draw_updated_score() {
	this.getField("T_score").value = `Score: ${score}`;
}

function draw_pixel(x, y, state) {
	field[x][y] = state;
	pixel_fields[x][GRID_HEIGHT - 1 - y].hidden = !state;
}
function set_pixel(x, y, state) {
	if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
		return;
	}
	if (field[x][y] != state) {
		field[x][y] = state;
		pixel_fields[x][GRID_HEIGHT - 1 - y].hidden = !state;
	}
}

function draw_field() {
	for (let x = 0; x < GRID_WIDTH; x++) {
		for (let y = 0; y < GRID_HEIGHT; y++) {
			draw_pixel(x, y, field[x][y]);
		}
	}
}

function drawFrame() {
	let array = data[frame];
	for (let i = 0; i < array.length; i++) {
		for (let j = 0; j < array[i].length; j++) {
			draw_pixel(j, i, array[i][j] != 0);
		}
	}
}

function game_tick() {
	time_ms += TICK_INTERVAL;

	drawFrame();

	frame++;
	if (frame >= data.length) {
		clearInterval(interval);
	}
}

// Zoom to fit (on FF)
app.execMenuItem("FitPage");