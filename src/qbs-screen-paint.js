/*
* File: qbs-screen-paint.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_maxDifference, m_setPixel, m_pixels;

m_qbData = qbs._.data;
//m_maxDifference = 195075;		// 255^2 * 3
//m_maxDifference = 260100;		// 255^2 * 4
//m_maxDifference = 227587.5;		// 255^2 * 3.5
m_maxDifference = ( 255 * 255 ) * 3.25;

// Paint Command
qbs._.addCommand( "paint", paint, false, true,
	[ "x", "y", "fillColor", "tolerance" ]
);
function paint( screenData, args ) {
	var x, y, fillColor, tolerance, fills, pixel, backgroundColor;

	x = args[ 0 ];
	y = args[ 1 ];
	fillColor = args[ 2 ];
	tolerance = args[ 3 ];

	if( ! qbs.util.isInteger( x ) || ! qbs.util.isInteger( y ) ) {
		m_qbData.log( "paint: Argument's x and y must be integers." );
		return;
	}

	// Set the default tolerance to 1
	if( tolerance == null || tolerance === false ) {
		tolerance = 1;
	}

	if( isNaN( tolerance ) || tolerance < 0 || tolerance > 1 ) {
		m_qbData.log( "paint: Argument tolerance must be a number between 0 and 1." );
		return;
	}

	// Soften the tolerance so closer to one it changes less
	// closer to 0 changes more
	tolerance = tolerance * ( 2 - tolerance ) * m_maxDifference;

	if( navigator.brave && tolerance === m_maxDifference ) {
		tolerance -= 1;
	}

	fills = [ {
		"x": x,
		"y": y
	} ];

	// Change the setPixel command if adding noise
	if( screenData.pen.noise ) {
		m_setPixel = setPixelNoise;
	} else {
		m_setPixel = m_qbData.commands.setPixel;
	}

	if( qbs.util.isInteger( fillColor ) ) {
		if( fillColor > screenData.pal.length ) {
			m_qbData.log(
				"paint: Argument fillColor is not a color in the palette."
			);
			return;
		}
		fillColor = screenData.pal[ fillColor ];
	} else {
		fillColor = qbs.util.convertToColor( fillColor );
		if( fillColor === null ) {
			m_qbData.log( "paint: Argument fillColor is not a valid color format." );
			return;
		}
	}

	m_pixels = {};
	m_qbData.commands.getImageData( screenData );

	// Get the background color
	backgroundColor = m_qbData.commands.getPixelInternal( screenData, x, y );

	// Loop until no fills left
	while( fills.length > 0 ) {

		pixel = fills.pop();

		// Set the current pixel
		m_setPixel( screenData, pixel.x, pixel.y, fillColor );

		// Add fills to neighbors
		addFill( screenData, pixel.x + 1, pixel.y, fills, fillColor,
			backgroundColor, tolerance );
		addFill( screenData, pixel.x - 1, pixel.y, fills, fillColor,
			backgroundColor, tolerance );
		addFill( screenData, pixel.x, pixel.y + 1, fills, fillColor,
			backgroundColor, tolerance );
		addFill( screenData, pixel.x, pixel.y - 1, fills, fillColor,
			backgroundColor, tolerance );
	}

	// Setup pixels for garbage collection
	m_pixels = null;
	m_qbData.commands.setImageDirty( screenData );
}

function setPixelNoise( screenData, x, y, fillColor ) {
	fillColor = m_qbData.commands.getPixelColor( screenData, fillColor );
	m_qbData.commands.setPixel( screenData, x, y, fillColor );
}

function checkPixel( x, y ) {
	var key;
	key = x + " " + y;
	if( m_pixels[ key ] ) {
		return true;
	}
	m_pixels[ key ] = true;
	return false;
}

function addFill( screenData, x, y, fills, fillColor, backgroundColor,
	tolerance
) {
	var fill;
	if( floodCheck( screenData, x, y, fillColor, backgroundColor, tolerance ) ) {
		m_setPixel( screenData, x, y, fillColor );
		fill = { x: x, y: y };
		fills.push( fill );
	}
}

function floodCheck( screenData, x, y, fillColor, backgroundColor, tolerance ) {
	var pixelColor, dr, dg, db, da, simularity, difference;

	if( x < 0 || x >= screenData.width || y < 0 || y >= screenData.height ) {
		return false;
	}
	pixelColor = m_qbData.commands.getPixelInternal( screenData, x, y );

	// Make sure we haven't already filled this pixel
	if( ! checkPixel( x, y ) ) {

		// Calculate the difference between the two colors
		dr = ( pixelColor.r - backgroundColor.r );
		dg = ( pixelColor.g - backgroundColor.g );
		db = ( pixelColor.b - backgroundColor.b );
		da = ( pixelColor.a - backgroundColor.a );
		difference = ( dr * dr + dg * dg + db * db + da * da * 0.25 );
		simularity = m_maxDifference - difference;

		return simularity >= tolerance;
	}
	return false;
}

// End of File Encapsulation
} )();
