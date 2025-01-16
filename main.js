const GRID_HEIGHT = parseInt("###GRID_HEIGHT###");
const GRID_WIDTH = parseInt("###GRID_WIDTH###");

// Hacky wrapper to work with a callback instead of a string
function setInterval(cb, ms) {
	evalStr = "(" + cb.toString() + ")();";
	return app.setInterval(evalStr, ms);
}

// https://gist.github.com/blixt/f17b47c62508be59987b
var rand_seed = Date.now() % 2147483647;
function rand() {
	return rand_seed = rand_seed * 16807 % 2147483647;
}

// nr of unique rotations per piece
var piece_rotations = [1, 2, 2, 2, 4, 4, 4];

// Piece data: [piece_nr * 32 + rot_nr * 8 + brick_nr * 2 + j]
// with rot_nr between 0 and 4
// with the brick number between 0 and 4
// and j == 0 for X coord, j == 1 for Y coord
var piece_data = [
	// square block
	0, 0, -1, 0, -1, -1, 0, -1, 
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,

	// line block
	0, 0, -2, 0, -1, 0, 1, 0,
	0, 0, 0, 1, 0, -1, 0, -2,
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,

	// S-block
	0, 0, -1, -1, 0, -1, 1, 0, 
	0, 0, 0, 1, 1, 0, 1, -1, 
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,

	// Z-block
	0, 0, -1, 0, 0, -1, 1, -1, 
	0, 0, 1, 1, 1, 0, 0, -1, 
	0, 0, 0, 0, 0, 0, 0, 0,
	0, 0, 0, 0, 0, 0, 0, 0,

	// L-block
	0, 0, -1, 0, -1, -1, 1, 0, 
	0, 0, 0, 1, 0, -1, 1, -1, 
	0, 0, -1, 0, 1, 0, 1, 1, 
	0, 0, -1, 1, 0, 1, 0, -1, 

	// J-block
	0, 0, -1, 0, 1, 0, 1, -1, 
	0, 0, 0, 1, 0, -1, 1, 1, 
	0, 0, -1, 1, -1, 0, 1, 0, 
	0, 0, 0, 1, 0, -1, -1, -1, 

	// T-block
	0, 0, -1, 0, 0, -1, 1, 0,  
	0, 0, 0, 1, 0, -1, 1, 0, 
	0, 0, -1, 0, 0, 1, 1, 0, 
	0, 0, -1, 0, 0, 1, 0, -1
]

var TICK_INTERVAL = 50;
var GAME_STEP_TIME = 400;

// Globals
var pixel_fields = [];
var field = [];
var score = 0;
var time_ms = 0;
var last_update = 0;
var interval = 0;

// Current piece
var piece_type = rand() % 7;
var piece_x = 0;
var piece_y = 0;
var piece_rot = 0;

function spawn_new_piece() {
	piece_type = rand() % 7;
	piece_x = 4;
	piece_y = 0;
	piece_rot = 0;
}

function set_controls_visibility(state) {
	this.getField("T_input").hidden = !state;
	this.getField("B_left").hidden = !state;
	this.getField("B_right").hidden = !state;
	this.getField("B_down").hidden = !state;
	this.getField("B_rotate").hidden = !state;
}

function game_init() {
	spawn_new_piece();

	// Gather references to pixel field objects
	// and initialize game state
	for (var x = 0; x < GRID_WIDTH; ++x) {
		pixel_fields[x] = [];
		field[x] = [];
		for (var y = 0; y < GRID_HEIGHT; ++y) {
			pixel_fields[x][y] = this.getField(`P_${x}_${y}`);
			field[x][y] = 0;
		}
	}

	last_update = time_ms;
	score = 0;

	// Start timer
	interval = setInterval(game_tick, TICK_INTERVAL);

	// Hide start button
	this.getField("B_start").hidden = true;

	// Show input box and controls
	set_controls_visibility(true);
}

function game_update() {
	if (time_ms - last_update >= GAME_STEP_TIME) {
		lower_piece();
		last_update = time_ms;
	}
}

function game_over() {
	app.clearInterval(interval);
	app.alert(`Game over! Score: ${score}\nRefresh to restart.`);
}

