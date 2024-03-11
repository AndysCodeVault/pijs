/*
* File: qbs-screen-print.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

// Print Command
qbs._.addCommand(
	"print", print, false, true, [ "msg", "inLine", "isCentered" ]
);
function print( screenData, args ) {
	var msg, inLine, isCentered, colors, parts, i, i2, colorCount;

	msg = args[ 0 ];
	inLine = args[ 1 ];
	isCentered = args[ 2 ];

	// bail if not possible to print an entire line on a screen
	if( screenData.printCursor.font.height > screenData.height ) {
		return;
	}

	if( screenData.printCursor.font.mode !== "bitmap" ) {

		// Grab the colors from the screenData
		colors = screenData.colors.slice();

		// Set the first color to the background color
		colors.unshift( screenData.pal[ 0 ] );

		// Make sure there are enough colors -- if not then rotate colors
		colorCount = colors.length;
		for( i = 0; i < screenData.printCursor.font.colorCount; i ++ ) {
			if( i >= colors.length ) {

				// Rotate colors -- skip 0
				i2 = ( i % ( colorCount - 1 ) ) + 1;
				colors.push( colors[ i2 ] );
			}
		}
	}

	if( msg === undefined ) {
		msg = "";
	} else if( typeof msg !== "string" ) {
		msg = "" + msg;
	}

	// Add tabs
	msg = msg.replace( /\t/g, "    " );

	// Split messages by \n
	parts = msg.split( /\n/ );
	for( i = 0; i < parts.length; i++ ) {
		startPrint( screenData, parts[ i ], inLine, isCentered, colors );
	}
}

function startPrint( screenData, msg, inLine, isCentered, colors ) {
	var width, overlap, onScreen, onScreenPct, msgSplit, index, msg1, msg2,
		printCursor;

	printCursor = screenData.printCursor;

	//Adjust if the text is too wide for the screen
	width = printCursor.font.calcWidth( screenData, msg );
	if( isCentered ) {
		printCursor.x = Math.floor(
			( printCursor.cols - msg.length ) / 2
		) * screenData.printCursor.font.width;
	}
	if(
		! inLine &&
		! isCentered &&
		width + printCursor.x > screenData.width && 
		msg.length > 1
	) {
		overlap = ( width + printCursor.x ) - screenData.width;
		onScreen = width - overlap;
		onScreenPct = onScreen / width;
		msgSplit = Math.floor( msg.length * onScreenPct );
		msg1 = msg.substring( 0, msgSplit );
		msg2 = msg.substring( msgSplit, msg.length );
		if( printCursor.breakWord ) {
			index = msg1.lastIndexOf( " " );
			if( index > -1 ) {
				msg2 = msg1.substring( index ).trim() + msg2;
				msg1 = msg1.substring( 0, index );
			}
		}
		startPrint( screenData, msg1, inLine, isCentered, colors );
		startPrint( screenData, msg2, inLine, isCentered, colors );
		return;
	}

	//Adjust if the text is too tall for the screen
	if( printCursor.y + printCursor.font.height > screenData.height ) {

		if( printCursor.font.mode === "canvas" ) {
			screenData.screenObj.render();
		}

		// Shift image up by the vertical size of the font
		shiftImageUp( screenData, printCursor.font.height );

		//Backup the print_cursor
		printCursor.y -= printCursor.font.height;

	}

	printCursor.font.printFunction( screenData, msg, printCursor.x,
		printCursor.y, colors
	);

	//If it's not in_line print the advance to next line
	if( ! inLine ) {
		printCursor.y += printCursor.font.height;
		printCursor.x = 0;
	} else {
		printCursor.x += printCursor.font.width * msg.length;
		if( printCursor.x > screenData.width - printCursor.font.width ) {
			printCursor.x = 0;
			printCursor.y += printCursor.font.height;
		}
	}
}

function shiftImageUp( screenData, yOffset ) {
	var x, y, iSrc, iDest, data;

	if( yOffset <= 0 ) {
		return;
	}

	// Get the image data
	m_qbData.commands.getImageData( screenData );

	y = yOffset;

	// Loop through all the pixels after the yOffset
	for( ; y < screenData.height; y++ ) {
		for( x = 0; x < screenData.width; x++ ) {

			// Get the index of the source pixel
			iDest = ( ( screenData.width * y ) + x ) * 4;

			// Get the index of the destination pixel
			iSrc = ( ( screenData.width * ( y - yOffset ) ) + x ) * 4;

			// Move the pixel up
			data = screenData.imageData.data;
			screenData.imageData.data[ iSrc ] = data[ iDest ];
			screenData.imageData.data[ iSrc + 1 ] = data[ iDest + 1 ];
			screenData.imageData.data[ iSrc + 2 ] = data[ iDest + 2 ];
			screenData.imageData.data[ iSrc + 3 ] = data[ iDest + 3 ];

		}
	}

	// Clear the bottom pixels
	for( y = screenData.height - yOffset; y < screenData.height; y++ ) {
		for( x = 0; x < screenData.width; x++ ) {
			iSrc = ( ( screenData.width * y ) + x ) * 4;
			screenData.imageData.data[ iSrc ] = 0;
			screenData.imageData.data[ iSrc + 1 ] = 0;
			screenData.imageData.data[ iSrc + 2 ] = 0;
			screenData.imageData.data[ iSrc + 3 ] = 0;
		}
	}

	m_qbData.commands.setImageDirty( screenData );

}

qbs._.addCommand( "qbsCalcWidth", qbsCalcWidth, true, false );
function qbsCalcWidth( screenData, msg ) {
	return screenData.printCursor.font.width * msg.length;
}

qbs._.addCommand( "canvasCalcWidth", canvasCalcWidth, true, false );
function canvasCalcWidth( screenData, msg ) {
	return screenData.context.measureText( msg ).width;
}

// Set Word Break Command
qbs._.addCommand( "setWordBreak", setWordBreak, false, true, [ "isEnabled" ] );
qbs._.addSetting( "wordBreak", setWordBreak, true, [ "isEnabled" ] );
function setWordBreak( screenData, args ) {
	screenData.printCursor.breakWord = !!( args[ 0 ] );
}

// Print to the screen by using qbs_fonts
qbs._.addCommand( "qbsPrint", qbsPrint, true, false );
function qbsPrint( screenData, msg, x, y, colors ) {
	var i, printCursor, defaultPal, charIndex;

	// Get reference to printCursor data
	printCursor = screenData.printCursor;

	// Setup a temporary pallette with the fore color and back color
	defaultPal = screenData.pal;
	screenData.pal = colors;

	//Loop through each character in the message and put it on the screen
	for( i = 0; i < msg.length; i++ ) {

		// Get the character index for the character data
		charIndex = printCursor.font.chars[ msg.charCodeAt( i ) ];

		// Draw the character on the screen
		screenData.screenObj.put(
			printCursor.font.data[ charIndex ],
			x + printCursor.font.width * i,
			y
		);
	}

	// Reset the palette to the default
	screenData.pal = defaultPal;
}

qbs._.addCommand( "canvasPrint", canvasPrint, true, false );
function canvasPrint( screenData, msg, x, y ) {
	screenData.screenObj.render();
	screenData.context.fillText( msg, x, y );
}

qbs._.addCommand( "bitmapPrint", bitmapPrint, true, false );
function bitmapPrint( screenData, msg, x, y ) {
	screenData.screenObj.render();
	var i, charIndex, sx, sy, width, columns, font;

	// Get reference to font data
	font = screenData.printCursor.font;

	width = font.image.width;
	columns = Math.floor( width / font.sWidth );

	//Loop through each character in the message and put it on the screen
	for( i = 0; i < msg.length; i++ ) {

		// Get the character index for the character data
		charIndex = font.chars[ msg.charCodeAt( i ) ];

		// Get the source x & y coordinates
		sx = ( charIndex % columns ) * font.sWidth;
		sy = Math.floor( charIndex / columns ) * font.sHeight;

		// Draw the character on the screen
		screenData.context.drawImage(
			font.image, sx, sy, font.sWidth, font.sHeight,
			x + font.width * i, y, font.width, font.height
		);
	}
}

// Set Pos Command
qbs._.addCommand( "setPos", setPos, false, true, [ "col", "row" ] );
qbs._.addSetting( "pos", setPos, true, [ "col", "row" ] );
function setPos( screenData, args ) {
	var col, row, x, y;

	col = args[ 0 ];
	row = args[ 1 ];

	// Set the x value
	if( col !== null ) {
		x = Math.floor( col * screenData.printCursor.font.width );
		if( x > screenData.width ) {
			x = screenData.width - screenData.printCursor.font.width;
		}
		screenData.printCursor.x = x;
	}

	// Set the y value
	if( row !== null ) {
		y = Math.floor( row * screenData.printCursor.font.height );
		if( y > screenData.height ) {
			y = screenData.height - screenData.printCursor.font.height;
		}
		screenData.printCursor.y = y;
	}
}

// Locate Px Command
qbs._.addCommand( "setPosPx", setPosPx, false, true, [ "x", "y" ] );
qbs._.addSetting( "posPx", setPosPx, true, [ "x", "y" ] );
function setPosPx( screenData, args ) {
	var x, y;

	x = args[ 0 ];
	y = args[ 1 ];

	if( ! isNaN( x ) ) {
		screenData.printCursor.x = parseInt( x );
	}
	if( ! isNaN( y ) ) {
		screenData.printCursor.y = parseInt( y );
	}
}

// Pos Command
qbs._.addCommand( "getPos", getPos, false, true, [] );
function getPos( screenData ) {
	return {
		"col": Math.floor(
			screenData.printCursor.x / screenData.printCursor.font.width
		),
		"row": Math.floor(
			screenData.printCursor.y / screenData.printCursor.font.height
		)
	};
}

qbs._.addCommand( "getCols", getCols, false, true, [] );
function getCols( screenData ) {
	return screenData.printCursor.cols;
}

qbs._.addCommand( "getRows", getRows, false, true, [] );
function getRows( screenData ) {
	return screenData.printCursor.rows;
}

// Pos Px Command
qbs._.addCommand( "getPosPx", getPosPx, false, true, [] );
function getPosPx( screenData ) {
	return {
		"x": screenData.printCursor.x,
		"y": screenData.printCursor.y
	};
}

// End of File Encapsulation
} )();
