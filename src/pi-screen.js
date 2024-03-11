/*
* File: pi-screen.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, pi;

pi = window.pi;
m_piData = pi._.data;

// Pi.js Core API
// State Function
// Creates a new screen object
pi._.addCommand( "screen", screen, false, false,
	[ "aspect", "container", "isOffscreen", "willReadFrequently", "noStyles", "isMultiple",
	"resizeCallback" ]
);
function screen( args ) {

	var aspect, container, isOffscreen, willReadFrequently, noStyles, isMultiple, resizeCallback,
		aspectData, screenObj, screenData, i, commandData;

	// Input from args
	aspect = args[ 0 ];
	container = args[ 1 ];
	isOffscreen = args[ 2 ];
	willReadFrequently = !!( args[ 3 ] );
	noStyles = args[ 4 ];
	isMultiple = args[ 5 ];
	resizeCallback = args[ 6 ];

	if( resizeCallback != null && ! pi.util.isFunction( resizeCallback ) ) {
		m_piData.log(
			"screen: resizeCallback must be a function."
		);
		return;
	}

	if( typeof aspect === "string" && aspect !== "" ) {
		aspect = aspect.toLowerCase();
		aspectData = parseAspect( aspect );
		if( ! aspectData ) {
			m_piData.log(
				"screen: invalid value for aspect."
			);
			return;
		}
		aspectData.isMultiple = !!( isMultiple );
	}

	if( isOffscreen ) {
		if( ! aspectData ) {
			m_piData.log(
				"screen: You must supply an aspect ratio with exact dimensions for " +
				"offscreen screens."
			);
			return;
		}
		if( aspectData.splitter !== "x" ) {
			m_piData.log(
				"screen: You must use aspect ratio with e(x)act pixel dimensions such" +
				" as 320x200 offscreen screens."
			);
			return;
		}
		screenData = createOffscreenScreen( aspectData, willReadFrequently );
	} else {
		if( typeof container === "string" ) {
			container = document.getElementById( container );
		}
		if( container && ! pi.util.isDomElement( container ) ) {
			m_piData.log( "screen: Invalid argument container. Container must be a" +
				" DOM element or a string id of a DOM element."
			);
			return;
		}
		if( noStyles ) {
			screenData = createNoStyleScreen( aspectData, container, willReadFrequently );
		} else {
			screenData = createScreen( aspectData, container, resizeCallback, willReadFrequently );
		}
	}

	screenData.cache = {
		"findColor": {}
	};

	// Setup commands
	screenObj = {};
	screenData.commands = {};

	// Loop through all the screen commands
	for( i in m_piData.screenCommands ) {

		commandData = m_piData.screenCommands[ i ];
		screenData.commands[ i ] = commandData.fn;

		// Setup the api
		setupApiCommand( screenObj, i, screenData, commandData );

	}

	// Assign a reference to the object
	screenData.screenObj = screenObj;

	// Assign the id of the screen
	screenObj.id = screenData.id;
	screenObj.screen = true;

	return screenObj;

};

function setupApiCommand( screenObj, name, screenData, cmd ) {
	screenObj[ name ] = function () {
		var args = m_piData.commands.parseOptions( cmd, [].slice.call( arguments ) );
		return screenData.commands[ name ]( screenData, args );
	};
}

// Parses the aspect ratio string
function parseAspect( aspect ) {
	var width, height, parts, splitter;

	// 2 Types of ratio's pct or exact pixels
	if( aspect.indexOf( ":" ) > -1 ) {
		splitter = ":";
	} else if( aspect.indexOf( "x" ) > -1 ) {
		splitter = "x";
	} else if ( aspect.indexOf( "e" ) ) {
		splitter = "e";
	}

	parts = aspect.split( splitter );

	// Get the width and validate it
	width = Number( parts[ 0 ] );
	if( isNaN( width ) || width === 0 ) {
		return;
	}

	// Get the height and validate it
	height = Number( parts[ 1 ] );
	if( isNaN( height ) || height === 0 ) {
		return;
	}

	return {
		"width": width,
		"height": height,
		"splitter": splitter
	};
}

// Create's a new offscreen canvas
function createOffscreenScreen( aspectData, willReadFrequently ) {
	var canvas, bufferCanvas;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	canvas.width = aspectData.width;
	canvas.height = aspectData.height;
	bufferCanvas = document.createElement( "canvas" );
	bufferCanvas.width = aspectData.width;
	bufferCanvas.height = aspectData.height;

	return createScreenData( canvas, bufferCanvas, null, aspectData, true,
		false, null, willReadFrequently
	);
}

// Create a new canvas
function createScreen( aspectData, container, resizeCallback, willReadFrequently ) {
	var canvas, bufferCanvas, size, isContainer;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	bufferCanvas = document.createElement( "canvas" );

	// Style the canvas
	canvas.style.backgroundColor = "black";
	canvas.style.position = "absolute";
	canvas.style.imageRendering = "pixelated";
	canvas.style.imageRendering = "crisp-edges";

	// If no container applied then use document body.
	isContainer = true;
	if( ! pi.util.isDomElement( container ) ) {
		isContainer = false;
		document.documentElement.style.height = "100%";
		document.documentElement.style.margin = "0";
		document.body.style.height = "100%";
		document.body.style.margin = "0";
		document.body.style.overflow = "hidden";
		canvas.style.left = "0";
		canvas.style.top = "0";
		container = document.body;
	}

	// Make sure the container is not blank
	if( container.offsetHeight === 0 ) {
		container.style.height = "200px";
	}

	// Append the canvas to the container
	container.appendChild( canvas );

	if( aspectData ) {

		// Calculate the size of the container
		size = getSize( container );

		// Set the canvas size
		setCanvasSize( aspectData, canvas, size.width, size.height );

		// Set the buffer size
		bufferCanvas.width = canvas.width;
		bufferCanvas.height = canvas.height;

	} else {

		// If canvas is inside an element then apply static position
		if( isContainer ) {
			canvas.style.position = "static";
		}

		// Set canvas to fullscreen
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		size = getSize( canvas );
		canvas.width = size.width;
		canvas.height = size.height;
		bufferCanvas.width = size.width;
		bufferCanvas.height = size.height;
	}
	return createScreenData( canvas, bufferCanvas, container, aspectData, false,
		false, resizeCallback, willReadFrequently
	);
}

function createNoStyleScreen( aspectData, container, willReadFrequently ) {
	var canvas, bufferCanvas, size;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	bufferCanvas = document.createElement( "canvas" );

	// If no container applied then use document body.
	if( ! pi.util.isDomElement( container ) ) {
		container = document.body;
	}

	// Append the canvas to the container
	container.appendChild( canvas );

	if( aspectData && aspectData.splitter === "x" ) {

		// Set the buffer size
		canvas.width = aspectData.width;
		canvas.height = aspectData.height;
		bufferCanvas.width = canvas.width;
		bufferCanvas.height = canvas.height;

	} else {
		size = getSize( canvas );
		bufferCanvas.width = size.width;
		bufferCanvas.height = size.height;
	}
	return createScreenData( canvas, bufferCanvas, container, aspectData, false,
		true, null, willReadFrequently
	);
}

// Create the screen data
function createScreenData(
	canvas, bufferCanvas, container, aspectData, isOffscreen, isNoStyles,
	resizeCallback, willReadFrequently
) {
	var screenData = {};

	// Set the screen id
	screenData.id = m_piData.nextScreenId;
	m_piData.nextScreenId += 1;
	m_piData.activeScreen = screenData;

	// Set the screenId on the canvas
	canvas.dataset.screenId = screenData.id;

	if( willReadFrequently ) {
		screenData.contextAttributes = { "willReadFrequently": true };
	} else {
		screenData.contextAttributes = {};
	}

	// Set the screen default data
	screenData.canvas = canvas;
	screenData.width = canvas.width;
	screenData.height = canvas.height;
	screenData.container = container;
	screenData.aspectData = aspectData;
	screenData.isOffscreen = isOffscreen;
	screenData.isNoStyles = isNoStyles;
	screenData.context = canvas.getContext( "2d", screenData.contextAttributes );
	screenData.bufferCanvas = bufferCanvas;
	screenData.bufferContext = screenData.bufferCanvas.getContext(
		"2d", screenData.contextAttributes );
	screenData.dirty = false;
	screenData.isAutoRender = true;
	screenData.autoRenderMicrotaskScheduled = false;
	screenData.x = 0;
	screenData.y = 0;
	screenData.angle = 0;
	screenData.pal = m_piData.defaultPalette.slice();
	screenData.fColor = screenData.pal[ m_piData.defaultColor ];
	screenData.context.fillStyle = screenData.fColor.s;
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.mouseStarted = false;
	screenData.touchStarted = false;
	screenData.printCursor = {
		"x": 0,
		"y": 0,
		"font": m_piData.defaultFont,
		"rows": Math.floor( canvas.height / m_piData.defaultFont.height ),
		"cols": Math.floor( canvas.width / m_piData.defaultFont.width ),
		"prompt": m_piData.defaultPrompt,
		"breakWord": true
	};
	screenData.clientRect = canvas.getBoundingClientRect();
	screenData.mouse = {
		"x": -1,
		"y": -1,
		"buttons": 0,
		"lastX": -1,
		"lastY": -1
	};
	screenData.touches = {};
	screenData.lastTouches = {};
	screenData.pixelMode = true;
	screenData.pen = {
		"draw": m_piData.defaultPenDraw,
		"size": 1
	};
	screenData.blendPixelCmd = m_piData.defaultBlendCmd;

	// Disable anti aliasing
	screenData.context.imageSmoothingEnabled = false;

	// Event listeners
	screenData.onMouseEventListeners = {};
	screenData.onTouchEventListeners = {};
	screenData.onPressEventListeners = {};
	screenData.onClickEventListeners = {};
	screenData.mouseEventListenersActive = 0;
	screenData.touchEventListenersActive = 0;
	screenData.pressEventListenersActive = 0;
	screenData.clickEventListenersActive = 0;
	screenData.lastEvent = null;

	// Right click is enabled
	screenData.isContextMenuEnabled = true;

	// Resize callback
	screenData.resizeCallback = resizeCallback;

	// Set this to the active screen
	m_piData.screens[ screenData.id ] = screenData;

	return screenData;
}

// Sets the canvas size
function setCanvasSize( aspectData, canvas, maxWidth, maxHeight ) {
	var width, height, newWidth, newHeight, splitter, ratio1, ratio2, size,
		factor, factorX, factorY;

	width = aspectData.width;
	height = aspectData.height;
	splitter = aspectData.splitter;

	// If set size to exact multiple
	if( aspectData.isMultiple && splitter !== ":" ) {
		factorX = Math.floor( maxWidth / width );
		factorY = Math.floor( maxHeight / height );
		if( factorX > factorY ) {
			factor = factorY;
		} else {
			factor = factorX;
		}
		if( factor < 1 ) {
			factor = 1;
		}
		newWidth = width * factor;
		newHeight = height * factor;
	} else {

		// Calculate the screen ratios
		ratio1 = height / width;
		ratio2 = width / height;
		newWidth = maxHeight * ratio2;
		newHeight = maxWidth * ratio1;

		// Calculate the best fit
		if( newWidth > maxWidth ) {
			newWidth = maxWidth;
			newHeight = newWidth * ratio1;
		} else {
			newHeight = maxHeight;
		}
	}

	// Set the size
	canvas.style.width = Math.floor( newWidth ) + "px";
	canvas.style.height = Math.floor( newHeight ) + "px";

	// Set the margins
	canvas.style.marginLeft = Math.floor( ( maxWidth - newWidth ) / 2 ) + "px";
	canvas.style.marginTop = Math.floor( ( maxHeight - newHeight ) / 2 ) + "px";

	// Extending the canvas to match container size
	if( splitter === "e" ) {

		// Extend as many pixels that fit
		if( aspectData.isMultiple ) {

			width = Math.floor( maxWidth / factor );
			height = Math.floor( maxHeight / factor );
			newWidth = width * factor;
			newHeight = height * factor;
		} else {

			// Add the margin size to width and height
			width += Math.round( ( maxWidth - newWidth ) * ( width / newWidth ) );
			height += Math.round(
				( maxHeight - newHeight ) * ( height / newHeight )
			);
			newWidth = maxWidth;
			newHeight = maxHeight;

		}

		// Reset the margins after adjustments
		canvas.style.marginLeft = Math.floor( ( maxWidth - newWidth ) / 2 ) + "px";
		canvas.style.marginTop = Math.floor( ( maxHeight - newHeight ) / 2 ) + "px";

		// Reset the canvas size after adjustments
		canvas.style.width = newWidth + "px";
		canvas.style.height = newHeight + "px";
		canvas.width = width;
		canvas.height = height;

	} else if( splitter === "x" ) {

		// Set canvas size to be exact specified from the aspect ratio
		canvas.width = width;
		canvas.height = height;

	} else {

		// Set the canvas size to the compute canvas size
		size = getSize( canvas );
		canvas.width = size.width;
		canvas.height = size.height;

	}
}

// Resizes all screens
function resizeScreens() {
	var i, screenData, size, fromSize, toSize;

	for( i in m_piData.screens ) {
		screenData = m_piData.screens[ i ];

		// Skip if screen is not visible
		if(
			screenData.isOffscreen ||
			screenData.isNoStyles ||
			screenData.canvas.offsetParent === null
		) {
			continue;
		}

		// Store the previous size
		fromSize = {
			"width": screenData.canvas.offsetWidth,
			"height": screenData.canvas.offsetHeight
		};

		// Draw the canvas to the buffer
		screenData.bufferContext.clearRect( 0, 0, screenData.width,
			screenData.height
		);
		screenData.bufferContext.drawImage( screenData.canvas, 0, 0 );

		if( screenData.aspectData ) {

			// Update the canvas to the new size
			size = getSize( screenData.container );
			setCanvasSize(
				screenData.aspectData, screenData.canvas, size.width,
				size.height
			);

		} else {

			// Update canvas to fullscreen absolute pixels
			size = getSize( screenData.canvas );
			screenData.canvas.width = size.width;
			screenData.canvas.height = size.height;

		}

		// Resize the client rectangle
		screenData.clientRect = screenData.canvas.getBoundingClientRect();

		// Draw the buffer back onto the canvas
		screenData.context.drawImage( screenData.bufferCanvas, 0, 0,
			screenData.width, screenData.height
		);

		m_piData.commands.resetImageData( screenData );

		// Set the new buffer size
		screenData.bufferCanvas.width = screenData.canvas.width;
		screenData.bufferCanvas.height = screenData.canvas.height;

		// Set the new screen size
		screenData.width = screenData.canvas.width;
		screenData.height = screenData.canvas.height;

		// Send the resize data to the client
		if( screenData.resizeCallback ) {
			toSize = {
				"width": screenData.canvas.offsetWidth,
				"height": screenData.canvas.offsetHeight
			};
			if(
				fromSize.width !== toSize.width ||
				fromSize.height !== toSize.height
			) {
				screenData.resizeCallback( fromSize, toSize );
			}
		}
	}
}

function getSize( element ) {
	var computedStyle, paddingX, paddingY, borderX, borderY, elementWidth,
		elementHeight;

	computedStyle = getComputedStyle( element );

	// Compute the padding
	paddingX = parseFloat( computedStyle.paddingLeft ) +
		parseFloat( computedStyle.paddingRight );
	paddingY = parseFloat( computedStyle.paddingTop ) +
		parseFloat( computedStyle.paddingBottom );

	// Compute the borders
	borderX = parseFloat( computedStyle.borderLeftWidth ) +
		parseFloat( computedStyle.borderRightWidth );
	borderY = parseFloat( computedStyle.borderTopWidth ) +
		parseFloat( computedStyle.borderBottomWidth );

	// Compute the dimensions
	elementWidth = element.offsetWidth - paddingX - borderX;
	elementHeight = element.offsetHeight - paddingY - borderY;

	return {
		"width": elementWidth,
		"height": elementHeight
	};
}

// Any time the screen resizes need to resize canvas too
m_piData.defaultInputFocus.addEventListener( "resize", resizeScreens );

// End of File Encapsulation
} )();
