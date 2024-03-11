/*
* File: qbs-screen-bezier.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;


// Bezier curve
qbs._.addCommands( "bezier", pxBezier, aaBezier, [
	"xStart", "yStart", "x1", "y1", "x2", "y2", "xEnd", "yEnd"
] );
function pxBezier( screenData, args ) {
	var xStart, yStart, x1, y1, x2,
		y2, xEnd, yEnd, color, points, t, dt, point, lastPoint,
		distance, minDistance;

	xStart = parseInt( args[ 0 ] );
	yStart = parseInt( args[ 1 ] );
	x1 = parseInt( args[ 2 ] );
	y1 = parseInt( args[ 3 ] );
	x2 = parseInt( args[ 4 ] );
	y2 = parseInt( args[ 5 ] );
	xEnd = parseInt( args[ 6 ] );
	yEnd = parseInt( args[ 7 ] );

	// Make sure x and y are integers
	if( isNaN( xStart ) || isNaN( yStart ) ||
		isNaN( x1 ) || isNaN( y1 ) ||
		isNaN( x2 ) || isNaN( y2 ) ||
		isNaN( xEnd ) || isNaN( yEnd ) ) {
		m_qbData.log( "bezier: Argument's xStart, yStart, x1, y1, x2, y2, xEnd, and yEnd" +
			" must be numbers." );
		return;
	}

	// Initialize the color for the line
	color = screenData.fColor;

	m_qbData.commands.getImageData( screenData );
	minDistance = screenData.pen.size;
	points = [
		{ "x": xStart, "y": yStart },
		{ "x": x1, "y": y1 },
		{ "x": x2, "y": y2 },
		{ "x": xEnd, "y": yEnd }
	];

	lastPoint = calcStep( 0, points );

	// Set the first pixel
	screenData.pen.draw( screenData, lastPoint.x, lastPoint.y, color );

	t = 0.1;
	dt = 0.1;
	while( t < 1 ) {
		point = calcStep( t, points );
		distance = calcDistance( point, lastPoint );

		// Adjust the step size if it's too big
		if( distance > minDistance && dt > 0.00001 ) {
			t -= dt;
			dt = dt * 0.75;
		} else {
			screenData.pen.draw( screenData, point.x, point.y, color );
			lastPoint = point;
		}
		t += dt;
	}

	// Draw the last step
	point = calcStep( 1, points );
	screenData.pen.draw( screenData, point.x, point.y, color );

	m_qbData.commands.setImageDirty( screenData );
}

function calcDistance( p1, p2 ) {
	var dx, dy;
	dx = p1.x - p2.x;
	dy = p1.y - p2.y;
	return dx * dx + dy * dy;
}

function calcStep( t, points ) {
	var a, a2, a3, t2, t3;
	a = ( 1 - t );
	a2 = a * a;
	a3 = a * a * a;
	t2 = t * t;
	t3 = t * t * t;

	return {
		"x": Math.round(
			a3 * points[ 0 ].x +
			3 * a2 * t * points[ 1 ].x +
			3 * a * t2 * points[ 2 ].x +
			t3 * points[ 3 ].x
		),
		"y": Math.round(
			a3 * points[ 0 ].y +
			3 * a2 * t * points[ 1 ].y +
			3 * a * t2 * points[ 2 ].y +
			t3 * points[ 3 ].y
		)
	};
}

function aaBezier( screenData, args ) {
	var xStart, yStart, x1, y1, x2, y2, xEnd, yEnd;

	xStart = args[ 0 ] + 0.5;
	yStart = args[ 1 ] + 0.5;
	x1 = args[ 2 ] + 0.5;
	y1 = args[ 3 ] + 0.5;
	x2 = args[ 4 ] + 0.5;
	y2 = args[ 5 ] + 0.5;
	xEnd = args[ 6 ] + 0.5;
	yEnd = args[ 7 ] + 0.5;

	if(
		isNaN( xStart ) || isNaN( yStart ) || isNaN( x1 ) || isNaN( y1 ) ||
		isNaN( x2 ) || isNaN( y2 ) || isNaN( xEnd ) || isNaN( yEnd )
	) {
		m_qbData.log(
			"bezier: parameters xStart, yStart, x1, y1, x2, y2, xEnd, and yEnd must " +
			"be numbers."
		);
		return;
	}

	screenData.screenObj.render();

	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.beginPath();
	screenData.context.moveTo( xStart, yStart );
	screenData.context.bezierCurveTo( x1, y1, x2, y2, xEnd, yEnd );
	screenData.context.stroke();
}

// End of File Encapsulation
} )();
