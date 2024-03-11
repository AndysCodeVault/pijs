var g_Player1, g_Player2, g_Camera, g_Camera1, g_Camera2, g_Level, g_LastTime, g_Time, g_Dt,
g_PlayerNum, g_GamepadTolerances, g_Level;

g_Camera = {
	"pos": { "x": 150, "y": 100 },
	"offset": { "x": 0, "y": 0 },
	"dest": { "x": 150, "y": 100 }
};
g_Player1 = {
	"pos": { "x": 0, "y": 0 },
	"size": 4,
	"color": 1,
	"weapon": Weapons.getWeapon( "sword" ),
	"angle": 0,
	"speed": 0.05,
	"rotateSpeed": 0.01,
	"gamepadTolerance": 0.2
};
g_Player2 = {
	"pos": { "x": 0, "y": 10 },
	"size": 4,
	"color": 2,
	"weapon": Weapons.getWeapon( "sword" ),
	"angle": 0,
	"speed": 0.05,
	"rotateSpeed": 0.01,
	"gamepadTolerance": 0.2
};
g_Level = {
	"points": [],
	"walls": []
};
$.util.copyProperties( g_Level, g_Level1 );

g_LastTime = ( new Date() ).getTime();
g_PlayerNum = 2;

$.ready( function () {
	$.screen( {
		"aspect": "300e200",
		"isMultiple": true
	} );
	g_Camera.dest.x = Math.round( $.width() / 2 );
	g_Camera.dest.y = Math.round( $.height() / 2 );
	Map.initLevel();
	beginLevel();
} );

function beginLevel() {
	gameLoop();
}

function gameLoop() {
	updateCamera();
	draw();
	update();
	window.requestAnimationFrame( gameLoop );
}

function updateCamera() {
	//g_Camera.offset.x = Math.round( g_Player1.pos.x + ( g_Player2.pos.x - g_Player1.pos.x ) / 2 );
	//g_Camera.offset.y = Math.round( g_Player1.pos.y + ( g_Player2.pos.y - g_Player1.pos.y ) / 2 );
	g_Camera.offset.x = Math.round( g_Player1.pos.x );
	g_Camera.offset.y = Math.round( g_Player1.pos.y );
	g_Camera.pos.x = g_Camera.dest.x - g_Camera.offset.x;
	g_Camera.pos.y = g_Camera.dest.y - g_Camera.offset.y;
}

function update() {
	g_Time = ( new Date() ).getTime();
	g_Dt = g_Time - g_LastTime;
	Input.processInput( 0, g_Player1 );
	Input.processInput( 1, g_Player2 );
	g_Player1.weapon.update( g_Player1.weapon );
	g_Player2.weapon.update( g_Player2.weapon );
	g_LastTime = g_Time;
}

function draw() {
	$.cls();
	Map.drawLevel();
	drawMan( g_Player1 );
	drawMan( g_Player2 );
}

function drawMan( player ) {
	$.setColor( player.color );
	$.circle(
		Math.round( g_Camera.pos.x + player.pos.x ),
		Math.round( g_Camera.pos.y + player.pos.y ),
		player.size
	);
	$.line(
		Math.round( g_Camera.pos.x + player.pos.x ),
		Math.round( g_Camera.pos.y + player.pos.y ),
		Math.round( g_Camera.pos.x + player.pos.x + Math.cos( player.angle ) * ( player.size - 1 ) ),
		Math.round( g_Camera.pos.y + player.pos.y + Math.sin( player.angle ) * ( player.size - 1 ) ),
	);
	player.weapon.draw( player );
}
