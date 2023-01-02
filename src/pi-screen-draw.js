/*
* File: pi-screen-images.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, pi;

pi = window.pi;
m_piData = pi._.data;

pi._.addCommand( "draw", draw, false, true, [ "drawString" ] );
function draw( screenData, args ) {

	var drawString, tempColors, i, reg, parts, isReturn, lastCursor,
		isBlind, isArc, drawArgs, color, len, angle, color1, radius, angle1,
		angle2;

	drawString = args[ 0 ];

	if( typeof drawString !== "string" ) {
		m_piData.log( "draw: drawString must be a string." );
		return;
	}

	//Conver to uppercase
	drawString = drawString.toUpperCase();

	//Get colors
	tempColors = drawString.match( /(#[A-Z0-9]+)/g );
	if( tempColors ) {
		for( i = 0; i < tempColors.length; i++ ) {
			drawString = drawString.replace( "C" + tempColors[ i ], "O" + i );
		}
	}

	//Convert TA to T
	drawString = drawString.replace( /(TA)/gi, "T" );

	//Convert the commands to uppercase and remove spaces
	drawString = drawString.split( /\s+/ ).join( "" );

	//Regular expression for the draw commands
	reg = /(?=C|C#|R|B|F|G|L|A|T|D|G|H|U|E|N|M|P|S)/;

	//Run the regular expression and split into seperate commands
	parts = drawString.split( reg );

	//This triggers a move back after drawing the next command
	isReturn = false;

	//Store the last cursor
	lastCursor = { x: screenData.x, y: screenData.y, angle: 0 };

	//Move without drawing
	isBlind = false;

	isArc = false;

	for( i = 0; i < parts.length; i++ ) {
		drawArgs = parts[ i ].split( /(\d+)/ );

		switch( drawArgs[ 0 ] ) {

			//C - Change Color
			case "C":
				color = Number( drawArgs[ 1 ] );

				screenData.screenObj.setColor( color );
				isBlind = true;
				break;

			case "O":
				color = tempColors[ drawArgs[ 1 ] ];
				screenData.screenObj.setColor( color );
				isBlind = true;
				break;

			//D - Down
			case "D":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				angle = pi.util.degreesToRadian( 90 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//E - Up and Right
			case "E":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = pi.util.degreesToRadian( 315 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//F - Down and Right
			case "F":
				len = pi.util.getInt(  drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = pi.util.degreesToRadian( 45 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//G - Down and Left
			case "G":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = pi.util.degreesToRadian( 135 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//H - Up and Left
			case "H":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = pi.util.degreesToRadian( 225 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//L - Left
			case "L":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				angle = pi.util.degreesToRadian( 180 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//R - Right
			case "R":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				angle = pi.util.degreesToRadian( 0 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//U - Up
			case "U":
				len = pi.util.getInt( drawArgs[ 1 ], 1 );
				angle = pi.util.degreesToRadian( 270 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//P - Paint
			case "P":
			case "S":
				color1 = pi.util.getInt( drawArgs[ 1 ], 0 );

				screenData.screenObj.paint( screenData.x, screenData.y, color1,
					drawArgs[ 0 ] === "S" );
				isBlind = true;
				break;

			//A - Arc Line
			case "A":
				radius = pi.util.getInt( drawArgs[ 1 ], 1 );
				angle1 = pi.util.getInt( drawArgs[ 3 ], 1 );
				angle2 = pi.util.getInt( drawArgs[ 5 ], 1 );
				isArc = true;
				break;

			//TA - T - Turn Angle
			case "T":
				screenData.angle = pi.util.degreesToRadian(
					pi.util.getInt( drawArgs[ 1 ], 1 )
				);
				isBlind = true;
				break;

			//M - Move
			case "M":
				screenData.x = pi.util.getInt( drawArgs[ 1 ], 1 );
				screenData.y = pi.util.getInt( drawArgs[ 3 ], 1 );
				isBlind = true;
				break;

			default:
				isBlind = true;
		}
		if( ! isBlind ) {
			if( isArc ) {
				screenData.screenObj.arc( screenData.x, screenData.y, radius, angle1,
					angle2 );
			} else {
				screenData.screenObj.line( lastCursor.x, lastCursor.y, screenData.x,
					screenData.y );
			}
		}
		isBlind = false;
		isArc = false;
		if( isReturn ) {
			isReturn = false;
			screenData.x = lastCursor.x;
			screenData.y = lastCursor.y;
			screenData.angle = lastCursor.angle;
		}
		if( drawArgs[ 0 ] === "N" ) {
			isReturn = true;
		} else {
			lastCursor = {
				"x": screenData.x,
				"y": screenData.y,
				"angle": screenData.angle
			};
		}

		if( drawArgs[ 0 ] === "B" ) {
			isBlind = true;
		}
	}
}

// End of File Encapsulation
} )();