function rotate_piece() {
	piece_rot++;
	if (piece_rot >= piece_rotations[piece_type]) {
		piece_rot = 0;
	}

	// If we're now out of bounds, undo the rotation
	var illegal = false;
	for (var square = 0; square < 4; ++square) {
		var x_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 0];
		var y_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 1];

		var abs_x = piece_x + x_off;
		var abs_y = piece_y + y_off;

		if (abs_x < 0 || abs_y < 0 || abs_x >= GRID_WIDTH || abs_y >= GRID_HEIGHT) {
			illegal = true;
			break;	
		}
	}
	if (illegal) {
		piece_rot--;
		if (piece_rot < 0) {
			piece_rot = piece_rotations[piece_type] - 1;
		}
	}
}

function is_side_collision() {
	for (var square = 0; square < 4; ++square) {
		var x_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 0];
		var y_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 1];

		var abs_x = piece_x + x_off;
		var abs_y = piece_y + y_off;

		// collision with walls
		if (abs_x < 0 || abs_x >= GRID_WIDTH) {
			return true;
		}

		// collision with field blocks
		if (field[abs_x][abs_y]) {
			return true;
		}
	}
	return false;
}

function handle_input(event) {
	switch (event.change) {
		case 'w': rotate_piece(); break;
		case 'a': move_left(); break;
		case 'd': move_right(); break;
		case 's': lower_piece(); break;
	}
}

function move_left() {
	piece_x--;
	if (is_side_collision()) {
		piece_x++;
	}
}

function move_right() {
	piece_x++;
	if (is_side_collision()) {
		piece_x--;
	}
}

function check_for_filled_lines() {
	for (var row = 0; row < GRID_HEIGHT; ++row) {
		var fill_count = 0;
		for (var column = 0; column < GRID_WIDTH; ++column) {
			fill_count += field[column][row];
		}
		if (fill_count == GRID_WIDTH) {
			// increase score
			score++;
			draw_updated_score();

			// remove line (shift down)
			for (var row2 = row; row2 > 0; row2--) {
				for (var column2 = 0; column2 < GRID_WIDTH; ++column2) {
					field[column2][row2] = field[column2][row2-1];
				}
			}

		}
	}
}

function lower_piece() {
	piece_y++;

	var collision = false;
	for (var square = 0; square < 4; ++square) {
		var x_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 0];
		var y_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 1];

		var abs_x = piece_x + x_off;
		var abs_y = piece_y + y_off;

		if (abs_x < 0 || abs_y < 0 || abs_x >= GRID_WIDTH || abs_y >= GRID_HEIGHT) {
			collision = true;
			break;	
		}

		if (abs_y >= GRID_HEIGHT || field[abs_x][abs_y]) {
			collision = true;
			break;
		}
	}

	if (collision) {
		// if at the top, game over
		if (piece_y == 1) {
			game_over();
			return;
		}

		// add to field
		piece_y--;
		for (var square = 0; square < 4; ++square) {
			var x_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 0];
			var y_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 1];

			var abs_x = piece_x + x_off;
			var abs_y = piece_y + y_off;

			if (abs_x < 0 || abs_y < 0 || abs_x >= GRID_WIDTH || abs_y >= GRID_HEIGHT) {
				// TODO: it is out of bounds, we should nudge it inwards?
				continue;
			}

			field[abs_x][abs_y] = true;
		}

		check_for_filled_lines();
		spawn_new_piece();
	}
}

function draw_updated_score() {
	this.getField("T_score").value = `Score: ${score}`;
}

function set_pixel(x, y, state) {
	if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
		return;
	}
	pixel_fields[x][GRID_HEIGHT - 1 - y].hidden = !state;
}

function draw_field() {
	for (var x = 0; x < GRID_WIDTH; ++x) {
		for (var y = 0; y < GRID_HEIGHT; ++y) {
			set_pixel(x, y, field[x][y]);
		}
	}
}

function draw_current_piece() {
	for (var square = 0; square < 4; ++square) {
		var x_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 0];
		var y_off = piece_data[piece_type * 32 + piece_rot * 8 + square * 2 + 1];

		var abs_x = piece_x + x_off;
		var abs_y = piece_y + y_off;

		set_pixel(abs_x, abs_y, 1);
	}
}

function draw() {
	draw_field();
	draw_current_piece();
}

function game_tick() {
	time_ms += TICK_INTERVAL;
	game_update();
	draw();
}

// Hide controls to start with
set_controls_visibility(false);

// Zoom to fit (on FF)
app.execMenuItem("FitPage");