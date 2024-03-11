/*
* File: qbs-font.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_qbWait, m_qbResume;

m_qbData = qbs._.data;
m_qbWait = qbs._.wait;
m_qbResume = qbs._.resume;

// Loads a font into memory
qbs._.addCommand( "loadFont", loadFont, false, false,
	[ "fontSrc", "width", "height", "charSet", "isBitmap", "isEncoded" ] );
function loadFont( args ) {
	var fontSrc, width, height, charSet, isBitmap, isEncoded, font, chars, i,
		temp;

	fontSrc = args[ 0 ];
	width = args[ 1 ];
	height = args[ 2 ];
	charSet = args[ 3 ];
	isBitmap = !!( args[ 4 ] );
	isEncoded = !!( args[ 5 ] );

	// Default charset to 0 to 255
	if( ! charSet ) {
		charSet = [];
		for( i = 0; i < 256; i += 1 ) {
			charSet.push( i );
		}
	}

	if( ! ( qbs.util.isArray( charSet ) || typeof charSet === "string" ) ) {
		m_qbData.log( "loadFont: charSet must be an array or a string." );
		return;
	}

	// Convert charSet to array of integers
	if( typeof charSet === "string" ) {
		temp = [];
		for( i = 0; i < charSet.length; i += 1 ) {
			temp.push( charSet.charCodeAt( i ) );
		}
		charSet = temp;
	}

	// Load the chars
	chars = {};
	for( i = 0; i < charSet.length; i += 1 ) {
		chars[ charSet[ i ] ] = i;
	}

	// Set the font data
	font = {
		"id": m_qbData.nextFontId,
		"width": width,
		"height": height,
		"data": [],
		"chars": chars,
		"charSet": charSet,
		"colorCount": 2,
		"mode": "pixel",
		"printFunction": m_qbData.commands.qbsPrint,
		"calcWidth": m_qbData.commands.qbsCalcWidth,
		"image": null,
		"sWidth": width,
		"sHeight": height
	};

	if( isBitmap ) {
		font.mode = "bitmap";
		font.printFunction = m_qbData.commands.bitmapPrint;
	}

	// Add this to the font data
	m_qbData.fonts[ font.id ] = font;

	// Increment the next font id
	m_qbData.nextFontId += 1;

	if( isEncoded ) {
		loadFontFromBase32Encoded( fontSrc, width, height, font );
	} else {
		loadFontFromImg( fontSrc, width, height, font, isBitmap );
	}

	return font.id;
}

function loadFontFromBase32Encoded( fontSrc, width, height, font ) {
	font.data = decompressFont( fontSrc, width, height );
}

function decompressFont( numStr, width, height ) {
	var i, j, bin, nums, num, size, base, x, y, data, index;

	size = 32;
	base = 32;
	bin = "";
	data = [];
	//numStr = lzw_decode( numStr );
	numStr = "" + numStr;
	nums = numStr.split( "," );

	// Loop through all the nums
	for( i = 0; i < nums.length; i++ ) {

		// Convert the string to base number then to binary string
		num = parseInt( nums[ i ], base ).toString( 2 );

		// Pad the front with 0's so that num has length of size
		for( j = num.length; j < size; j++ ) {
			num = "0" + num;
		}

		// Add to the bin
		bin += num;
	}

	// Loop through all the bits
	i = 0;
	if( bin.length % size > 0 ) {
		m_qbData.log( "loadFont: Invalid font data." );
		return;
	}
	while( i < bin.length ) {

		// Push a new character onto data
		data.push( [] );

		// Store the index of the font character
		index = data.length - 1;

		// Loop through all the characters
		for( y = 0; y < height; y += 1 ) {

			// Push a new row onto the character data
			data[ index ].push( [] );

			// Loop through a row
			for( x = 0; x < width; x += 1 ) {

				if( i >= bin.length ) {
					num = 0;
					//m_qbData.log( "Invalid font data" );
					//return;
				} else {
					num = parseInt( bin[ i ] );
					if( isNaN( num ) ) {
						num = 0;
						//m_qbData.log( "Invalid font data" );
						//return;
					}
				}

				// Push the bit onto the character
				data[ index ][ y ].push( num );

				// Increment the bit
				i += 1;
			}
		}
	}

	return data;
}

function loadFontFromImg( fontSrc, width, height, font, isBitmap ) {

	var img;

	if( typeof fontSrc === "string" ) {
		// Create a new image
		img = new Image();

		// Set the source
		img.src = fontSrc;
	} else if( fontSrc instanceof HTMLImageElement ){
		img = fontSrc;
	} else {
		m_qbData.log(
			"loadFont: fontSrc must be a string, image or canvas. "
		);
		return;
	}

	if( ! img.complete ) {
		// Signal qbs to wait
		m_qbWait();

		// Need to wait until the image is loaded
		img.onload = function () {
			if( isBitmap ) {
				font.image = img;
			} else {
				readImageData( img, width, height, font );
			}
			m_qbResume();
		};
		img.onerror = function ( err ) {
			m_qbData.log( "loadFont: unable to load image for font." );
			m_qbResume();
		};
	} else {
		if( isBitmap ) {
			font.image = img;
		} else {
			readImageData( img, width, height, font );
		}
	}
}

function readImageData( img, width, height, font ) {
	var canvas, context, data, i, x, y, index, xStart, yStart, cols, rows,
		r, g, b, a, colors, colorIndex;

	// Create a new canvas to read the pixel data
	canvas = document.createElement( "canvas" );
	context = canvas.getContext( "2d" );
	canvas.width = img.width;
	canvas.height = img.height;

	// Colors lookup
	colors = [];

	// Draw the image onto the canva
	context.drawImage( img, 0, 0 );

	// Get the image data
	data = context.getImageData( 0, 0, img.width, img.height );
	xStart = 0;
	yStart = 0;
	cols = img.width;
	rows = img.height;

	// Loop through charset
	for( i = 0; i < font.charSet.length; i++ ) {
		font.data.push( [] );
		for( y = yStart; y < yStart + height; y++ ) {
			font.data[ i ].push( [] );
			for( x = xStart; x < xStart + width; x++ ) {
				index = y * ( cols * 4 ) + x * 4;
				r = data.data[ index ];
				g = data.data[ index + 1 ];
				b = data.data[ index + 2 ];
				a = data.data[ index + 3 ];
				colorIndex = findColorIndex( colors, r, g, b, a );
				font.data[ i ][ y - yStart ].push( colorIndex );
			}
		}
		xStart += width;
		if( xStart >= cols ) {
			xStart = 0;
			yStart += height;
			if( yStart >= rows ) {
				break;
			}
		}
	}

	font.colorCount = colors.length;
}

function findColorIndex( colors, r, g, b, a ) {
	var i, dr, dg, db, da, d;

	if( a === 0 ) {
		r = 0;
		g = 0;
		b = 0;
	}
	for( i = 0; i < colors.length; i++ ) {
		dr = colors[ i ].r - r;
		dg = colors[ i ].g - g;
		db = colors[ i ].b - b;
		da = colors[ i ].a - a;
		d = dr * dr + dg * dg + db * db + da * da;
		if( d < 2 ) {
			return i;
		}
	}
	colors.push( {
		"r": r, "g": g, "b": b, "a": a
	} );
	return colors.length - 1;
}

qbs._.addCommand( "setDefaultFont", setDefaultFont, false, false,
	[ "fontId" ]
);
qbs._.addSetting( "defaultFont", setDefaultFont, false, [ "fontId" ] );
function setDefaultFont( args ) {
	var fontId;

	fontId = parseInt( args[ 0 ] );
	if( isNaN( fontId ) || fontId < 0 || fontId < m_qbData.fonts.length ) {
		m_qbData.log( "setDefaultFont: invalid fontId" );
		return;
	}
	m_qbData.defaultFont = m_qbData.fonts[ fontId ];

}

// Set Font Command
qbs._.addCommand( "setFont", setFont, false, true, [ "fontId" ] );
qbs._.addSetting( "font", setFont, true, [ "fontId" ] );
function setFont( screenData, args ) {
	var fontId, font, size;

	fontId = args[ 0 ];

	// Check if this is a valid font
	if( m_qbData.fonts[ fontId ] ) {

		// Set the font data for the current print cursor
		font = m_qbData.fonts[ fontId ];
		screenData.printCursor.font = font;

		// Set the rows and cols
		screenData.printCursor.cols = Math.floor(
			screenData.width / font.width
		);
		screenData.printCursor.rows = Math.floor(
			screenData.height / font.height
		);

	} else if( typeof fontId === "string" ) {

		// Set the context font
		screenData.context.font = fontId;
		screenData.context.textBaseline = "top";

		// Set the font dimensions
		size = calcFontSize( screenData.context );

		// Set the font data
		screenData.printCursor.font = {
			"name": screenData.context.font,
			"width": size.width,
			"height": size.height,
			"mode": "canvas",
			"printFunction": m_qbData.commands.canvasPrint,
			"calcWidth": m_qbData.commands.canvasCalcWidth
		};

		// Set the rows and cols
		screenData.printCursor.cols = Math.floor(
			screenData.width / size.width
		);
		screenData.printCursor.rows = Math.floor(
			screenData.height / size.height
		);
	}
}

function calcFontSize( context ) {
	var font, px, tCanvas, tContext, data, i, i2, size, x, y;

	font = context.font;

	px = context.measureText( "M" ).width;
	
	// Add some padding to px just in case
	px = Math.round( px * 1.5 );

	// Create a temporary canvas the size of the font px
	tCanvas = document.createElement( "canvas" );
	tCanvas.width = px;
	tCanvas.height = px;

	// Create a temporary canvas
	tContext = tCanvas.getContext( "2d" );
	tContext.font = context.font;
	tContext.textBaseline = "top";
	tContext.fillStyle = "#FF0000";

	// Set a blank size object
	size = {
		"width": 0,
		"height": 0
	};

	// Fill text with some characters at the same spot to read data
	data = "HMIyjg_|";
	for( i = 0; i < data.length; i++ ) {
		tContext.fillText( data[ i ], 0, 0 );
	}

	// Loop through all the pixels to get the dimensions
	data = tContext.getImageData( 0, 0, px, px );
	for( i = 0; i < data.data.length; i += 4 ) {
		if( data.data[ i ] === 255 ) {
			i2 = i / 4;
			y = Math.floor( i2 / px );
			x = i2 - y * px;
			if( y > size.height ) {
				size.height = y;
			}
			if( x > size.width ) {
				size.width = x;
			}
		}
	}

	return size;
}

qbs._.addCommand( "getAvailableFonts", getAvailableFonts, false, false, [] );
function getAvailableFonts( args ) {
	var i, data;

	data = [];
	for( i in m_qbData.fonts ) {
		data.push( {
			"id": m_qbData.fonts[ i ].id,
			"width": m_qbData.fonts[ i ].width,
			"height": m_qbData.fonts[ i ].height
		} );
	}
	return data;
}

qbs._.addCommand(
	"setFontSize", setFontSize, false, true, [ "width", "height" ]
);
qbs._.addSetting(
	"fontSize", setFontSize, true, [ "width", "height" ]
);
function setFontSize( screenData, args ) {
	var width, height;

	width = args[ 0 ];
	height = args[ 1 ];

	if( isNaN( width ) ) {
		m_qbData.log( "setFontSize: width must be a number." );
		return;
	}

	if( isNaN( height ) ) {
		m_qbData.log( "setFontSize: height must be a number." );
		return;
	}

	if( screenData.printCursor.font.mode !== "bitmap" ) {
		m_qbData.log( "setFontSize: only bitmap fonts can change sizes." );
		return;
	}

	screenData.printCursor.font.width = width;
	screenData.printCursor.font.height = height;
}

qbs._.addCommand(
	"setChar", setChar, false, true, [ "code", "data" ]
);
qbs._.addSetting(
	"char", setChar, true, [ "code", "data" ]
);
function setChar( screenData, args ) {
	var code, data, i, j;

	code = args[ 0 ];
	data = args[ 1 ];

	if( screenData.printCursor.font.mode !== "pixel" ) {
		m_qbData.log( "setChar: only pixel fonts can change characters." );
		return;
	}

	if( typeof( code ) === "string" ) {
		code = code.charCodeAt( code );
	}

	if( ! qbs.util.isInteger( code ) ) {
		m_qbData.log( "setChar: code must be an integer or a string." );
		return;
	}

	// Validate data
	if( typeof data === "string" ) {
		data = qbs.util.hexToData(
			data, 
			screenData.printCursor.font.width,
			screenData.printCursor.font.height
		);
	} else if( qbs.util.isArray( data ) ) {
		if( data.length !== screenData.printCursor.font.height ) {
			m_qbData.log( "setChar: data array is the wrong length." );
			return;
		}
		for( i = 0; i < data.length; i++ ) {
			if( data[ i ].length !== screenData.printCursor.font.width ) {
				m_qbData.log( "setChar: data array is the wrong length." );
				return;
			}
			for( j = 0; j < data[ i ].length; j++ ) {
				if( ! qbs.util.isInteger( data[ i ][ j ] ) ) {
					m_qbData.log( "setChar: data array contians the wrong data." );
					return;
				}
			}
		}
	} else {
		m_qbData.log( "setChar: data must either be a string or an array." );
		return;
	}

	// Set font data
	screenData.printCursor.font.data[ code ] = data;
}

// End of File Encapsulation
} )();
