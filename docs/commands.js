var commands = [{
		"name": "arc",
		"description": "Draws an arc on the screen.",
		"isScreen": true,
		"parameters": [ "x", "y", "radius", "angle1", "angle2" ],
		"pdata": [
			"The x coordinate of the center point of the arc's circle.",
			"The y coordinate of the center point of the arc's circle.",
			"The radius of the arc's circle.",
			"The starting angle.",
			"The ending angle."
		],
		"seeAlso": [ "bezier", "circle", "draw", "ellipse", "line", "paint", "pset", ],
		"example": `$.screen("300x200");\n$.arc(150, 100, 50, 45, 270);\n`
	}, {
		"name": "bezier",
		"description": "Draws a bezier curve on the screen.",
		"isScreen": true,
		"parameters": [ "xStart", "yStart", "x1", "y1", "x2", "y2", "xEnd", "yEnd" ],
		"pdata": [
			"The x coordinate of the starting point of the line.",
			"The y coordinate of the starting point of the line.",
			"The x coordinate of the first control point.",
			"The y coordinate of the first control point.",
			"The x coordinate of the second control point.",
			"The y coordinate of the second control point.",
			"The x coordinate of the ending point of the line.",
			"The y coordinate of the ending point of the line."
		],
		"seeAlso": [ "arc", "circle", "draw", "ellipse", "line", "paint", "pset", ],
		"example": `$.screen("300x200");
$.bezier({
	"xStart": 15,
	"yStart": 10,
	"x1": 45,
	"y1": 135,
	"x2": 195,
	"y2": 75,
	"xEnd": 280,
	"yEnd": 185
});`
	}, {
		"name": "cancelInput",
		"description": "Cancels all previous input commands.",
		"isScreen": true,
		"parameters": [ "name" ],
		"pdata": [ "The name provided to the input command." ],
		"seeAlso": [ "input" ],
		"example": `$.screen("300x200");
$.print("\\n");
$.input("What is your name?", null);
$.onkey( "Escape", "down", function () {  
	$.print("\\nInput Canceled");
	$.cancelInput();
}, true );`
	}, {
		"name": "cancelInput",
		"description": "Cancels an input command.",
		"isScreen": true,
		"parameters": [ "name" ],
		"pdata": [ "The name provided to the input command." ],
		"seeAlso": [ "input" ],
		"example": `$.screen("300x200");
$.print("\\n");
$.input("What is your name?", null, "name");
$.onkey( "Escape", "down", function () {
	$.print("\\nInput Canceled");
	$.cancelInput("name");
}, true);`
	}, {
		"name": "canvas",
		"description": "Returns the canvas element used by the screen.",
		"isScreen": true,
		"parameters": [],
		"example": `$.screen("300x200");
$.canvas().className = "purple";
$.print("\\n\\nThe background is now purple.")`
	}, {
		"name": "circle",
		"description": "Draws a circle on the screen.",
		"isScreen": true,
		"parameters": [ "x", "y", "radius", "fillColor" ],
		"pdata": [
			"The x coordinate of the center of the circle.",
			"The y coordinate of the center of the circle.",
			"The radius of the circle.",
			"[OPTIONAL]. The fill color for the circle."
		],
		"seeAlso": [ "arc", "bezier", "draw", "ellipse", "line", "paint", "pset" ],
		"example": `$.screen("300x200");
$.circle(150, 100, 50, "red");`
	}, {
		"name": "clearKeys",
		"description": "Clears event handlers for keyboard events.",
		"isScreen": false,
		"parameters": [],
		"seeAlso": [ "onkey" ],
		"example": `$.screen("300x200");
$.print("\\n");
$.onkey( "any", "down", function (key) {
	$.print(key.key + " pressed.");
});
$.onkey( "Escape", "down", function (key) {
	$.print(key.key + " pressed.");
	$.clearKeys();
});`
	}, {
		"name": "cls",
		"description": "Clears the screen.",
		"isScreen": true,
		"parameters": [],
		"example": `$.screen("300x200");
$.line(0, 0, 300, 200);
$.onkey("any", "down", function () {
	$.cls();
});`
	}, {
		"name": "createAudioPool",
		"description": "Creates a group of audio players that can play sounds.",
		"isScreen": false,
		"parameters": [ "src", "poolSize" ],
		"pdata": [ "The source of the audio file.", "The number of audio players." ],
		"seeAlso": [ "deleteAudioPool", "playAudioPool", "setVolume", "stopAudioPool" ],
		"example": `var bombPool = $.createAudioPool("bomb.wav", 1);
$.ready(function () {
	$.playAudioPool(bombPool);
});`
	},/* {
		"name": "createTrack",
		"isScreen": false,
		"parameters": ["playString"]
	}, */{
		"name": "deleteAudioPool",
		"description": "Deletes an audio pool.",
		"isScreen": false,
		"parameters": [ "audioId" ],
		"pdata": [ "The id of the audio pool." ],
		"seeAlso": [ "createAudioPool", "playAudioPool", "setVolume", "stopAudioPool" ],
		"example": `var bombPool = $.createAudioPool("bomb.wav", 1);
$.deleteAudioPool(bombPool);`
	}, {
		"name": "draw",
		"description": "Draws lines on the screen defined by a string.",
		"isScreen": true,
		"parameters": [ "drawString" ],
		"pdata": [ `Case insensitive string that contains commands for drawing.
	"B" (blind) before a line move designates that the line move will be hidden.
	"C n" designates the color attribute.
	"M x, y" can move to another coordinate area of the screen.
	"N" Will return to the starting position after the line is drawn.
	"P f" is used to paint enclosed objects.
	"D n" draws a line vertically DOWN n pixels.
	"E n" draws a diagonal / line going UP and RIGHT n pixels each direction.
	"F n" draws a diagonal \ line going DOWN and RIGHT n pixels each direction.
	"G n" draws a diagonal / LINE going DOWN and LEFT n pixels each direction.
	"H n" draws a diagonal \ LINE going UP and LEFT n pixels each direction.
	"L n" draws a line horizontally LEFT n pixels.
	"R n" draws a line horizontally RIGHT n pixels.
	"U n" draws a line vertically UP n pixels.
	"A n" can use values of 1 to 3 to rotate up to 3 90 degree(270) angles.
	"TA n" can use any n angle from -360 to 0 to 360 to rotate a DRAW (Turn Angle).`
		],
		"seeAlso": [ "arc", "bezier", "circle", "ellipse", "line", "paint", "pset" ],
		"example": `$.screen("300x200");
$.pset(150, 100);
$.draw("C9 U2 G2 L C15 NU4 BR3 C9 U2 R ");
$.draw("D2 R U2 D C10 R D L R D R U R U L");
$.draw("BU2 BL2 C6 L U L R3 L UC8 L BD6 ");
$.draw("BL C9 D2 R C8 U2 C9 R D2");`
	}, {
		"name": "drawImage",
		"description": "Draws an image on to the screen.",
		"isScreen": true,
		"parameters": ["name", "x", "y", "angle", "anchorX", "anchorY", "alpha"],
		"pdata": [
			"Name or id of the image.", "Horizontal coordiante.", "Vertical coordinate.",
			"Rotate the image in degrees.", "Horizontal rotation coordinate.",
			"Vertical rotation coordinate.", "Transparency amount number 0-100."
		],
		"example": `$.screen("300x200");
var monkey = $.loadImage("monkey.png");
$.ready(function () {
	$.drawImage(monkey, 150, 100, 0, 0.5, 0.5);
});`
	}, {
		"name": "drawSprite",
		"isScreen": true,
		"parameters": [ "name", "frame", "x", "y", "angle", "anchorX", "anchorY", "img", "alpha" ],
		"pdata": [
			"Name or id of the image.", "Horizontal coordiante.", "Vertical coordinate.",
			"Rotate the image in degrees.", "Horizontal rotation coordinate.",
			"Vertical rotation coordinate.", "Transparency amount number 0-100."
		],
		"seeAlso": [ "loadSpritesheet" ],
		"example": `$.screen("300x200");
var monkey = $.loadSpritesheet("monkey.png", 32, 32, 1);
$.ready(function () {
	var frame = 0;
	var interval = setInterval(run, 500);
	function run() {
		frame += 1;
		$.cls();
		$.drawSprite(monkey, frame % 2, 150, 100, 0, 0.5, 0.5);
	}
	run();
	setTimeout(function () {
		clearInterval(interval);
	}, 2000);
});`
	}, {
		"name": "ellipse",
		"isScreen": true,
		"parameters": ["x", "y", "radiusX", "radiusY", "fillColor"],
		"pdata": [
			"Horizontal coordiante.", "Vertical coordinate.",
			"Horizontal radius.", "Vertical radius",
			""
			
		],
		"seeAlso": [ "arc", "bezier", "circle", "draw", "line", "paint", "pset" ],
		"example": `$.screen("300x200");
$.ellipse(150, 100, 50, 80, "blue");`
	}, {
		"name": "filterImg",
		"isScreen": true,
		"parameters": ["filter"],
		"pdata": [ "Function to be called on each pixel."],
		"seeAlso": [],
		"example": `$.screen("300x200");
$.circle(150, 100, 50, "red");
$.filterImg( function ( color, x, y ) {
	color.r = color.r - Math.round( Math.tan( ( x + y ) / 10 ) * 128 );
	color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );
	color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );
	return color;
} );`
	}, {
		"name": "findColor",
		"isScreen": true,
		"parameters": ["color", "tolerance", "isAddToPalette"]
	}, {
		"name": "get",
		"isScreen": true,
		"parameters": ["x1", "y1", "x2", "y2", "tolerance"]
	}, {
		"name": "getCols",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "getDefaultPal",
		"isScreen": false,
		"parameters": []
	}, {
		"name": "getPal",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "getPixel",
		"isScreen": true,
		"parameters": ["x", "y"]
	}, {
		"name": "getPos",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "getPosPx",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "getRows",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "getScreen",
		"isScreen": false,
		"parameters": ["screenId"]
	}, {
		"name": "height",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "ingamepads",
		"isScreen": false,
		"parameters": ["gamePad"]
	}, {
		"name": "inkey",
		"isScreen": false,
		"parameters": ["key"]
	}, {
		"name": "inmouse",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "inpress",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "input",
		"isScreen": true,
		"parameters": ["prompt", "callback", "name", "isNumber", "isInteger", "allowNegative", "onscreenKeyboard"]
	}, {
		"name": "inputReady",
		"isScreen": false,
		"parameters": ["fn"]
	}, {
		"name": "intouch",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "line",
		"isScreen": true,
		"parameters": ["x1", "y1", "x2", "y2"]
	}, {
		"name": "loadFont",
		"isScreen": false,
		"parameters": ["fontSrc", "width", "height", "charSet", "isBitmap", "isEncoded"]
	}, {
		"name": "loadImage",
		"isScreen": false,
		"parameters": ["src", "name"]
	}, {
		"name": "loadSpritesheet",
		"isScreen": false,
		"parameters": ["src", "width", "height", "margin", "name"]
	}, {
		"name": "offclick",
		"isScreen": true,
		"parameters": ["fn", "once", "hitBox"]
	}, {
		"name": "offgamepad",
		"isScreen": false,
		"parameters": ["gamepadIndex", "mode", "item", "fn"]
	}, {
		"name": "offkey",
		"isScreen": false,
		"parameters": ["key", "mode", "fn"]
	}, {
		"name": "offmouse",
		"isScreen": true,
		"parameters": ["eventName", "fn"]
	}, {
		"name": "offpress",
		"isScreen": true,
		"parameters": ["mode", "fn", "once", "hitBox"]
	}, {
		"name": "offtouch",
		"isScreen": true,
		"parameters": ["mode", "fn"]
	}, {
		"name": "onclick",
		"isScreen": true,
		"parameters": ["fn", "once", "hitBox", "customData"]
	}, {
		"name": "ongamepad",
		"isScreen": false,
		"parameters": ["gamepadIndex", "mode", "item", "fn", "once", "customData"]
	}, {
		"name": "onkey",
		"isScreen": false,
		"parameters": ["key", "mode", "fn", "once"]
	}, {
		"name": "onmouse",
		"isScreen": true,
		"parameters": ["mode", "fn", "once", "hitBox", "customData"]
	}, {
		"name": "onpress",
		"isScreen": true,
		"parameters": ["mode", "fn", "once", "hitBox", "customData"]
	}, {
		"name": "ontouch",
		"isScreen": true,
		"parameters": ["mode", "fn", "once", "hitBox", "customData"]
	}, {
		"name": "paint",
		"isScreen": true,
		"parameters": ["x", "y", "fillColor", "tolerance"]
	}, {
		"name": "play",
		"isScreen": false,
		"parameters": ["playString"]
	}, {
		"name": "playAudioPool",
		"isScreen": false,
		"parameters": ["audioId", "volume", "startTime", "duration"]
	}, {
		"name": "point",
		"isScreen": true,
		"parameters": ["x", "y"]
	}, {
		"name": "print",
		"isScreen": true,
		"parameters": ["msg", "inLine", "isCentered"]
	}, {
		"name": "printTable",
		"isScreen": true,
		"parameters": ["items", "tableFormat", "borderStyle", "isCentered"]
	}, {
		"name": "pset",
		"isScreen": true,
		"parameters": ["x", "y"]
	}, {
		"name": "put",
		"isScreen": true,
		"parameters": ["data", "x", "y", "includeZero"]
	}, {
		"name": "ready",
		"isScreen": false,
		"parameters": ["fn"]
	}, {
		"name": "rect",
		"isScreen": true,
		"parameters": ["x", "y", "width", "height", "fillColor"]
	}, {
		"name": "removeAllScreens",
		"isScreen": false,
		"parameters": []
	}, {
		"name": "removeScreen",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "render",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "screen",
		"isScreen": false,
		"parameters": ["aspect", "container", "isOffscreen", "noStyles", "isMultiple", "resizeCallback"]
	}, {
		"name": "set",
		"isScreen": true,
		"parameters": ["screen", "defaultPal", "errorMode", "actionKey", "inputCursor", "defaultFont", "font", "fontSize", "enableContextMenu", "pinchZoom", "bgColor", "containerBgColor", "pixelMode", "palColor", "color", "colors", "pen", "wordBreak", "pos", "posPx", "volume"],
		"isSet": true,
		"noParse": true
	}, {
		"name": "setActionKey",
		"isScreen": false,
		"parameters": ["key", "isEnabled"]
	}, {
		"name": "setAutoRender",
		"isScreen": true,
		"parameters": ["isAutoRender"]
	}, {
		"name": "setBgColor",
		"isScreen": true,
		"parameters": ["color"]
	}, {
		"name": "setColor",
		"isScreen": true,
		"parameters": ["color", "isAddToPalette"]
	}, {
		"name": "setColors",
		"isScreen": true,
		"parameters": ["colors"]
	}, {
		"name": "setContainerBgColor",
		"isScreen": true,
		"parameters": ["color"]
	}, {
		"name": "setDefaultFont",
		"isScreen": false,
		"parameters": ["fontId"]
	}, {
		"name": "setDefaultPal",
		"isScreen": false,
		"parameters": ["pal"]
	}, {
		"name": "setEnableContextMenu",
		"isScreen": true,
		"parameters": ["isEnabled"]
	}, {
		"name": "setErrorMode",
		"isScreen": false,
		"parameters": ["mode"]
	}, {
		"name": "setFont",
		"isScreen": true,
		"parameters": ["fontId"]
	}, {
		"name": "setFontSize",
		"isScreen": true,
		"parameters": ["width", "height"]
	}, {
		"name": "setInputCursor",
		"isScreen": true,
		"parameters": ["cursor"]
	}, {
		"name": "setPalColor",
		"isScreen": true,
		"parameters": ["index", "color"]
	}, {
		"name": "setPen",
		"isScreen": true,
		"parameters": ["pen", "size", "noise"]
	}, {
		"name": "setPinchZoom",
		"isScreen": false,
		"parameters": ["isEnabled"]
	}, {
		"name": "setPixelMode",
		"isScreen": true,
		"parameters": ["isEnabled"]
	}, {
		"name": "setPos",
		"isScreen": true,
		"parameters": ["col", "row"]
	}, {
		"name": "setPosPx",
		"isScreen": true,
		"parameters": ["x", "y"]
	}, {
		"name": "setScreen",
		"isScreen": false,
		"parameters": ["screen"]
	}, {
		"name": "setVolume",
		"isScreen": false,
		"parameters": ["volume"]
	}, {
		"name": "setWordBreak",
		"isScreen": true,
		"parameters": ["isEnabled"]
	}, {
		"name": "sound",
		"isScreen": false,
		"parameters": ["frequency", "duration", "volume", "oType", "delay", "attack", "decay"]
	}, {
		"name": "startKeyboard",
		"isScreen": false,
		"parameters": []
	}, {
		"name": "startMouse",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "startTouch",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "stopAudioPool",
		"isScreen": false,
		"parameters": ["audioId"]
	}, {
		"name": "stopGamepads",
		"isScreen": false,
		"parameters": []
	}, {
		"name": "stopKeyboard",
		"isScreen": false,
		"parameters": []
	}, {
		"name": "stopMouse",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "stopPlay",
		"isScreen": false,
		"parameters": ["trackId"]
	}, {
		"name": "stopSound",
		"isScreen": false,
		"parameters": ["soundId"]
	}, {
		"name": "stopTouch",
		"isScreen": true,
		"parameters": []
	}, {
		"name": "swapColor",
		"isScreen": true,
		"parameters": ["oldColor", "newColor"]
	},{
		"name": "util.checkColor",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	},  {
		"name": "util.clamp",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.colorStringToHex",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.compareColors",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.convertToArray",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.convertToColor",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.copyProperties",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.cToHex",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.degreesToRadian",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.deleteProperties",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.getWindowSize",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.hexToColor",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.inRange",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.inRange2",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.isArray",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.isInteger",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.math",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.pad",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.padL",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.padR",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.queueMicrotask",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.radiansToDegrees",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.rgbToColor",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.rgbToHex",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "util.rndRange",
		"isScreen": false,
		"isUtil": true,
		"parameters": []
	}, {
		"name": "width",
		"isScreen": true,
		"parameters": []
	}
]

module.exports = commands;
