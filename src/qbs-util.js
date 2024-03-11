/*
* File: qbs-util.js
*/
window.qbs.util = ( function () {
	"use strict";

	function isFunction( fn ) {
		return fn &&
			{}.toString.call( fn ) === '[object Function]';
	}

	function isDomElement( el ) {
		return el instanceof Element;
	}

	function hexToColor( hex ) {
		var r, g, b, a, s2;
		s2 = hex;
		if( hex.length === 4 ) {
			r = parseInt( hex.slice( 1, 2 ), 16 ) * 16 - 1;
			g = parseInt( hex.slice( 2, 3 ), 16 ) * 16 - 1;
			b = parseInt( hex.slice( 3, 4 ), 16 ) * 16 - 1;
		} else {
			r = parseInt( hex.slice( 1, 3 ), 16 );
			g = parseInt( hex.slice( 3, 5 ), 16 );
			b = parseInt( hex.slice( 5, 7 ), 16 );
		}
		if( hex.length === 9 ) {
			s2 = hex.slice( 0, 7 );
			a = parseInt( hex.slice( 7, 9 ), 16 );
		} else {
			a = 255;
		}

		return {
			"r": r,
			"g": g,
			"b": b,
			"a": a,
			"s": "rgba(" + r + "," + g + "," + b + "," +
				Math.round( a / 255 * 1000 ) / 1000 + ")",
			"s2": s2
		};
	}

	function hexToData( hex, width, height ) {
		var x, y, data, digits, hexPart, i, digitIndex;

		hex = hex.toUpperCase();
		data = [];
		i = 0;
		digits = "";
		digitIndex = 0;
		for( y = 0; y < height; y++ ) {
			data.push( [] );
			for( x = 0; x < width; x++ ) {
				if( digitIndex >= digits.length ) {
					hexPart = parseInt( hex[ i ], 16 );
					if( isNaN( hexPart ) ) {
						hexPart = "0000";
					}
					digits = padL( hexPart.toString( 2 ), 4, "0" );
					
					i += 1;
					digitIndex = 0;
				}
				data[ y ].push( parseInt( digits[ digitIndex ] ) );
				digitIndex += 1;
			}
		}
		return data;
	}

	function dataToHex( data ) {
		var x, y, digits, hex;

		hex = "";
		digits = "";
		for( y = 0; y < data.length; y++ ) {
			for( x = 0; x < data[ y ].length; x++ ) {
				digits += data[ y ][ x ];
				if( digits.length === 4 ) {
					hex += parseInt( digits, 2 ).toString( 16 );
					digits = "";
				}
			}			
		}
		
		return hex;
	}

	function cToHex( c ) {
		if( ! qbs.util.isInteger( c ) ) {
			c = Math.round( c );
		}
		c = clamp( c, 0, 255 );
		var hex = Number( c ).toString( 16 );
		if ( hex.length < 2 ) {
			hex = "0" + hex;
		}
		return hex.toUpperCase();
	}

	function rgbToHex( r, g, b, a ) {
		if( isNaN( a ) ) {
			a = 255;
		}
		return "#" + cToHex( r ) + cToHex( g ) + cToHex( b ) + cToHex( a );
	}

	function rgbToColor( r, g, b, a ) {
		return hexToColor( rgbToHex( r, g, b, a ) );
	}

	function colorStringToColor( colorStr ) {
		var canvas, context, data;

		canvas = document.createElement( "canvas" );
		context = canvas.getContext( "2d" );
		context.fillStyle = colorStr;
		context.fillRect( 0, 0, 1 , 1 );
		data = context.getImageData( 0, 0, 1, 1 ).data;
		return rgbToColor( data[ 0 ], data[ 1 ], data[ 2 ], data[ 3 ] );
	}

	function colorStringToHex( colorStr ) {
		return colorStringToColor( colorStr ).s2;
	}

	function convertToColor( color ) {
		var check_hex_color;
		if( color === undefined ) {
			return null;
		}
		if( qbs.util.isArray( color ) && color.length > 2 ) {
			return rgbToColor( color[ 0 ], color[ 1 ], color[ 2 ], color[ 3 ] );
		}
		if(
			qbs.util.isInteger( color.r ) &&
			qbs.util.isInteger( color.g ) &&
			qbs.util.isInteger( color.b )
		) {
			return rgbToColor( color.r, color.g, color.b, color.a );
		}

		if( typeof color !== "string" ) {
			return null;
		}
		check_hex_color = /(^#[0-9A-F]{8}$)|(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
		if( check_hex_color.test( color ) ) {
			return hexToColor( color );
		}
		if( color.indexOf( "rgb" ) === 0 ) {
			color = splitRgb( color );
			if( color.length < 3 ) {
				return null;
			}
			return rgbToColor( color[ 0 ], color[ 1 ], color[ 2 ], color[ 3 ] );
		}
		return colorStringToColor( color );
	}

	function splitRgb( s ) {
		var parts, i, colors, val;
		s = s.slice( s.indexOf( "(" ) + 1, s.indexOf( ")" ) );
		parts = s.split( "," );
		colors = [];
		for( i = 0; i < parts.length; i++ ) {
			if( i === 3 ) {
				val = parseFloat( parts[ i ].trim() ) * 255;
			} else {
				val = parseInt( parts[ i ].trim() );
			}
			colors.push( val );
		}
		return colors;
	}

	function checkColor( strColor ) {
		var s = new Option().style;
		s.color = strColor;
		return s.color !== '';
	}

	function compareColors( color_1, color_2 ) {
		return color_1.r === color_2.r &&
				   color_1.g === color_2.g &&
					 color_1.b === color_2.b &&
					 color_1.a === color_2.a;
	}

	// Copies properties from one object to another
	function copyProperties( dest, src ) {
		var prop;
		for( prop in src ) {
			if( src.hasOwnProperty( prop ) ) {
				dest[ prop ] = src[ prop ];
			}
		}
	}

	function convertToArray( src ) {
		var prop, arr;
		arr = [];
		for( prop in src ) {
			if( src.hasOwnProperty( prop ) ) {
				arr.push( src[ prop ] );
			}
		}
		return arr;
	}

	function deleteProperties( obj1 ) {
		var prop;
		for( prop in obj1 ) {
			if( obj1.hasOwnProperty( prop ) ) {
				delete obj1[ prop ];
			}
		}
	}

	function clamp( num, min, max ) {
		return Math.min( Math.max( num, min ), max );
	}

	function inRange( point, hitBox ) {
		return 	point.x >= hitBox.x && point.x < hitBox.x + hitBox.width &&
				point.y >= hitBox.y && point.y < hitBox.y + hitBox.height;
	}

	function inRange2( x1, y1, x2, y2, width, height ) {
		return 	x1 >= x2 && x1 < x2 + width &&
				y1 >= y2 && y1 < y2 + height;
	}

	function rndRange( min, max ) {
		return Math.random() * ( max - min ) + min;
	}

	function degreesToRadian( deg ) {
		return deg * ( Math.PI / 180 );
	}

	function radiansToDegrees( rad ) {
		return rad * ( 180 / Math.PI );
	}

	function padL( str, len, c ) {
		var i, pad;
		if(typeof c !== "string") {
			c = " ";
		}
		pad = "";
		str = str + "";
		for( i = str.length; i < len; i++ ) {
			pad += c;
		}
		return pad + str;
	}

	function padR(str, len, c) {
		var i;
		if(typeof c !== "string") {
			c = " ";
		}
		str = str + "";
		for( i = str.length; i < len; i++ ) {
			str += c;
		}
		return str;
	}

	function pad( str, len, c ) {
		if( typeof c !== "string" || c.length === 0 ) {
			c = " ";
		}
		str = str + "";
		while( str.length < len ) {
			str = c + str + c;
		}
		if( str.length > len ) {
			str = str.substr( 0, len );
		}
		return str;
	}

	function getWindowSize() {
		var width, height;

		width = window.innerWidth || document.documentElement.clientWidth ||
			document.body.clientWidth;

		height = window.innerHeight || document.documentElement.clientHeight ||
			document.body.clientHeight;

		return {
			"width": width,
			"height": height
		};
	}

	function binarySearch( data, search, compareFn ) {
		var m, n, k, result;
		m = 0;
		n = data.length - 1;
		while( m <= n ) {
			k = ( n + m ) >> 1;
			result = compareFn( search, data[ k ], k );
			if( result > 0 ) {
				m = k + 1;
			} else if( result < 0 ) {
				n = k - 1;
			} else {
				return k;
			}
		}
		return -m - 1;
	}

	// Setup commands that will run only in the qbs api
	var api = {
		"binarySearch": binarySearch,
		"checkColor": checkColor,
		"clamp": clamp,
		"colorStringToHex": colorStringToHex,
		"compareColors": compareColors,
		"convertToArray": convertToArray,
		"convertToColor": convertToColor,
		"copyProperties": copyProperties,
		"cToHex": cToHex,
		"degreesToRadian": degreesToRadian,
		"deleteProperties": deleteProperties,
		"getWindowSize": getWindowSize,
		"hexToColor": hexToColor,
		"hexToData": hexToData,
		"dataToHex": dataToHex,
		"inRange": inRange,
		"inRange2": inRange2,
		"isArray": Array.isArray,
		"isDomElement": isDomElement,
		"isFunction": isFunction,
		"isInteger": Number.isInteger,
		"math": {
			"deg30": Math.PI / 6,
			"deg45": Math.PI / 4,
			"deg60": Math.PI / 3,
			"deg90": Math.PI / 2,
			"deg120": ( 2 * Math.PI ) / 3,
			"deg135": ( 3 * Math.PI ) / 4,
			"deg150": ( 5 * Math.PI ) / 6,
			"deg180": Math.PI,
			"deg210": ( 7 * Math.PI ) / 6,
			"deg225": ( 5 * Math.PI ) / 4,
			"deg240": ( 4 * Math.PI ) / 3,
			"deg270": ( 3 * Math.PI ) / 2,
			"deg300": ( 5 * Math.PI ) / 3,
			"deg315": ( 7 * Math.PI ) / 4,
			"deg330": ( 11 * Math.PI ) / 6,
			"deg360": Math.PI * 2
		},
		"pad": pad,
		"padL": padL,
		"padR": padR,
		"queueMicrotask": function( callback ) {
			window.queueMicrotask( callback )
		},
		"radiansToDegrees": radiansToDegrees,
		"rgbToColor": rgbToColor,
		"rgbToHex": rgbToHex,
		"rndRange": rndRange
	};

	// Number.isInteger polyfill
	if( typeof Number.isInteger !== "function" ) {
		api.isInteger = function( value ) {
			return typeof value === 'number' &&
				isFinite( value ) &&
				Math.floor( value ) === value;
		};
	}

	// Array.isArray polyfill
	if ( typeof Array.isArray !== "function" ) {
		api.isArray = function( arg ) {
			return Object.prototype.toString.call( arg ) === '[object Array]';
		};
	}

	// Queue Microtask polyfill
	if ( typeof window.queueMicrotask !== "function" ) {
		api.queueMicrotask = function ( callback ) {
			setTimeout( callback, 0 );
		};
	}
	return api;

} )();
