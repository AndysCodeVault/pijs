/*
* File: pi-screen-graphics.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, pi;

pi = window.pi;
m_piData = pi._.data;

// Circle command
pi._.addCommands( "circle", pxCircle, aaCircle,
	[ "x", "y", "radius", "fillColor" ]
);
function pxCircle( screenData, args ) {
	var x, y, radius, fillColor, i, x2, y2, midPoint, color, isFill,
		tempData;

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );
	radius = Math.round( args[ 2 ] );
	fillColor = args[ 3 ];

	isFill = false;

	if(
		! pi.util.isInteger( x ) ||
		! pi.util.isInteger( y ) ||
		! pi.util.isInteger( radius )
	) {
		m_piData.log( "circle: x, y, radius must be integers." );
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "circle"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	m_piData.commands.getImageData( screenData );

	if( isFill ) {
		m_piData.commands.setImageDirty( screenData );
		tempData = screenData.imageData;
		tempData.name = "main";

		screenData.bufferContext.clearRect(
			0, 0, screenData.width, screenData.height
		);
		screenData.imageData = screenData.bufferContext.getImageData(
			0, 0, screenData.width, screenData.height
		);
		screenData.imageData.name = "buffer";
	}

	// Initialize the color for the circle
	color = screenData.fColor;

	radius -= 1;
	x2 = radius;
	y2 = 0;

	// Set the first pixel at 90 degrees
	//screenData.pen.draw( screenData, x + cx, y + cy, c );

	// Only print inital points if r > 0
	if( radius > 1 ) {
		screenData.pen.draw( screenData, x2 + x, y2 + y, color );
		screenData.pen.draw( screenData, -x2 + x, y2 + y, color );
		screenData.pen.draw( screenData, x, x2 + y, color );
		screenData.pen.draw( screenData, x, -x2 + y, color );
	} else if( radius === 1 ) {
		screenData.pen.draw( screenData, x + 1, y, color );
		screenData.pen.draw( screenData, x - 1, y, color );
		screenData.pen.draw( screenData, x, y + 1, color );
		screenData.pen.draw( screenData, x, y - 1, color );
		y2 = x2 + 1;
	} else if( radius === 0 ) {
		screenData.pen.draw( screenData, x, y, color );
		y2 = x2 + 1;
	}

	// Initialize p
	midPoint = 1 - radius;
	while( x2 > y2 ) {
		y2 += 1;

		if( midPoint <= 0 ) {
			// Mid-point is inside or on the perimeter
			midPoint = midPoint + 2 * y2 + 1;
		} else {
			// Mid point is outside the perimeter
			x2 -= 1;
			midPoint = midPoint + 2 * y2 - 2 * x2 + 1;
		}

		// Set pixels around point and reflection in other octants
		screenData.pen.draw( screenData, x2 + x, y2 + y, color );
		screenData.pen.draw( screenData, -x2 + x, y2 + y, color );
		screenData.pen.draw( screenData, x2 + x, -y2 + y, color );
		screenData.pen.draw( screenData, -x2 + x, -y2 + y, color );

		// Set pixels on the perimeter points if not on x = y
		if( x2 != y2 ) {
			screenData.pen.draw( screenData, y2 + x, x2 + y, color );
			screenData.pen.draw( screenData, -y2 + x, x2 + y, color );
			screenData.pen.draw( screenData, y2 + x, -x2 + y, color );
			screenData.pen.draw( screenData, -y2 + x, -x2 + y, color );
		}

	}

	if( isFill ) {

		// Paint the center of the shape
		m_piData.commands.paint( screenData, [ x, y, fillColor ] );

		// Copy the data back onto the main canvas
		radius += screenData.pen.size;
		for( y2 = -radius; y2 <= radius; y2 += 1 ) {
			for( x2 = -radius; x2 <= radius; x2 += 1 ) {
				i = ( ( y2 + y ) * screenData.width + ( x2 + x ) ) * 4;
				if( screenData.imageData.data[ i + 3 ] > 0 ) {
					tempData.data[ i ] = screenData.imageData.data[ i ];
					tempData.data[ i + 1 ] = screenData.imageData.data[ i + 1 ];
					tempData.data[ i + 2 ] = screenData.imageData.data[ i + 2 ];
					tempData.data[ i + 3 ] = screenData.imageData.data[ i + 3 ];
				}
			}
		}
		screenData.imageData = tempData;

	}

	m_piData.commands.setImageDirty( screenData );
}

function aaCircle( screenData, args ) {
	var x, y, r, fillColor, isFill, angle1, angle2;

	x = args[ 0 ] + 0.5;
	y = args[ 1 ] + 0.5;
	r = args[ 2 ] - 0.9;
	fillColor = args[ 3 ];

	if( isNaN( x ) || isNaN( y ) || isNaN( r ) ) {
		m_piData.log("circle: parameters cx, cy, r must be numbers.");
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "rect"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	} else {
		isFill = false;
	}

	screenData.screenObj.render();
	angle1 = pi.util.degreesToRadian( 0 );
	angle2 = pi.util.degreesToRadian( 360 );
	screenData.context.beginPath();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.moveTo( x + Math.cos( angle1 ) * r, y +
		Math.sin( angle1 ) * r );
	screenData.context.arc( x, y, r, angle1, angle2 );
	if( isFill ) {
		screenData.context.fillStyle = fillColor.s;
		screenData.context.fill();
	}
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Arc command
pi._.addCommands( "arc", pxArc, aaArc,
	[ "x", "y", "radius", "angle1", "angle2" ]
);
function pxArc( screenData, args ) {
	var x, y, radius, angle1, angle2, color, x2, y2, midPoint, winding;

	function set( x2, y2 ) {
		var a;
		a = ( pi.util.radiansToDegrees( Math.atan2( y2 - y, x2 - x ) ) );
		a = ( a + 360 ) % 360;
		if( winding ) {
			if( a >= angle1 || a <= angle2 ) {
				screenData.pen.draw( screenData, x2, y2, color );
			}
		} else if( a >= angle1 && a <= angle2 ) {
			screenData.pen.draw( screenData, x2, y2, color );
		}
	}

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );
	radius = Math.round( args[ 2 ] );
	angle1 = args[ 3 ];
	angle2 = args[ 4 ];
	angle1 = ( angle1 + 360 ) % 360;
	angle2 = ( angle2 + 360 ) % 360;
	winding = false;
	if( angle1 > angle2 ) {
		winding = true;
	}
	m_piData.commands.getImageData( screenData );

	// Make sure x and y are integers
	if( isNaN( x ) || isNaN( y ) || isNaN( radius ) ) {
		m_piData.log( "arc: Argument's x, y, radius must be integers." );
		return;
	}

	// Initialize the color for the circle
	color = screenData.fColor;

	radius -= 1;
	if( radius < 0 ) {
		radius = 0;
	}
	x2 = radius;
	y2 = 0;

	// Only print inital points if r > 0
	if( radius > 1 ) {
		set( x2 + x, y2 + y, color );
		set( -x2 + x, y2 + y, color );
		set( x, x2 + y, color );
		set( x, -x2 + y, color );
	} else if( radius === 1 ) {
		set( x + 1, y, color );
		set( x - 1, y, color );
		set( x, y + 1, color );
		set( x, y - 1, color );
		m_piData.commands.setImageDirty( screenData );
		return;
	} else if( radius === 0 ) {
		screenData.pen.draw( screenData, x, y, color );
		m_piData.commands.setImageDirty( screenData );
		return;
	}

	// Initialize p
	midPoint = 1 - radius;
	while( x2 > y2 ) {
		y2 += 1;

		if( midPoint <= 0 ) {
			// Mid-point is inside or on the perimeter
			midPoint = midPoint + 2 * y2 + 1;
		} else {
			// Mid point is outside the perimeter
			x2 -= 1;
			midPoint = midPoint + 2 * y2 - 2 * x2 + 1;
		}

		// Set pixels around point and reflection in other octants
		set( x2 + x, y2 + y, color );
		set( -x2 + x, y2 + y, color );
		set( x2 + x, -y2 + y, color );
		set( -x2 + x, -y2 + y, color );

		// Set pixels on the perimeter points if not on x = y
		if( x2 != y2 ) {
			set( y2 + x, x2 + y, color );
			set( -y2 + x, x2 + y, color );
			set( y2 + x, -x2 + y, color );
			set( -y2 + x, -x2 + y, color );
		}
	}

	m_piData.commands.setImageDirty( screenData );

}

function aaArc( screenData, args ) {
	var x, y, radius, angle1, angle2;

	x = args[ 0 ];
	y = args[ 1 ];
	radius = args[ 2 ];
	angle1 = args[ 3 ];
	angle2 = args[ 4 ];

	if(
			isNaN( x ) || isNaN( y ) || isNaN( radius ) ||
			isNaN( angle1 ) || isNaN( angle2 )
		) {
			m_piData.log( "arc: parameters cx, cy, r, a1, a2 must be numbers." );
		return;
	}

	x = x + 0.5;
	y = y + 0.5;
	radius = radius - 0.9;
	if( radius < 0 ) {
		radius = 0;
	}

	screenData.screenObj.render();
	angle1 = pi.util.degreesToRadian( angle1 );
	angle2 = pi.util.degreesToRadian( angle2 );
	screenData.context.beginPath();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.moveTo(
		x + Math.cos( angle1 ) * radius,
		y + Math.sin(angle1) * radius
	);
	screenData.context.arc( x, y, radius, angle1, angle2 );
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Ellipse command
pi._.addCommands( "ellipse", pxEllipse, aaEllipse,
	[ "x", "y", "radiusX", "radiusY", "fillColor" ]
);
function pxEllipse( screenData, args ) {
	var x, y, radiusX, radiusY, fillColor, tempData, color, dx, dy, d1, d2, x2,
		y2, isFill, i;

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );
	radiusX = Math.round( args[ 2 ] );
	radiusY = Math.round( args[ 3 ] );
	fillColor = args[ 4 ];

	if( isNaN( x ) || isNaN( y ) || isNaN( radiusX ) || isNaN( radiusY ) ) {
		m_piData.log(
			"ellipse: parameters x, y, radiusX, radiusY must be integers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "circle"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	m_piData.commands.getImageData( screenData );

	if( isFill ) {
		m_piData.commands.setImageDirty( screenData );
		tempData = screenData.imageData;
		tempData.name = "main";

		screenData.bufferContext.clearRect(
			0, 0, screenData.width, screenData.height
		);
		screenData.imageData = screenData.bufferContext.getImageData(
			0, 0, screenData.width, screenData.height
		);
		screenData.imageData.name = "buffer";
	}

	// Initialize the color for the circle
	color = screenData.fColor;

	if( radiusX === 0 && radiusY === 0 ) {
		screenData.pen.draw(
			screenData, Math.floor( x ), Math.floor( y ), color
		);
		m_piData.commands.setImageDirty( screenData );
		return;
	}

	// Starting points
	x2 = 0;
	y2 = radiusY;

	// Decision parameter of region 1
	d1 = ( radiusY * radiusY ) - ( radiusX * radiusX * radiusY ) +
		( 0.25 * radiusX * radiusX );

	dx = 2 * radiusY * radiusY * x2;
	dy = 2 * radiusX * radiusX * y2;

	// For region 1
	while( dx < dy ) {

		// 4-way symmetry
		screenData.pen.draw(
			screenData, Math.floor( x2 + x ), Math.floor( y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( -x2 + x ), Math.floor( y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( x2 + x ), Math.floor( -y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( -x2 + x ), Math.floor( -y2 + y ), color
		);

		// Checking and updating value of
		// decision parameter based on algorithm
		if( d1 < 0 ) {
			x2++;
			dx = dx + ( 2 * radiusY * radiusY );
			d1 = d1 + dx + ( radiusY * radiusY );
		} else {
			x2++;
			y2--;
			dx = dx + ( 2 * radiusY * radiusY );
			dy = dy - ( 2 * radiusX * radiusX );
			d1 = d1 + dx - dy + ( radiusY * radiusY );
		}
	}

	// Decision parameter of region 2
	d2 = ( ( radiusY * radiusY ) * ( ( x2 + 0.5 ) * ( x2 + 0.5 ) ) ) +
		 ( ( radiusX * radiusX ) * ( ( y2 - 1 ) * ( y2 - 1 ) ) ) -
		 ( radiusX * radiusX * radiusY * radiusY );

	// Plotting points of region 2
	while( y2 >= 0 ) {

		// 4-way symmetry
		screenData.pen.draw(
			screenData, Math.floor( x2 + x ), Math.floor( y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( -x2 + x ), Math.floor( y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( x2 + x ), Math.floor( -y2 + y ), color
		);
		screenData.pen.draw(
			screenData, Math.floor( -x2 + x ), Math.floor( -y2 + y ), color
		);

		// Checking and updating parameter
		// value based on algorithm
		if( d2 > 0 ) {
			y2--;
			dy = dy - ( 2 * radiusX * radiusX );
			d2 = d2 + ( radiusX * radiusX ) - dy;
		} else {
			y2--;
			x2++;
			dx = dx + ( 2 * radiusY * radiusY );
			dy = dy - ( 2 * radiusX * radiusX );
			d2 = d2 + dx - dy + ( radiusX * radiusX );
		}
	}

	if( isFill ) {

		// Paint the center of the shape
		m_piData.commands.paint( screenData, [ x, y, fillColor ] );

		// Copy the data back onto the main canvas
		radiusX += screenData.pen.size;
		radiusY += screenData.pen.size;
		for( y2 = -radiusY; y2 <= radiusY; y2 += 1 ) {
			for( x2 = -radiusX; x2 <= radiusX; x2 += 1 ) {
				i = ( ( y2 + y ) * screenData.width + ( x2 + x ) ) * 4;
				if( screenData.imageData.data[ i + 3 ] > 0 ) {
					tempData.data[ i ] = screenData.imageData.data[ i ];
					tempData.data[ i + 1 ] = screenData.imageData.data[ i + 1 ];
					tempData.data[ i + 2 ] = screenData.imageData.data[ i + 2 ];
					tempData.data[ i + 3 ] = screenData.imageData.data[ i + 3 ];
				}
			}
		}
		screenData.imageData = tempData;

	}

	m_piData.commands.setImageDirty( screenData );
}

function aaEllipse( screenData, args ) {
	var cx, cy, rx, ry, fillColor, isFill;

	cx = args[ 0 ];
	cy = args[ 1 ];
	rx = args[ 2 ];
	ry = args[ 3 ];
	fillColor = args[ 4 ];

	if( isNaN( cx ) || isNaN( cy ) || isNaN( rx ) || isNaN( ry ) ) {
		m_piData.log(
			"ellipse: parameters x, y, radiusX, radiusY must be numbers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "rect"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	} else {
		isFill = false;
	}

	if( screenData.dirty ) {
		screenData.screenObj.render();
	}

	screenData.context.beginPath();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.moveTo( cx + rx, cy );
	screenData.context.ellipse(
		cx, cy, rx, ry, 0, pi.util.math.deg360, false
	);
	if( isFill ) {
		screenData.context.fillStyle = fillColor.s;
		screenData.context.fill();
	}
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Put command
pi._.addCommand( "put", put, false, true, [ "data", "x", "y", "includeZero" ] );
function put( screenData, args ) {
	var data, x, y, includeZero, dataX, dataY, startX, startY, width, height, i, c;

	data = args[ 0 ];
	x = Math.round( args[ 1 ] );
	y = Math.round( args[ 2 ] );
	includeZero = !!( args[ 3 ] );

	// Exit if no data
	if( ! data || data.length < 1 ) {
		return;
	}

	if( isNaN( x ) || isNaN( y ) ) {
		m_piData.log( "put: parameters x and y must be integers." );
		return;
	}

	// Clip x if offscreen
	if( x < 0 ) {
		startX = x * -1;
	} else {
		startX = 0;
	}

	// Clip y if offscreen
	if( y < 0 ) {
		startY = y * -1;
	} else {
		startY = 0;
	}

	// Calc width & height
	width = data[ 0 ].length - startX;
	height = data.length - startY;

	// Clamp width & height
	if( x + startX + width >= screenData.width ) {
		width = screenData.width - x + startX;
	}
	if( y + startY + height >= screenData.height ) {
		height = screenData.height - y + startY;
	}

	//Exit if there is no data that fits the screen
	if( width <= 0 || height <= 0 ) {
		return;
	}

	m_piData.commands.getImageData( screenData );

	//Loop through the data
	for( dataY = startY; dataY < startY + height; dataY++ ) {
		for( dataX = startX; dataX < startX + width; dataX++ ) {

			//Get the color
			c = screenData.pal[ data[ dataY ][ dataX ] ];

			//Calculate the index of the image data
			i = ( ( screenData.width * ( y + dataY ) ) + ( x + dataX ) ) * 4;

			//Put the color in the image data
			if( c.a > 0 || includeZero ) {
				screenData.imageData.data[ i ] = c.r;
				screenData.imageData.data[ i + 1 ] = c.g;
				screenData.imageData.data[ i + 2 ] = c.b;
				screenData.imageData.data[ i + 3 ] = c.a;
			}
		}
	}

	m_piData.commands.setImageDirty( screenData );
}

// Get command
pi._.addCommand( "get", get, false, true,
	[ "x1", "y1", "x2", "y2", "tolerance", "isAddToPalette" ]
);
function get( screenData, args ) {
	var x1, y1, x2, y2, tolerance, isAddToPalette, t, imageData, data, x, y, c, r,
		g, b, i, row, a;

	x1 = Math.round( args[ 0 ] );
	y1 = Math.round( args[ 1 ] );
	x2 = Math.round( args[ 2 ] );
	y2 = Math.round( args[ 3 ] );
	tolerance = args[ 4 ];
	isAddToPalette = !!( args[ 5 ] );

	if( isNaN( x1 ) || isNaN( y1 ) || isNaN( y2 ) || isNaN( y2 ) ) {
		m_piData.log( "get: parameters x1, x2, y1, y2 must be integers." );
		return;
	}

	if( tolerance == null ) {
		tolerance = 1;
	} else if( isNaN( tolerance ) ) {
		m_piData.log( "get: parameter tolerance must be a number." );
		return;
	}

	x1 = pi.util.clamp( x1, 0, screenData.width - 1 );
	x2 = pi.util.clamp( x2, 0, screenData.width - 1 );
	y1 = pi.util.clamp( y1, 0, screenData.height - 1 );
	y2 = pi.util.clamp( y2, 0, screenData.height - 1 );
	if( x1 > x2 ) {
		t = x1;
		x1 = x2;
		x2 = t;
	}
	if( y1 > y2 ) {
		t = y1;
		y1 = y2;
		y2 = t;
	}

	m_piData.commands.getImageData( screenData );

	imageData = screenData.imageData;

	data = [];
	row = 0;
	for( y = y1; y <= y2; y++ ) {
		data.push([]);
		for( x = x1; x <= x2; x++ ) {
			// Calculate the index of the image data
			i = ( ( screenData.width * y ) + x ) * 4;
			r = imageData.data[ i ];
			g = imageData.data[ i + 1 ];
			b = imageData.data[ i + 2 ];
			a = imageData.data[ i + 3 ];
			c = screenData.screenObj.findColor(
				pi.util.rgbToColor( r, g, b, a ),
				tolerance,
				isAddToPalette
			);
			data[ row ].push( c );
		}
		row += 1;
	}

	return data;
}

// PSET command
pi._.addCommands( "pset", pset, aaPset, [ "x", "y" ] );
function pset( screenData, args ) {
	var x, y, color;

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );

	// Make sure x and y are integers
	if( ! pi.util.isInteger( x ) || ! pi.util.isInteger( y ) ) {
		m_piData.log( "pset: Argument's x and y must be integers." );
		return;
	}

	// Set the cursor
	screenData.x = x;
	screenData.y = y;

	// Make sure x and y are on the screen
	if( ! pi.util.inRange2( x, y, 0, 0, screenData.width, screenData.height ) ) {
		return;
	}

	// Get the fore color
	color = screenData.fColor;

	m_piData.commands.getImageData( screenData );
	screenData.pen.draw( screenData, x, y, color );
	m_piData.commands.setImageDirty( screenData );
}

function aaPset( screenData, args ) {
	var x, y;

	x = args[ 0 ];
	y = args[ 1 ];

	// Make sure x and y are integers
	if( ! pi.util.isInteger( x ) || ! pi.util.isInteger( y ) ) {
		m_piData.log( "pset: Argument's x and y must be integers." );
		return;
	}

	// Set the cursor
	screenData.x = x;
	screenData.y = y;

	// Make sure x and y are on the screen
	if( ! pi.util.inRange2( x, y, 0, 0, screenData.width, screenData.height ) ) {
		return;
	}

	screenData.screenObj.render();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.beginPath();
	screenData.context.moveTo( x, y );
	screenData.context.lineTo( x, y );
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Line command
pi._.addCommands( "line", pxLine, aaLine, [ "x1", "y1", "x2", "y2" ] );
function pxLine( screenData, args ) {
	var x1, y1, x2, y2, color, dx, dy, sx, sy, err, e2;

	x1 = Math.round( args[ 0 ] );
	y1 = Math.round( args[ 1 ] );
	x2 = Math.round( args[ 2 ] );
	y2 = Math.round( args[ 3 ] );

	// Make sure x and y are integers
	if( ! pi.util.isInteger( x1 ) || ! pi.util.isInteger( y1 ) ||
		! pi.util.isInteger( x2 ) || ! pi.util.isInteger( y2 ) ) {
		m_piData.log( "line: Argument's x1, y1, x2, and y2 must be integers." );
		return;
	}

	// Initialize the color for the line
	color = screenData.fColor;

	dx = Math.abs( x2 - x1 );
	dy = Math.abs( y2 - y1 );

	// Set the x slope
	if( x1 < x2 ) {
		sx = 1;
	} else {
		sx = -1;
	}

	// Set the y slope
	if( y1 < y2 ) {
		sy = 1;
	} else {
		sy = -1;
	}

	// Set the err
	err = dx - dy;

	// Get the image data
	m_piData.commands.getImageData( screenData );

	// Set the first pixel
	screenData.pen.draw( screenData, x1, y1, color );

	// Loop until the end of the line
	while ( ! ( ( x1 === x2 ) && ( y1 === y2 ) ) ) {
		e2 = err << 1;

		if ( e2 > -dy ) {
			err -= dy;
			x1 += sx;
		}

		if ( e2 < dx ) {
			err += dx;
			y1 += sy;
		}

		// Set the next pixel
		screenData.pen.draw( screenData, x1, y1, color );
	}

	m_piData.commands.setImageDirty( screenData );
}

function aaLine( screenData, args ) {
	var x1, y1, x2, y2;

	x1 = args[ 0 ];
	y1 = args[ 1 ];
	x2 = args[ 2 ];
	y2 = args[ 3 ];

	if( isNaN( x1 ) || isNaN( y1 ) || isNaN( x2 ) || isNaN( y2 ) ) {
		m_piData.log("line: parameters x1, y1, x2, y2 must be numbers.");
		return;
	}

	screenData.screenObj.render();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.beginPath();
	screenData.context.moveTo( x1, y1 );
	screenData.context.lineTo( x2, y2 );
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Rect command
pi._.addCommands( "rect", pxRect, aaRect,
	[ "x", "y", "width", "height", "fillColor" ]
);
function pxRect( screenData, args ) {
	var x, y, width, height, fillColor, isFill, x2, y2, tempColor, x3;

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );
	width = Math.round( args[ 2 ] );
	height = Math.round( args[ 3 ] );
	fillColor = args[ 4 ];

	if(
		! pi.util.isInteger( x ) ||
		! pi.util.isInteger( y ) ||
		! pi.util.isInteger( width ) ||
		! pi.util.isInteger( height )
	) {
		m_piData.log( "rect: x, y, width, and height must be integers." );
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "rect"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	x2 = x + width - 1;
	y2 = y + height - 1;

	m_piData.commands.line( screenData, [ x, y, x2, y ] );
	m_piData.commands.line( screenData, [ x2, y, x2, y2 ] );
	m_piData.commands.line( screenData, [ x2, y2, x, y2 ] );
	m_piData.commands.line( screenData, [ x, y2, x, y ] );

	if(
		isFill &&
		width > screenData.pen.size &&
		height > screenData.pen.size &&
		width > 2 &&
		height > 2
	) {

		tempColor = screenData.fColor;
		screenData.fColor = fillColor;

		y = y + screenData.pen.size;
		y2 = y2 - screenData.pen.size + 1;
		x = x + screenData.pen.size;
		x2 = x2 - screenData.pen.size + 1;

		if( x < 0 ) {
			x = 0;
		}
		if( x2 > screenData.width ) {
			x2 = screenData.width;
		}

		if( y < 0 ) {
			y = 0;
		}
		if( y2 > screenData.height ) {
			y2 = screenData.height;
		}

		// Draw line by line
		for( ; y < y2; y += 1 ) {
			for( x3 = x; x3 < x2; x3 += 1 ) {
				m_piData.commands.setPixel( screenData, x3, y, fillColor );
			}
		}

		screenData.fColor = tempColor;
	}

}

function aaRect( screenData, args ) {
	var x, y, width, height, fillColor, isFill;

	x = args[ 0 ];
	y = args[ 1 ];
	width = args[ 2 ];
	height = args[ 3 ];
	fillColor = args[ 4 ];
	isFill = false;

	if( isNaN( x ) || isNaN( y ) || isNaN( width ) || isNaN( height ) ) {
		m_piData.log(
			"rect: parameters x, y, width, height must be numbers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_piData.commands.findColorValue(
			screenData, fillColor, "rect"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	screenData.screenObj.render();
	screenData.context.beginPath();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.rect( x, y, width, height );
	if( isFill ) {
		screenData.context.fillStyle = fillColor.s;
		screenData.context.fill();
	}
	screenData.context.stroke();

	m_piData.commands.resetImageData( screenData );
}

// Set Pal Color command
pi._.addCommand( "setPalColor", setPalColor, false, true,
	[ "index", "color" ]
);
pi._.addSetting( "palColor", setPalColor, true,
	[ "index", "color" ]
);
function setPalColor( screenData, args ) {
	var index, color, colorValue;

	index = args[ 0 ];
	color = args[ 1 ];

	if(
		! pi.util.isInteger( index ) ||
		index < 0 ||
		index > screenData.pal.length
	) {
		m_piData.log( "setPalColor: index is not a valid integer value." );
		return;
	}
	colorValue = pi.util.convertToColor( color );
	if( colorValue === null ) {
		m_piData.log(
			"setPalColor: parameter color is not a valid color format."
		);
		return;
	}

	// Check if we are changing the current selected fore color
	if( screenData.fColor.s === screenData.pal[ index ].s ) {
		screenData.fColor = colorValue;
	}

	// Update the color cache
	if( screenData.cache[ "findColor" ][ color.s ] ) {
		screenData.cache[ "findColor" ][ color.s ] = index;
	}

	screenData.pal[ index ] = colorValue;
}

// Get pal command
pi._.addCommand( "getPal", getPal, false, true, [] );
function getPal( screenData, args ) {
	var i, color, colors;
	colors = [];
	for( i = 0; i < screenData.pal.length; i++ ) {
		color = {
			"r": screenData.pal[ i ].r,
			"g": screenData.pal[ i ].g,
			"b": screenData.pal[ i ].b,
			"a": screenData.pal[ i ].a,
			"s": screenData.pal[ i ].s
		};
		colors.push( color );
	}
	return colors;
}

// Color command
pi._.addCommand( "setColor", setColor, false, true,
	[ "color", "isAddToPalette" ]
);
pi._.addSetting( "color", setColor, true, [ "color", "isAddToPalette" ] );
function setColor( screenData, args ) {
	var colorInput, colorValue, isAddToPalette;

	colorInput = args[ 0 ];
	isAddToPalette = !!( args[ 1 ] );
	colorValue = m_piData.commands.findColorValue(
		screenData, colorInput, "color"
	);

	if( colorValue === undefined ) {
		return;
	}

	if( isAddToPalette ) {
		screenData.fColor = screenData.screenObj.findColor(
			colorValue, isAddToPalette
		);
	} else {
		screenData.fColor = colorValue;
	}
	screenData.context.fillStyle = colorValue.s;
	screenData.context.strokeStyle = colorValue.s;
}

pi._.addCommand( "swapColor", swapColor, false, true,
	[ "oldColor", "newColor" ]
);
function swapColor( screenData, args ) {
	var oldColor, newColor, index, x, y, i, data;

	oldColor = args[ 0 ];
	newColor = args[ 1 ];

	// Validate oldColor
	if( ! pi.util.isInteger( oldColor ) ) {
		m_piData.log( "swapColor: parameter oldColor must be an integer." );
		return;
	} else if( oldColor < 0 || oldColor > screenData.pal.length ) {
		m_piData.log( "swapColor: parameter oldColor is an invalid integer." );
		return;
	} else if( screenData.pal[ index ] === undefined ) {
		m_piData.log( "swapColor: parameter oldColor is not in the screen color palette." );
		return;
	}

	index = oldColor;
	oldColor = screenData.pal[ index ];

	// Validate newColor
	newColor = pi.util.convertToColor( newColor );
	if( newColor === null ) {
		m_piData.log(
			"swapColor: parameter newColor is not a valid color format."
		);
		return;
	}

	m_piData.commands.getImageData( screenData );
	data = screenData.imageData.data;

	// Swap's all colors
	for( y = 0; y < screenData.height; y++ ) {
		for( x = 0; x < screenData.width; x++ ) {
			i = ( ( screenData.width * y ) + x ) * 4;
			if(
				data[ i ] === oldColor.r &&
				data[ i + 1 ] === oldColor.g &&
				data[ i + 2 ] === oldColor.b &&
				data[ i + 3 ] === oldColor.a ) {
					data[ i ] = newColor.r;
					data[ i + 1 ] = newColor.g;
					data[ i + 2 ] = newColor.b;
					data[ i + 3] = newColor.a;
			}
		}
	}

	m_piData.commands.setImageDirty( screenData );

	// Update the pal data
	screenData.pal[ index ] = newColor;

}

// Point command
pi._.addCommand( "getPixel", getPixel, false, true, [ "x", "y" ] );
function getPixel( screenData, args ) {
	var x, y, i, c, data;

	x = Math.round( args[ 0 ] );
	y = Math.round( args[ 1 ] );

	// Make sure x and y are integers
	if( ! pi.util.isInteger( x ) || ! pi.util.isInteger( y ) ) {
		m_piData.log("point: Argument's x and y must be integers.");
		return;
	}

	m_piData.commands.getImageData( screenData );
	data = screenData.imageData.data;

	// Calculate the index
	i = ( ( screenData.width * y ) + x ) * 4;
	c = pi.util.convertToColor( {
		r: data[ i ],
		g: data[ i + 1 ],
		b: data[ i + 2 ],
		a: data[ i + 3 ]
	} );
	return c;
}

// CLS command
pi._.addCommand( "cls", cls, false, true, [ "x", "y", "width", "height" ] );
function cls( screenData, args ) {
	var x, y, width, height;

	x = pi.util.getInt( Math.round( args[ 0 ] ), 0 );
	y = pi.util.getInt( Math.round( args[ 1 ] ), 0 );
	width = pi.util.getInt( Math.round( args[ 2 ] ), screenData.width );
	height = pi.util.getInt( Math.round( args[ 3 ] ), screenData.height );

	if( x !== 0 && y !== 0 && width !== screenData.width && height !== screenData.height ) {
		screenData.screenObj.render();
		screenData.context.clearRect( x, y, width, height );
	} else {
		screenData.context.clearRect( x, y, width, height );
		screenData.imageData = null;
		screenData.printCursor.x = 0;
		screenData.printCursor.y = 0;
		screenData.x = 0;
		screenData.y = 0;
		screenData.dirty = false;
	}
	m_piData.commands.resetImageData( screenData );
}

pi._.addCommand( "filterImg", filterImg, false, true, [ "filter" ] );
function filterImg( screenData, args ) {
	var filter, data, x, y, i, color;

	filter = args[ 0 ];

	if( ! pi.util.isFunction( filter ) ) {
		m_piData.log("filter: Argument filter must be a callback function.");
		return;
	}

	m_piData.commands.getImageData( screenData );
	data = screenData.imageData.data;

	// Swap's all colors
	for( y = 0; y < screenData.height; y++ ) {
		for( x = 0; x < screenData.width; x++ ) {
			i = ( ( screenData.width * y ) + x ) * 4;
			color = filter( {
				"r": data[ i ],
				"g": data[ i + 1 ],
				"b": data[ i + 2 ],
				"a": data[ i + 3 ]
			}, x, y );
			if( color &&
					pi.util.isInteger( color.r ) &&
					pi.util.isInteger( color.g ) &&
					pi.util.isInteger( color.b ) &&
					pi.util.isInteger( color.a ) ) {
				color.r = pi.util.clamp( color.r, 0, 255 );
				color.g = pi.util.clamp( color.g, 0, 255 );
				color.b = pi.util.clamp( color.b, 0, 255 );
				color.a = pi.util.clamp( color.a, 0, 255 );
				data[ i ] = color.r;
				data[ i + 1 ] = color.g;
				data[ i + 2 ] = color.b;
				data[ i + 3 ] = color.a;
			}
		}
	}

	m_piData.commands.setImageDirty( screenData );
}

// Render command
pi._.addCommand( "render", render, false, true, [] );
function render( screenData ) {
	if( screenData.imageData && screenData.dirty ) {
		screenData.context.putImageData( screenData.imageData, 0, 0 );
	}
	screenData.dirty = false;
}

// End of File Encapsulation
} )();
