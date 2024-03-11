var g_Fonts = {};
var g_FontId = 0;
var g_FontsLoading = 0;
var g_FontsLoaded = 0;

var images = document.querySelectorAll( "#images img" );
for( var i = 0; i < images.length; i++ ) {
	var width = parseInt( images[ i ].dataset.width );
	var height = parseInt( images[ i ].dataset.height );
	//break;
	loadFont( images[ i ], width, height );
}

function loadFont( img, width, height ) {
	var font;

	// Set the font data
	font = {
		"id": g_FontId++,
		"width": width,
		"height": height,
		"img": img,
		"data": []
	};

	// Add to global fonts
	g_Fonts[ font.id ] = font;

	g_FontsLoading += 1;

	setTimeout( function () {
		getFontData( font );
	}, 1 );

}

function getFontData( font ) {
	var canvas, context, data, i, x, y, index, xStart, yStart, cols, r, g, b, a;

	// Create a new canvas to read the pixel data
	canvas = document.createElement( "canvas" );
	context = canvas.getContext( "2d", { "willReadFrequently": true } );
	canvas.width = font.img.width;
	canvas.height = font.img.height;

	// Draw the image onto the canva
	context.drawImage( font.img, 0, 0 );

	// Get the image data
	data = context.getImageData( 0, 0, font.img.width, font.img.height );
	xStart = 0;
	yStart = 0;
	cols = font.img.width;

	// Loop through all ascii characters
	for( i = 0; i < 255; i++ ) {
		// if( i === 127) {
		// 	debugger;
		// }
		font.data.push( [] );
		for( y = yStart; y < yStart + font.height; y++ ) {
			font.data[ i ].push( [] );
			for( x = xStart; x < xStart + font.width; x++ ) {
				index = y * ( cols * 4 ) + x * 4;
				r = data.data[ index ];
				g = data.data[ index + 1 ];
				b = data.data[ index + 2 ];
				a = data.data[ index + 3 ];
				if( ( r > 1 || g > 1 || b > 1 ) && a > 1 ) {
					font.data[ i ][ y - yStart ].push( 1 );
				} else {
					font.data[ i ][ y - yStart ].push( 0 );
				}
			}
		}
		xStart += font.width;
		if( xStart >= cols ) {
			xStart = 0;
			yStart += font.height;
		}
	}

	g_FontsLoaded += 1;

	if( g_FontsLoaded === g_FontsLoading ) {
		writeCompressedFont();
	}

}

function writeCompressedFont() {
	var i, msg, font, fontStr;

	msg = "( function () {\n\"use strict\";\n\n";
	for( i in g_Fonts ) {
		font = g_Fonts[ i ];
		fontStr = compressFont( font.data );
		msg += "pi._.data.commands.loadFont( [ \n\"" + fontStr + "\",\n" + 
			font.width + ", " + font.height + ", null, true \n] );\n\n";
	}
	msg += "pi._.data.commands.setDefaultFont( [ 1 ] );\n";
	msg += "\n} )();\n";
	document.getElementById( "fontTextArea" ).innerHTML += msg;
}

function compressFont( font ) {
	var i, bitStr, numStr, j, byteSize, byteBase, dataStr, byteStr;

	byteSize = 32;
	byteBase = 32;
	bitStr = "";
	dataStr = "";

	for( i = 0; i < font.length; i++ ) {
		bitStr += getBits( font[ i ] );
	}

	for( i = 0; i < bitStr.length; i += byteSize ) {
		j = i + byteSize;
		if( j > bitStr.length ) {
			byteStr = bitStr.substring( i );
			while( byteStr.length < byteSize ) {
				byteStr += "0";
			}
		} else {
			byteStr = bitStr.substring( i, j );
		}
		numStr = parseInt( byteStr, 2 ).toString( byteBase );
		dataStr += numStr + ",";
	}

	dataStr = dataStr.substr( 0, dataStr.length - 1 );

	//return encodeMessage( dataStr );
	return dataStr;
}

function getBits( fontData ) {
	var bits, i, j;

	bits = "";
	for( i = 0; i < fontData.length; i++ ) {
		for( j = 0; j < fontData[ i ].length; j++ ) {
			bits += fontData[ i ][ j ];
		}
	}
	return bits;
}
