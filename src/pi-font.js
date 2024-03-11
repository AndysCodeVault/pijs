/*
* File: pi-font.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, m_piWait, m_piResume, pi;

pi = window.pi;
m_piData = pi._.data;
m_piWait = pi._.wait;
m_piResume = pi._.resume;

// Loads a font into memory
pi._.addCommand( "loadFont", loadFont, false, false,
	[ "fontSrc", "width", "height", "charSet", "isEncoded" ] );
function loadFont( args ) {
	var fontSrc, width, height, charSet, isEncoded, font, chars, i,
		temp;

	fontSrc = args[ 0 ];
	width = Math.round( args[ 1 ] );
	height = Math.round( args[ 2 ] );
	charSet = args[ 3 ];
	isEncoded = !!( args[ 4 ] );

	if( isNaN( width ) || isNaN( height ) ) {
		m_piData.log( "loadFont: width and height must be integers." );
		return;
	}

	// Default charset to 0 to 255
	if( ! charSet ) {
		charSet = [];
		for( i = 0; i < 256; i += 1 ) {
			charSet.push( i );
		}
	}

	if( ! ( pi.util.isArray( charSet ) || typeof charSet === "string" ) ) {
		m_piData.log( "loadFont: charSet must be an array or a string." );
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
		"id": m_piData.nextFontId,
		"width": width,
		"height": height,
		"data": [],
		"chars": chars,
		"charSet": charSet,
		"colorCount": 2,
		"mode": "pixel",
		"printFunction": m_piData.commands.piPrint,
		"calcWidth": m_piData.commands.piCalcWidth,
		"image": null,
		"sWidth": width,
		"sHeight": height
	};

	if( !isEncoded ) {
		font.mode = "bitmap";
		font.printFunction = m_piData.commands.bitmapPrint;
	}

	// Add this to the font data
	m_piData.fonts[ font.id ] = font;

	// Increment the next font id
	m_piData.nextFontId += 1;

	if( isEncoded ) {
		loadFontFromBase32Encoded( fontSrc, width, height, font );
	} else {
		loadFontFromImg( fontSrc, font );
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
		m_piData.log( "loadFont: Invalid font data." );
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
				} else {
					num = parseInt( bin[ i ] );
					if( isNaN( num ) ) {
						num = 0;
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

function loadFontFromImg( fontSrc, font ) {

	var img;

	if( typeof fontSrc === "string" ) {
		// Create a new image
		img = new Image();

		// Set the source
		img.src = fontSrc;
	} else if( fontSrc instanceof HTMLImageElement ){
		img = fontSrc;
	} else {
		m_piData.log(
			"loadFont: fontSrc must be a string, image or canvas. "
		);
		return;
	}

	if( ! img.complete ) {
		// Signal pijs to wait
		m_piWait();

		// Need to wait until the image is loaded
		img.onload = function () {
			font.image = img;
			m_piResume();
		};
		img.onerror = function ( err ) {
			m_piData.log( "loadFont: unable to load image for font." );
			m_piResume();
		};
	} else {
		font.image = img;
	}
}

pi._.addCommand( "setDefaultFont", setDefaultFont, false, false,
	[ "fontId" ]
);
pi._.addSetting( "defaultFont", setDefaultFont, false, [ "fontId" ] );
function setDefaultFont( args ) {
	var fontId;

	fontId = parseInt( args[ 0 ] );
	if( isNaN( fontId ) || fontId < 0 || fontId < m_piData.fonts.length ) {
		m_piData.log( "setDefaultFont: invalid fontId" );
		return;
	}
	m_piData.defaultFont = m_piData.fonts[ fontId ];

}

// Set Font Command
pi._.addCommand( "setFont", setFont, false, true, [ "fontId" ] );
pi._.addSetting( "font", setFont, true, [ "fontId" ] );
function setFont( screenData, args ) {
	var fontId, font, size;

	fontId = args[ 0 ];

	// Check if this is a valid font
	if( m_piData.fonts[ fontId ] ) {

		// Set the font data for the current print cursor
		font = m_piData.fonts[ fontId ];
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
			"printFunction": m_piData.commands.canvasPrint,
			"calcWidth": m_piData.commands.canvasCalcWidth
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
	var px, tCanvas, tContext, data, i, i2, size, x, y;

	px = context.measureText( "M" ).width;
	
	// Add some padding to px just in case
	px = Math.round( px * 1.5 );

	// Create a temporary canvas the size of the font px
	tCanvas = document.createElement( "canvas" );
	tCanvas.width = px;
	tCanvas.height = px;

	// Create a temporary canvas
	tContext = tCanvas.getContext( "2d", { "willReadFrequently": true } );
	tContext.font = context.font;
	tContext.textBaseline = "top";
	tContext.fillStyle = "#FF0000";

	// Set a blank size object
	size = {
		"width": 0,
		"height": 0
	};

	// Fill text with some characters at the same spot to read data
	data = "HMIyjg_|,W";
	for( i = 0; i < data.length; i++ ) {
		tContext.fillText( data.charAt( i ), 0, 0 );
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

pi._.addCommand( "getAvailableFonts", getAvailableFonts, false, false, [] );
function getAvailableFonts() {
	var i, data;

	data = [];
	for( i in m_piData.fonts ) {
		data.push( {
			"id": m_piData.fonts[ i ].id,
			"width": m_piData.fonts[ i ].width,
			"height": m_piData.fonts[ i ].height
		} );
	}
	return data;
}

pi._.addCommand(
	"setFontSize", setFontSize, false, true, [ "width", "height" ]
);
pi._.addSetting(
	"fontSize", setFontSize, true, [ "width", "height" ]
);
function setFontSize( screenData, args ) {
	var width, height;

	width = args[ 0 ];
	height = args[ 1 ];

	if( isNaN( width ) ) {
		m_piData.log( "setFontSize: width must be a number." );
		return;
	}

	if( isNaN( height ) ) {
		m_piData.log( "setFontSize: height must be a number." );
		return;
	}

	if( screenData.printCursor.font.mode !== "bitmap" ) {
		m_piData.log( "setFontSize: only bitmap fonts can change sizes." );
		return;
	}

	screenData.printCursor.font.width = width;
	screenData.printCursor.font.height = height;

	// Set the rows and cols
	screenData.printCursor.cols = Math.floor(
		screenData.width / width
	);
	screenData.printCursor.rows = Math.floor(
		screenData.height / height
	);
}

pi._.addCommand(
	"setChar", setChar, false, true, [ "code", "data" ]
);
pi._.addSetting(
	"char", setChar, true, [ "code", "data" ]
);
function setChar( screenData, args ) {
	var code, data, i, j;

	code = args[ 0 ];
	data = args[ 1 ];

	if( screenData.printCursor.font.mode !== "pixel" ) {
		m_piData.log( "setChar: only pixel fonts can change characters." );
		return;
	}

	if( typeof( code ) === "string" ) {
		code = code.charCodeAt( code );
	} else {
		code = Math.round( code );
	}

	if( isNaN( code ) ) {
		m_piData.log( "setChar: code must be an integer or a string." );
		return;
	}

	// Validate data
	if( typeof data === "string" ) {
		data = pi.util.hexToData(
			data, 
			screenData.printCursor.font.width,
			screenData.printCursor.font.height
		);
	} else if( pi.util.isArray( data ) ) {
		if( data.length !== screenData.printCursor.font.height ) {
			m_piData.log( "setChar: data array is the wrong length." );
			return;
		}
		for( i = 0; i < data.length; i++ ) {
			if( data[ i ].length !== screenData.printCursor.font.width ) {
				m_piData.log( "setChar: data array is the wrong length." );
				return;
			}
			for( j = 0; j < data[ i ].length; j++ ) {
				if( ! pi.util.isInteger( data[ i ][ j ] ) ) {
					m_piData.log( "setChar: data array contians the wrong data." );
					return;
				}
			}
		}
	} else {
		m_piData.log( "setChar: data must either be a string or an array." );
		return;
	}

	// Set font data
	screenData.printCursor.font.data[ code ] = data;
}

// End of File Encapsulation
} )();
