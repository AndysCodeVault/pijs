$.screen("300x200");
$.circle(150, 100, 50, "red");
$.filterImg( function ( color, x, y ) {
	color.r = color.r - Math.round( Math.tan( ( x + y ) / 10 ) * 128 );
	color.g = color.g + Math.round( Math.cos( x / 7 ) * 128 );
	color.b = color.b + Math.round( Math.sin( y / 5 ) * 128 );
	return color;
} );