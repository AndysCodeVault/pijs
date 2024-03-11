var examples = {};
examples['arc'] = function() {
$.screen("300x200", 'canvasContainer');
$.arc(150, 100, 50, 45, 270);onExampleClose = function () {};
}
examples['bezier'] = function() {
$.screen("300x200", 'canvasContainer');
$.bezier({
	"xStart": 15,
	"yStart": 10,
	"x1": 45,
	"y1": 135,
	"x2": 195,
	"y2": 75,
	"xEnd": 280,
	"yEnd": 185
});onExampleClose = function () {};
}
examples['cancelInput'] = function() {
$.screen("300x200", 'canvasContainer');
$.print("\n");
$.input("What is your name?", null);
$.onkey( "Escape", "down", function () {  
	$.print("\nInput Canceled");
	$.cancelInput();
}, true );onExampleClose = function () {};
}
examples['canvas'] = function() {
$.screen("300x200", 'canvasContainer');
$.canvas().className = "purple";
$.print("\n\nThe background is now purple.");onExampleClose = function () {};
}
examples['circle'] = function() {
$.screen("300x200", 'canvasContainer');
$.circle(150, 100, 50, "red");onExampleClose = function () {};
}
examples['clearEvents'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( 
	"Move mouse or touch to paint screen," +
	" click/touch up to stop."
);
$.onpress( "move", pressMove );
$.onpress( "up", pressStop );

// Press move function
function pressMove( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Press stop function
function pressStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.clearEvents();
}onExampleClose = function () {};
}
examples['clearKeys'] = function() {
$.screen("300x200", 'canvasContainer');
$.print("\n");
$.onkey( "any", "down", function (key) {
	$.print(key.key + " pressed.");
});
$.onkey( "Escape", "down", function (key) {
	$.print(key.key + " pressed.");
	$.clearKeys();
});onExampleClose = function () {};
}
examples['cls'] = function() {
$.screen("300x200", 'canvasContainer');
$.line(0, 0, 300, 200);
$.onkey("any", "down", function () {
	$.cls();
});onExampleClose = function () {};
}
examples['createAudioPool'] = function() {
var bombPool = $.createAudioPool( "/sounds/bomb.wav", 1 , 'canvasContainer');
$.ready( function () {
	$.playAudioPool( bombPool );
} );
onExampleClose = function () {};
}
examples['deleteAudioPool'] = function() {
var bombPool = $.createAudioPool("/sounds/bomb.wav", 1, 'canvasContainer');
$.deleteAudioPool(bombPool);onExampleClose = function () {};
}
examples['draw'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.pset( 150, 100 );
$.draw( "C2 R15 D15 L30 U15 R15" );						// Draw House
$.draw( "B G4 C1 L6 D6 R6 U6 BG3 P1" ); 				// Draw Window
$.draw( "B E3 B R14 C1 L6 D6 R6 U6 BG3 P1" ); 	// Draw Window
$.draw( "B E3 B R1 P2" );										// Paint House
$.draw( "B E4 B U C6 H15 G15 B R5 P6" );				// Draw Roof
onExampleClose = function () {};
}
examples['drawImage'] = function() {
$.screen( "300x200" , 'canvasContainer');
var monkey = $.loadImage( "/images/monkey.png" );
$.ready( function () {
	$.drawImage( monkey, 150, 100, 0, 0.5, 0.5 );
} );
onExampleClose = function () {};
}
examples['drawSprite'] = function() {
var monkey, frame, interval;
$.screen( "300x200" , 'canvasContainer');
monkey = $.loadSpritesheet( "/images/monkey.png", null, 32, 32, 1 );
$.ready( function () {
	frame = 0;
	interval = setInterval( run, 500 );
	function run() {
		frame += 1;
		$.cls();
		$.drawSprite( monkey, frame % 2, 150, 100, 0, 0.5, 0.5, null, 2, 2 );
	}
	run();
} );onExampleClose = function () {clearInterval( interval );
}
}
examples['ellipse'] = function() {
$.screen("300x200", 'canvasContainer');
$.ellipse(150, 100, 50, 80, "blue");onExampleClose = function () {};
}
examples['filterImg'] = function() {
$.screen("300x200", 'canvasContainer');
$.circle(150, 100, 50, "red");
$.filterImg(function (color, x, y) {
	color.r = color.r - Math.round( Math.tan( ( x + y ) / 10 ) * 128 );
	color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );
	color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );
	return color;
});onExampleClose = function () {};
}
examples['findColor'] = function() {
$.screen("300x200", 'canvasContainer');
var color = $.findColor("red");
$.setColor(color);
$.print("The index of red is " + color + ".");
onExampleClose = function () {};
}
examples['get'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.circle( 150, 110, 50, 4 );
var colors = $.get( 105, 85, 110, 90 );
$.print( "[" );
for( var i = 0; i < colors.length; i++ ) {
	$.print( "    [ " + colors[ i ].join( ", " ) + " ]," );
}
$.print( "]" );
$.put( colors, 20, 80 );
onExampleClose = function () {};
}
examples['getCols'] = function() {
// Print a line of *'s on the top of the screen
$.screen( "300x200" , 'canvasContainer');
var cols = $.getCols();
var msg = "";
for( var i = 0; i < cols; i++ ) {
	msg += "*";
}
$.print( msg );
onExampleClose = function () {};
}
examples['getDefaultPal'] = function() {
$.screen("300x200", 'canvasContainer');
var pal = $.getDefaultPal();
$.setColor( 4 );
$.print( pal[ 4 ].s );
onExampleClose = function () {};
}
examples['getImage'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.circle( 150, 110, 50, 4 );
var circle = $.getImage( null, 100, 40, 200, 160 );
$.drawImage( circle, 20, 80 );
onExampleClose = function () {};
}
examples['getPal'] = function() {
$.screen("300x200", 'canvasContainer');
var pal = $.getPal();
$.setColor( 2 );
$.print( pal[ 2 ].s );
onExampleClose = function () {};
}
examples['getPixel'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 5 );
$.pset( 55, 55 );
var pixel = $.getPixel( 55, 55 );
$.print( pixel.s );
onExampleClose = function () {};
}
examples['getPos'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setPos( 5, 5 );
var pos = $.getPos();
$.print( pos.row + ", " + pos.col );
onExampleClose = function () {};
}
examples['getPosPx'] = function() {
$.screen("300x200", 'canvasContainer');
$.setPosPx(15, 15);
var pos = $.getPosPx();
$.print(pos.x + ", " + pos.y);
onExampleClose = function () {};
}
examples['getRows'] = function() {
// Print a line of *'s on the left of the screen
$.screen("300x200", 'canvasContainer');
var rows = $.getRows();
var msg = "";
for(var i = 0; i < rows; i++) {
	msg += "*\n";
}
$.print(msg);
onExampleClose = function () {};
}
examples['getScreen'] = function() {
$.screen( "300x200" , 'canvasContainer');
var $screen = $.getScreen( 0 );
$screen.print( "This is screen 0." );
onExampleClose = function () {};
}
examples['getSpritesheetData'] = function() {
var frame, interval, frameData, monkeySpritesheet;
$.screen( "300x200" , 'canvasContainer');
monkeySpritesheet = $.loadSpritesheet( "/images/monkey.png" );
$.ready( function () {
	frameData = $.getSpritesheetData( monkeySpritesheet );
	frame = 0;
	interval = setInterval( run, 500 );
	function run() {
		frame += 1;
		$.cls();
		$.drawSprite( monkeySpritesheet, frame % frameData.frameCount, 150, 100, 0, 0.5, 0.5 );
	}
	run();
} );onExampleClose = function () {clearInterval( interval );
}
}
examples['height'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Height: " + $.height() );
onExampleClose = function () {};
}
examples['ingamepads'] = function() {
var x, y, frame;
$.screen( "300x200" , 'canvasContainer');
$.setColor( 15 );
x = 150;
y = 100;
frame = requestAnimationFrame( run );
function run( dt ) {
	var pads, factor;
	factor = dt / 2500;
	pads = $.ingamepads();
	$.cls();
	if( pads.length > 0 ) {
		x = $.util.clamp( x + pads[ 0 ].axes2[ 0 ] * factor, 0, 299 );
		y = $.util.clamp( y + pads[ 0 ].axes2[ 1 ] * factor, 0, 199 );
		$.circle( Math.floor( x ), Math.floor( y ) , 10 );
		$.pset( Math.floor( x ), Math.floor( y ) );
	}
	frame = requestAnimationFrame( run );
}
onExampleClose = function () {cancelAnimationFrame( frame );
}
}
examples['inkey'] = function() {
$.screen( "300x200" , 'canvasContainer');
var frame = requestAnimationFrame( run );
function run() {
	var keys, key;
	keys = $.inkey();
	$.cls();
	$.print( "Press any key" );
	for( key in $.inkey() ) {
		$.print( "--------------------------" );
		$.print( "key:      " + keys[ key ].key );
		$.print( "location: " + keys[ key ].location );
		$.print( "code:     " + keys[ key ].code );
		$.print( "keyCode:  " + keys[ key ].keyCode );
	}
	frame = requestAnimationFrame( run );
}
onExampleClose = function () {cancelAnimationFrame( frame );
}
}
examples['inmouse'] = function() {
$.screen( "4x4" , 'canvasContainer');
var interval = setInterval( function () {
	var mouse = $.inmouse();
	if( mouse.buttons > 0 ) {
		$.setColor( Math.floor( Math.random() * 9 ) + 1 );
		$.pset( mouse.x, mouse.y );
	}
}, 50 );
onExampleClose = function () {clearInterval( interval );
}
}
examples['inpress'] = function() {
$.screen( "4x4" , 'canvasContainer');
$.startTouch();
$.setPinchZoom( false );
var interval = setInterval( function () {
	var press = $.inpress();
	if( press.buttons > 0 ) {
		$.setColor( Math.floor( Math.random() * 9 ) + 1 );
		$.pset( press.x, press.y );
	}
}, 50 );
onExampleClose = function () {clearInterval( interval );
}
}
examples['input'] = function() {
$.screen( "300x200" , 'canvasContainer');
askQuestions();
async function askQuestions() {
	var name = await $.input( "What is your name? " );
	var age = await $.input( "How old are you? ", null, true, true, false, "always" );
	$.print( "Your name is " + name + " you are " + age + " years old." );
}
onExampleClose = function () {};
}
examples['intouch'] = function() {
$.screen( "4x4" , 'canvasContainer');
$.startTouch();
$.setPinchZoom( false );
var interval = setInterval( function () {
	var touches = $.intouch();
	if( touches.length > 0 ) {
		$.setColor( Math.floor( Math.random() * 9 ) + 1 );
		$.pset( touches[ 0 ].x, touches[ 0 ].y );
	}
}, 50 );
onExampleClose = function () {clearInterval( interval );
}
}
examples['line'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 4 );
$.line( 15, 15, 285, 185 );
$.setColor( 2 );
$.line( 15, 185, 285, 15 );
onExampleClose = function () {};
}
examples['loadFont'] = function() {
var font = $.loadFont( 
  "/images/gnsh-bitmapfont-colour2.png", 5, 12, 
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]" +
  "^_`abcdefghijklmnopqrstuvwxyz{|}~"
);
$.ready( function () {
	$.screen( "300x200" , 'canvasContainer');
  $.setBgColor( "#241c1c" );
	$.setFont( font );
  $.print();
	$.print( " Hello World!" );
	$.print( " 123456789" );
	$.print( " #$%&?" );
} );
onExampleClose = function () {};
}
examples['loadImage'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.loadImage( "/images/monkey.png", "monkey" );
$.ready( function () {
	$.drawImage( "monkey", 150, 100, 0, 0.5, 0.5 );
} );
onExampleClose = function () {};
}
examples['loadSpritesheet'] = function() {
var frame, interval;
$.screen( "300x200" , 'canvasContainer');
$.loadSpritesheet( "/images/monkey.png", "monkey" );
$.ready( function () {
	frame = 0;
	interval = setInterval( run, 500 );
	function run() {
		frame += 1;
		$.cls();
		$.drawSprite( "monkey", frame % 2, 150, 100, 0, 0.5, 0.5 );
	}
	run();
} );onExampleClose = function () {clearInterval( interval );
}
}
examples['offclick'] = function() {
$.screen( "300x200" , 'canvasContainer');
var hitBox = {
	"x": 25,
	"y": 25,
	"width": 100,
	"height": 100
};

// Draw a green box
$.setColor( 2 );
$.rect( hitBox );

// Setup the onclick function for the hitBox
$.onclick( clickBox, false, hitBox );

// Click function
function clickBox() {

	// Draw a red box
	$.setColor( 4 );
	$.rect( hitBox );
	$.offclick( clickBox );

	// Wait a second then clear the box
	setTimeout( function () {
		$.setColor( 0 );
		$.rect( hitBox );
	}, 1000 );
}
onExampleClose = function () {};
}
examples['offgamepad'] = function() {
$.screen( "300x300" , 'canvasContainer');
$.print( "Press button 3 to stop" );
$.ongamepad( 0, "pressed", "any", pressButton );
$.ongamepad( 0, "pressed", 3, stop );

// Press button function
function pressButton( btn ) {
	console.log( btn );
	$.print( "Button " + btn.index + " pressed" );
}

// Stop function
function stop() {
	$.offgamepad( 0, "pressed", "any", pressButton );
	$.offgamepad( 0, "pressed", 3, stop );
	$.print( "Stopped" );
}
onExampleClose = function () {};
}
examples['offkey'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Press any key." );
$.print( "Press q to stop" );
$.onkey( "any", "down", keyPress );
$.onkey( "Q", "down", stopPress );

// Key press function
function keyPress( key ) {
	$.print( "You pressed " + key.key + "!" );
}

// Stop key press function
function stopPress() {
	$.print( "You pressed Q! Stopping." );
	$.offkey( "any", "down", keyPress );
	$.offkey( "Q", "down", keyPress );
}
onExampleClose = function () {};
}
examples['offmouse'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Move mouse to paint screen, click to stop." );
$.onmouse( "move", mouseMove );
$.onmouse( "up", mouseStop, true );

// Mouse move function
function mouseMove( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Mouse stop function
function mouseStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.offmouse( "move", mouseMove );
}
onExampleClose = function () {};
}
examples['offpress'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Move mouse or touch to paint screen, click/touch up to stop." );
$.onpress( "move", pressMove );
$.onpress( "up", pressStop, true );

// Press move function
function pressMove( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Press stop function
function pressStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.offpress( "move", pressMove );
}
onExampleClose = function () {};
}
examples['offtouch'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Touch and drag to paint screen, touch up to stop." );
$.ontouch( "move", touchMove );
$.ontouch( "end", touchStop, true );

// Touch move function
function touchMove( touches ) {
	$.setPosPx( touches[ 0 ].x, touches[ 0 ].y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Touch stop function
function touchStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.offtouch( "move", touchMove );
}
onExampleClose = function () {};
}
examples['onclick'] = function() {
$.screen( "300x200" , 'canvasContainer');
var hitBox = {
	"x": 25,
	"y": 25,
	"width": 100,
	"height": 100
};

// Draw a green box
$.setColor( 2 );
$.rect( hitBox );

// Setup the onclick function for the hitBox
$.onclick( clickBox, true, hitBox );

// Click function
function clickBox() {

	// Draw a red box
	$.setColor( 4 );
	$.rect( hitBox );

	// Wait a second then clear the box
	setTimeout( function () {
		$.setColor( 0 );
		$.rect( hitBox );
	}, 1000 );
}
onExampleClose = function () {};
}
examples['ongamepad'] = function() {
$.screen( "300x300" , 'canvasContainer');
$.print( "Press button 3 to stop" );
$.ongamepad( 0, "pressed", "any", pressButton );
$.ongamepad( 0, "pressed", 3, stop );

// Press button function
function pressButton( btn ) {
	$.print( "Button " + btn.index + " pressed" );
}

// Stop function
function stop() {
	$.offgamepad( 0, "pressed", "any", pressButton );
	$.offgamepad( 0, "pressed", 3, stop );
	$.print( "Stopped" );
}
onExampleClose = function () {};
}
examples['onkey'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Press any key." );
$.print( "Press q to stop" );
$.onkey( "any", "down", keyPress );
$.onkey( "Q", "down", stopPress, true );

// Key press function
function keyPress( key ) {
	$.print( "You pressed " + key.key + "!" );
}

// Stop key press function
function stopPress() {
	$.print( "You pressed Q! Stopping." );
	$.offkey( "any", "down", keyPress );
}
onExampleClose = function () {};
}
examples['onmouse'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Move mouse to paint screen, click to stop." );
$.onmouse( "move", mouseMove );
$.onmouse( "up", mouseStop, true );

// Mouse move function
function mouseMove( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Mouse stop function
function mouseStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.offmouse( "move", mouseMove );
}
onExampleClose = function () {};
}
examples['onpress'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( 
	"Move mouse or touch to paint screen," +
	" click/touch up to stop."
);
$.onpress( "move", pressMove );
$.onpress( "up", pressStop, true );

// Press move function
function pressMove( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 8 );
	$.print( "+", true );
}

// Press stop function
function pressStop() {
	$.setColor( 14 );
	var pos = $.getPos();
	$.setPos( pos.col - 4, pos.row );
	$.print( "Stopped!", true );
	$.offpress( "move", pressMove );
}
onExampleClose = function () {};
}
examples['ontouch'] = function() {
$.screen( "4x4" , 'canvasContainer');
$.setPinchZoom( false );
$.ontouch( "start", function ( touches ) {
	var touch = touches[ 0 ];
	$.setColor( Math.floor( Math.random() * 9 ) + 1 );
	$.pset( touch.x, touch.y );
} );
onExampleClose = function () {};
}
examples['paint'] = function() {
var color = [ 255, 255, 255 ];
var color2 = [ 25, 85, 125 ];
$.screen( "256x256" , 'canvasContainer');
$.setColor( 15 );
$.setPen( "pixel", 1, 100 );
for( i = 0; i < 128; i++ ) {
	color[ 0 ] -= 2;
	color[ 1 ] -= 2;
	color[ 2 ] -= 2;
	$.setColor( color );
	$.rect( i, i, 255 - i * 2 + 1, 255 - i * 2 + 1 );
}
$.setPen( "pixel", 1 );
$.print( "Click screen to paint" );
$.onclick( function ( mouse ) {
	$.paint( mouse.x, mouse.y, color2, 0.75 );
} );
onExampleClose = function () {};
}
examples['play'] = function() {
$.play( `
	triangle
	ma5	mt90 md10
	mo1 t140 o2 p4 g2 e4. f8 g4 o3 c2 o2 b8 o3 c8 d4 c4 o2 b4 a8 g2.
	o2 b8 o3 c8 d4 c4 o2 b4 a8 a8 g8 o3 c4 o2 e8 e4 g8 a8 g4 f4 e4 f4 g2.
	g2 e4. f8 g4 o3 c2 o2 b8 o3 c8 d4 c4 o2 b4 a8 g2.
	square
	v30
	o2 b8 o3 c8 d4 c4 o2 b4 a8 a8 g8 o3 c4 o2 e8 e4 g8 a8 g4 f4 e4 d4 c2.
	c4 a4 a4 o3 c4 c4 o2 b4 a4 g4 e4 f4 a4 g4 f4 e2.
	ma10 mt80 md10
	mo-1
	sawtooth
	v35
	e8 e8 d4 d4 g4 g4 b4 b4 o3 d4 d8 o2 b8 o3 d4 c4 o2 b4 a4 g4 p4
	g2 g2 e4. f8 g4 o3 c2 o2 b8 o3 c8 d4 c4 o2 b4 a8 g8 g2.
	o2 b8 o3 c8 d4 c4 o2 b4 a8 a8 g8 o3 c4 o2 e8 e4 g8 a8 g4 f4 e4 d4 c2. p4
	[
		[   0, 0.4, 0.4,   1,   1,   1, 0.3, 0.7, 0.6, 0.5, 0.9, 0.8 ],
		[   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0 ]
	]
	v80
	ma20 md20
	t180 g8 g8 g4 g4 g4 a8 g8 g4 g4 g4 a4 g4 e4 g4 d1
	t180 g8 g8 g4 g4 g4 a8 g8 g4 g4 g4 g8 g8 g4 a4 b4 o3 c2 c4 p1
` , 'canvasContainer');
onExampleClose = function () {$.stopPlay();
}
}
examples['playAudioPool'] = function() {
var bombPool = $.createAudioPool( "/sounds/bomb.wav", 1 , 'canvasContainer');
$.ready( function () {
	$.playAudioPool( bombPool );
} );
onExampleClose = function () {};
}
examples['print'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Welcome to PI JS", false, true );
$.print();
$.print( "This is a line of text." );
$.print( "This is inline text", true );
$.print( ". Some more inline text.", true );
$.print();
$.print( "The End" );
onExampleClose = function () {};
}
examples['printTable'] = function() {
var data = [
	[ "One", "2", "3", "FourSandwhiches", "EggMcMuffins", "6a" ],
	[ "Hotdogs", "Five", "Six", "7", "8", "9" ],
	[ "Seven", "Eight", "Nine", "a", "b", "c" ]
];
var format = [
	"*-----------*---*---*---*----*",
	"|           |   |   |V  |V   |",
	"*----*------*---*---*   |    |",
	"|    |      |       |   |    |",
	"|    *------*       |   |    |",
	"*----*      |       |   |    |",
	"|    |      |       |   |    |",
	"*----*------*-------*---*----*"
];
$.screen( "300x210" , 'canvasContainer');
$.setColor( 2 );
$.setFont( 1 );
$.print( "12345678901234567890123456789012345678901234567890" );
$.setPos( 18, 2 );
$.printTable( data, format, null, false );
$.printTable( data, format, null, true );
$.printTable( data, null, null );
onExampleClose = function () {};
}
examples['pset'] = function() {
$.screen("300x200", 'canvasContainer');
$.setColor(2);
$.pset(148, 101);
$.pset(149, 100);
$.pset(150, 101);
$.pset(151, 100);
$.pset(152, 101);onExampleClose = function () {};
}
examples['put'] = function() {
var data = [
	[  1,  2,  3,  4,  5,  6 ],
	[  7,  8,  9, 10, 11, 12 ],
	[ 13, 14, 15, 16, 17, 18 ]
]
$.screen( "30x20" , 'canvasContainer');
$.put( data, 1, 1 );
onExampleClose = function () {};
}
examples['ready'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.loadImage( "/images/monkey.png", "monkey" );
$.ready( function () {
	$.drawImage( "monkey", 150, 100, 0, 0.5, 0.5 );
} );
onExampleClose = function () {};
}
examples['rect'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 5 );
$.rect( 15, 15, 150, 100 );
$.rect( 25, 25, 150, 100, 6 );
$.rect( 35, 35, 150, 100, 2 );
onExampleClose = function () {};
}
examples['removeAllScreens'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 5 );
$.rect( 25, 25, 150, 100, 2 );
$.removeAllScreens();
onExampleClose = function () {};
}
examples['removeImage'] = function() {
$.screen( "300x200" , 'canvasContainer');
var monkey = $.loadImage( "/images/monkey.png" );
$.ready( function () {
	$.drawImage( monkey, 150, 100, 0, 0.5, 0.5 );
	$.removeImage( monkey );
	$.drawImage( monkey, 200, 150 );
} );
onExampleClose = function () {};
}
examples['removeScreen'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 5 );
$.rect( 25, 25, 150, 100, 2 );
$.removeScreen();
onExampleClose = function () {};
}
examples['render'] = function() {
// Create a main screen.
var screen1 = $.screen( "320x200" , 'canvasContainer');

// Create an offscreen buffer.
var screen2 = $.screen( "32x32", null, true );

// Draw circle to offscreen buffer.
screen2.circle( 15, 15, 15, 1 );

// Without this render the subsequent drawImage
// method would not show the circle.
screen2.render();

// Draw the image
screen1.drawImage( screen2, 100, 100 );
onExampleClose = function () {};
}
examples['screen'] = function() {
$.screen( "300e200" , 'canvasContainer');
$.line( 0, 0, $.width(), $.height() );
$.line( 0, $.height(), $.width(), 0 );
onExampleClose = function () {};
}
examples['set'] = function() {
$.screen( "300x200" , 'canvasContainer');

// First Set
$.set( {
  "bgColor": 10,
  "color": 1,
  "pos": { "row": 15, "col": 8 },
  "font": 0
} );
$.print( "Hello World 1!" );

// Second Set
$.set( {
  "pos": { "row": 16, "col": 8 },
  "font": 1
} );

// Note that Hello World 2 is a larger font so
// it's row and col position should be lower than
// the above print statement, but because the
// pos setting gets called first it's using the
// row size of font 0 instead of font 1
$.print( "Hello World 2!" );
onExampleClose = function () {};
}
examples['setActionKey'] = function() {
$.screen( "200x200" , 'canvasContainer');
$.setActionKey( 17 );
$.setActionKey( "KeyS" );
var interval = setInterval( function () {
	var keys, key;
	keys = $.inkey();
	$.cls();
	$.print( "Press Ctrl+S." );	
	key = $.inkey( 17 );
	if( key ) {
		$.print( "Control key is pressed." );
	} else {
		$.print( "Control key is not pressed." );
	}
	for( key in keys ) {
		$.print( "--------------------------" );
		$.print( "key:      " + keys[ key ].key );
		$.print( "location: " + keys[ key ].location );
		$.print( "code:     " + keys[ key ].code );
		$.print( "keyCode:  " + keys[ key ].keyCode );
	}
}, 60 );
onExampleClose = function () {clearInterval( interval );
}
}
examples['setAutoRender'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.line( 1, 1, 299, 199 );
$.setAutoRender( false );
// Note nothing will render because auto render is disabled
onExampleClose = function () {};
}
examples['setBgColor'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( "white" );
$.line( 0, 0, 300, 200 );
$.setBgColor( "blue" );
onExampleClose = function () {};
}
examples['setBlendMode'] = function() {
$.ready(function () {
	$.screen( "5x5" , 'canvasContainer');
	// draw 3 red pixels
	$.setColor( "rgba(255,0,0,1)" );
	$.pset( 1, 2 );
	$.pset( 2, 2 );
	$.pset( 3, 2 );
	$.render();
	$.setBlendMode( "blend" );
	// blend red and green
	$.setColor( "rgba(0,255,0,0.5)" );
	$.pset( 2, 2 );
	// blend red and blue
	$.setColor( "rgba(0,0,255,0.5)" );
	$.pset( 3, 2 );
});
onExampleClose = function () {};
}
examples['setChar'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setFont( 2 );
$.setChar( 97, "1092ba547cc6fe92" );
$.setChar( 98, "423c2418187e1818" );
$.setChar( 99, "7cd67cfec6aafe00" );
$.setChar( 100, "00183c667e5a42c3" );
$.setChar( 101, "008199FFDBFFBD18" );

$.print( " abcde f" );
onExampleClose = function () {};
}
examples['setColor'] = function() {
var i, colors, x, y, size;

$.screen( "360x300" , 'canvasContainer');
colors = $.getPal();
x = 0;
y = 0;
size = 20;
for( i = 0; i < colors.length; i++ ) {
	$.setColor( i );
	$.rect( x, y, size, size );
	$.setPosPx( x + 1, y + 4 );
	$.print( i, true );
	x += size;
	if( x >= $.width() ) {
		x = 0;
		y += size;
	}
}
onExampleClose = function () {};
}
examples['setContainerBgColor'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Hello" );
$.setContainerBgColor( 5 );
onExampleClose = function () {document.getElementById("canvasContainer").style.backgroundColor = "";
}
}
examples['setDefaultFont'] = function() {
$.setDefaultFont( 3 );
$.screen( "300x200" , 'canvasContainer');
$.print( "Hello World" );
onExampleClose = function () {};
}
examples['setDefaultInputFocus'] = function() {
$.setDefaultInputFocus( window );
$.screen( "300x200" , 'canvasContainer');
$.print( "Keyboard event handlers has been placed on the window object." );
onExampleClose = function () {};
}
examples['setDefaultPal'] = function() {
var colors = [
	"black", "red", "green", "blue", 
	"navy", "orange", "purple", "gray",
	"white", "pink", "brown", "cyan"
];
$.setDefaultPal( colors );
$.screen( "300x200" , 'canvasContainer');
for( var i = 0; i < colors.length; i++ ) {
	$.setColor( i );
	$.print( i + " = " + colors[ i ] );
}
onExampleClose = function () {};
}
examples['setEnableContextMenu'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Try right click to see if context menu appears." );
$.setEnableContextMenu( false );
onExampleClose = function () {};
}
examples['setErrorMode'] = function() {
$.setErrorMode( "throw" );
$.screen( "23514235" , 'canvasContainer');
onExampleClose = function () {};
}
examples['setFont'] = function() {
$.screen( "300x200" , 'canvasContainer');
for( var i = 0; i < 4; i++ ) {
	$.setFont( i );
	$.print( "Font - " + i );
}
onExampleClose = function () {};
}
examples['setFontSize'] = function() {
var font = $.loadFont( "/images/font-block.png", 10, 10, "ABCDFGHI" );
$.ready( function () {
	$.screen( "100x100" , 'canvasContainer');
	$.setFont( font );
	$.print( "ABCD" );
	$.setFontSize( 20, 20 );
	$.print( "ABCD" );
} );
onExampleClose = function () {};
}
examples['setInputCursor'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setInputCursor( "_" );
$.input( "What is your name? " );
onExampleClose = function () {};
}
examples['setPalColor'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 2 );
$.print( "Hello" );
$.setPalColor( 2, "purple" );
$.print( "Hello" );
onExampleClose = function () {};
}
examples['setPen'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setPen( "circle", 5, [ 32, 16, 8, 0 ] );
$.line( 30, 80, 270, 50 );
$.pset( 150, 100 );
$.draw( "BR15 D15 R100 D30 L15" );
onExampleClose = function () {};
}
examples['setPinchZoom'] = function() {
$.screen( "4x4" , 'canvasContainer');
$.setPinchZoom( false );
$.ontouch( "start", function ( touches ) {
	var touch = touches[ 0 ];
	$.setColor( Math.floor( Math.random() * 9 ) + 1 );
	$.pset( touch.x, touch.y );
} );
onExampleClose = function () {};
}
examples['setPixelMode'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 4 );
$.line( 30, 80, 270, 50 );
$.setPixelMode( false );
$.line( 30, 120, 270, 90 );
onExampleClose = function () {};
}
examples['setPos'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setPos( 5, 10 );
$.print( "X" );
$.setPos( 10, 15 );
$.print( "Y" );
onExampleClose = function () {};
}
examples['setPosPx'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setPosPx( 5, 10 );
$.print( "X" );
$.setPosPx( 10, 15 );
$.print( "Y" );
onExampleClose = function () {};
}
examples['setScreen'] = function() {
$.screen( "300x200" , 'canvasContainer');
var spriteScreen = $.screen( "32x32", null, true );
$.setScreen( 0 );
$.setColor( 2 );
$.rect( 134, 84, 33, 33 );
$.setScreen( spriteScreen );
$.circle( 16, 16, 16, 9 );
$.render();
$.setScreen( 0 );
$.drawImage( spriteScreen, 134, 84 );
onExampleClose = function () {};
}
examples['setVolume'] = function() {
$.setVolume( 0.75 , 'canvasContainer');
$.play( "Q1o3L8ED+ED+Eo2Bo3DCL2o2A" );
onExampleClose = function () {};
}
examples['setWordBreak'] = function() {
var msg = "abcdefghijklmnopqrstuvwxyz " +
	"abcdefghijklmnopqrstuvwxyz " +
	"abcdefghijklmnopqrstuvwxyz";
$.screen( "300x200" , 'canvasContainer');
$.print( msg );
$.setWordBreak( false );
$.print();
$.print( msg );
onExampleClose = function () {};
}
examples['sound'] = function() {
var data = [
  392, 8, "My ", 659, 8, "Bon-", 587, 8, "nie ", 523, 8, "lies ", 587, 8,
  "o-", 523, 8, "ver ", 440, 8, "the ", 392, 8, "o-", 330, 32, "cean\n",
  392, 8, "My ", 659, 8, "Bon-", 587, 8, "nie ", 523, 8, "lies ", 523, 8,
  "o-", 494, 8, "ver ", 523, 8, "the ", 587, 40, "sea\n", 392, 8, "My ",
  659, 8, "Bon-", 587, 8, "nie", 523, 8, " lies ", 587, 8, "o-", 523, 8,
  "ver ", 440, 8, "the ", 392, 8, "o-", 330, 32, "cean\n", 392, 8, "Oh ",
  440, 8, "bring ", 587, 8, "back ", 523, 8, "my ", 494, 8, "Bon-", 440,
  8, "nie ", 494, 8, "to ", 523, 32, "me"
];
var i;
var totalDuration = 0;
var volume = 0.15;
var attackRate = 0.01;
var decayRate = 0.1;
var sustainRate = 0.89;
var printTimeouts = [];

$.screen( "300x200" , 'canvasContainer');
for( i = 0; i < data.length; i += 3 ) {
  var freq = data[ i ];
  var duration = data[ i + 1 ] / 18.2;
  var sustain = duration * sustainRate;
  var attack = duration * attackRate;
  var decay = duration * decayRate;
  var word = data[ i + 2 ];
  $.sound(
    freq, sustain, volume, "sawtooth", totalDuration, attack, decay
  );
  printWord( word, totalDuration );
  totalDuration += duration;
}

function printWord( word, delay ) {
	printTimeouts.push( setTimeout( function () {
		$.print( word, word.indexOf( "\n" ) === -1 );
	}, delay * 1000 ) );
}
onExampleClose = function () {$.stopSound();
for( var i = 0; i < printTimeouts.length; i++ ) {
  clearTimeout( printTimeouts[ i ] );
}
}
}
examples['startKeyboard'] = function() {
$.screen( "300x200" , 'canvasContainer');

var hitboxColor = 2;
var hitbox = {
	"x": 175,
	"y": 75,
	"width": 100,
	"height": 100
};
var msg = "";
var isGreen = true;

$.onclick( clickBox, false, hitbox );
$.onkey( "any", "down", function ( key ) {
	msg = "You pressed " + key.key + ".";
	drawScreen();
} );
$.onkey( "any", "up", function ( key ) {
	msg = "";
	drawScreen();
} );

drawScreen();

function drawScreen() {
	$.cls();
	$.setColor( 7 );
	$.print( "Press any key" );
	$.print( "Click the box to toggle keyboard." );
	$.print( msg );
	$.setColor( hitboxColor );
	$.rect( hitbox );
}

function clickBox() {
	isGreen = !isGreen;
	if( isGreen ) {
		hitboxColor = 2;
		$.startKeyboard();
	} else {
		$.stopKeyboard();
		hitboxColor = 4;
	}
	drawScreen();
}
onExampleClose = function () {};
}
examples['startMouse'] = function() {
var isMouseEnabled = true;
$.screen( "300x200" , 'canvasContainer');
$.onkey( "m", "down", function () {
	isMouseEnabled = !isMouseEnabled;
	if( isMouseEnabled ) {
		$.startMouse();
	} else {
		$.stopMouse();
	}
	drawScreen();
} );
$.onmouse( "move", function ( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( 1 );
	$.print( "+", true );
} );

drawScreen();

function drawScreen() {
	$.cls();
	$.setColor( 7 );
	$.print();
	$.print( " Press 'm' key to toggle mouse" );
	$.print( isMouseEnabled ? " Mouse Enabled" : " Mouse Disabled" );
	$.setPen( "square", 2 );
	$.setColor( isMouseEnabled ? 2 : 4 );
	$.rect( 0, 0, 300, 200 );	
}
onExampleClose = function () {};
}
examples['startTouch'] = function() {
$.screen( "4x4" , 'canvasContainer');
$.startTouch();
$.setPinchZoom( false );
$.ontouch( "start", function ( touches ) {
	var touch = touches[ 0 ];
	$.setColor( Math.floor( Math.random() * 9 ) + 1 );
	$.pset( touch.x, touch.y );
} );
onExampleClose = function () {};
}
examples['stopAudioPool'] = function() {
var bombPool = $.createAudioPool( "/sounds/bomb.wav", 1 , 'canvasContainer');
var timeout = 0;
$.ready( function () {
	$.playAudioPool( bombPool );
	timeout = setTimeout( function () {
		$.stopAudioPool( bombPool );
	}, 500 );
} );
onExampleClose = function () {clearTimeout( timeout );
}
}
examples['stopKeyboard'] = function() {
$.screen( "300x200" , 'canvasContainer');

var hitbox = {
	"x": 175,
	"y": 75,
	"width": 100,
	"height": 100
};
var msg = "";
var isGreen = true;

$.onclick( clickBox, false, hitbox );
$.onkey( "any", "down", function ( key ) {
	msg = "You pressed " + key.key + ".";
	drawScreen();
} );
$.onkey( "any", "up", function ( key ) {
	msg = "";
	drawScreen();
} );

drawScreen();

function drawScreen() {
	$.cls();
	$.setColor( 7 );
	$.print( "Press any key" );
	$.print( "Click the box to toggle keyboard." );
	$.print( isGreen ? "Keyboard enabled" : "Keyboard disabled" );
	$.print( msg );
	$.setColor( isGreen ? 2 : 4 );
	$.rect( hitbox );
}

function clickBox() {
	isGreen = !isGreen;
	if( isGreen ) {
		$.startKeyboard();
	} else {
		$.stopKeyboard();
	}
	drawScreen();
}
onExampleClose = function () {};
}
examples['stopMouse'] = function() {
var isMouseEnabled = true;
$.screen( "300x200" , 'canvasContainer');
$.onkey( "m", "down", function () {
	isMouseEnabled = !isMouseEnabled;
	if( isMouseEnabled ) {
		$.startMouse();
	} else {
		$.stopMouse();
	}
	drawScreen();
} );
$.onmouse( "move", function ( data ) {
	$.setPosPx( data.x, data.y );
	var pos = $.getPos();
	$.setPos( pos.col, pos.row );
	$.setColor( pos.col );
	$.print( "+", true );
} );

drawScreen();

function drawScreen() {
	$.cls();
	$.setColor( 7 );
	$.print();
	$.print( " Press 'm' key to toggle mouse" );
	$.print( isMouseEnabled ? " Mouse Enabled" : " Mouse Disabled" );
	$.setPen( "square", 2 );
	$.setColor( isMouseEnabled ? 2 : 4 );
	$.rect( 0, 0, 300, 200 );	
}
onExampleClose = function () {};
}
examples['stopPlay'] = function() {
var song = "sawtooth v80 MO1" + 
	"t200l4o2mneel2el4eel2el4egl3cl8dl1el4ffl3fl8fl4fel2el8eel4edde" +
	"l2dgl4eel2el4eel2el4egl3cl8dl1el4ffl3fl8fl4fel2el8efl4ggfdl2c";
$.play( song , 'canvasContainer');
var timeout = setTimeout( function () {
	$.stopPlay();
}, 3500 );
onExampleClose = function () {$.stopPlay();
clearTimeout( timeout );
}
}
examples['stopSound'] = function() {
var duration = 0.05;
var volume = 0.5;
var decay = 0.03;
var totalDuration = 0;
var i;
for( i = 0; i < 30; i++ , 'canvasContainer') {
	$.sound(
		240 + i * 8, duration, volume, "sawtooth", totalDuration, 0,
		decay
	);
	totalDuration += duration + decay;
}

var timeout = setTimeout( function () {
	$.stopSound();
}, 750 );
onExampleClose = function () {$.stopSound();
clearTimeout( timeout );
}
}
examples['stopTouch'] = function() {
$.screen( "100x100" , 'canvasContainer');
$.startTouch();
$.setPinchZoom( false );
var count = 5;
$.print( count + " touches left" );
$.ontouch( "start", function ( touches ) {
	$.setColor( Math.floor( Math.random() * 9 ) + 1 );
	$.print( --count + " touches left" );
	var touch = touches[ 0 ];
	$.pset( touch.x, touch.y );
	if( count === 0 ) {
		$.stopTouch();
	}
} );
onExampleClose = function () {};
}
examples['swapColor'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.setColor( 2 );
$.print( "HELLO" );
$.swapColor( 2, "red" );
onExampleClose = function () {};
}
examples['width'] = function() {
$.screen( "300x200" , 'canvasContainer');
$.print( "Width: " + $.width() );
onExampleClose = function () {};
}
