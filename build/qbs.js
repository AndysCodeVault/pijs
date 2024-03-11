/*
* File: qbs.js
*/

window.qbs = ( function () {
	"use strict";

	var m_qbData, m_api, m_waiting, m_waitCount, m_readyList, m_commandList, m_startReadyListTimeout;

	m_waitCount = 0;
	m_waiting = false;
	m_readyList = [];
	m_commandList = [];
	m_startReadyListTimeout = 0;

	// Initilize data
	m_qbData = {
		"nextScreenId": 0,
		"screens": {},
		"activeScreen": null,
		"images": {},
		"imageCount": 0,
		"defaultPrompt": String.fromCharCode( 219 ),
		"defaultFont": {},
		"nextFontId": 0,
		"fonts": {},
		"defaultPalette": [],
		"defaultColor": 7,
		"commands": {},
		"screenCommands": {},
		"defaultPenDraw": null,
		"pens": {},
		"penList": [],
		"blendCommands": {},
		"blendCommandsList": [],
		"defaultBlendCmd": null,
		"settings": {},
		"settingsList": [],
		"volume": 0.75,
		"log": logError,
		"isTouchScreen": false
	};

	// QBS api
	m_api = {
		"_": {
			"addCommand": addCommand,
			"addCommands": addCommands,
			"addSetting": addSetting,
			"processCommands": processCommands,
			"addPen": addPen,
			"addBlendCommand": addBlendCommand,
			"data": m_qbData,
			"resume": resume,
			"wait": wait
		}
	};

	// Add a command to the internal list
	function addCommand( name, fn, isInternal, isScreen, parameters, isSet ) {
		m_qbData.commands[ name ] = fn;

		if( ! isInternal ) {
			m_commandList.push( {
				"name": name,
				"fn": fn,
				"isScreen": isScreen,
				"parameters": parameters,
				"isSet": isSet,
				"noParse": isSet
			} );
		}
	}

	function addCommands( name, fnPx, fnAa, parameters ) {
		addCommand( name, function ( screenData, args ) {
			if( screenData.pixelMode ) {
				fnPx( screenData, args );
			} else {
				fnAa( screenData, args );
			}
		}, false, true, parameters );
	}

	function addSetting( name, fn, isScreen, parameters ) {
		m_qbData.settings[ name ] = {
			"name": name,
			"fn": fn,
			"isScreen": isScreen,
			"parameters": parameters
		};
		m_qbData.settingsList.push( name );
	}

	function processCommands() {
		var i, cmd;

		// Alphabetize commands
		m_commandList = m_commandList.sort( function( a, b ) {
			var nameA = a.name.toUpperCase();
			var nameB = b.name.toUpperCase();
			if( nameA < nameB ) {
				return -1;
			}
			if( nameA > nameB ) {
				return 1;
			}
			return 0;
		} );

		for( i = 0; i < m_commandList.length; i++ ) {
			cmd = m_commandList[ i ];
			processCommand( cmd );
		}
	}

	function processCommand( cmd ) {
		if( cmd.isSet ) {
			m_qbData.screenCommands[ cmd.name ] = cmd;
			m_api[ cmd.name ] = function () {
				var args;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				return m_qbData.commands[ cmd.name ]( null, args );
			};
			return;
		}

		if( cmd.isScreen ) {
			m_qbData.screenCommands[ cmd.name ] = cmd
			m_api[ cmd.name ] = function () {
				var args, screenData;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				screenData = getScreenData( undefined, cmd.name );
				if( screenData !== false ) {
					return m_qbData.commands[ cmd.name ]( screenData, args );
				}
			};
		} else {
			m_api[ cmd.name ] = function () {
				var args;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				return m_qbData.commands[ cmd.name ]( args );
			};
		}
	}

	// Convert named arguments to array
	addCommand( "parseOptions", parseOptions, true, false );
	function parseOptions( cmd, args ) {
		var i, options, args2, foundParameter;

		if( cmd.noParse ) {
			return args;
		}

		// if the first argument is an object then use named parameters
		if(
			args.length > 0 &&
			typeof args[ 0 ] === "object" &&
			args[ 0 ] !== null &&
			! args[ 0 ].hasOwnProperty( "screen" ) &&
			! qbs.util.isArray( args[ 0 ] ) &&
			! qbs.util.isDomElement( args[ 0 ] ) 
		) {
			options = args[ 0 ];
			args2 = [];
			foundParameter = false;
			for( i = 0; i < cmd.parameters.length; i++ ) {

				// Check if option has parameter
				if( options.hasOwnProperty( cmd.parameters[ i ] ) ) {
					args2.push( options[ cmd.parameters[ i ] ] );
					foundParameter = true;
				} else {
					args2.push( null );
				}
			}
			if( foundParameter ) {
				return args2;
			}
		}
		return args;
	}

	// Add a pen to the internal list
	function addPen( name, fn, cap ) {
		m_qbData.penList.push( name );
		m_qbData.pens[ name ] = {
			"cmd": fn,
			"cap": cap
		};
	}

	function addBlendCommand( name, fn ) {
		m_qbData.blendCommandsList.push( name );
		m_qbData.blendCommands[ name ] = fn;
	}

	// Gets the screen data
	addCommand( "getScreenData", getScreenData, true, false, [] );
	function getScreenData( screenId, commandName ) {
		if( m_qbData.activeScreen === null ) {
			if( commandName === "set" ) {
				return false;
			}
			m_qbData.log( commandName + ": No screens available for command." );
			return false;
		}
		if( screenId === undefined || screenId === null ) {
			screenId = m_qbData.activeScreen.id;
		}
		if( qbs.util.isInteger( screenId ) && ! m_qbData.screens[ screenId ] ) {
			m_qbData.log( commandName + ": Invalid screen id." );
			return false;
		}
		return m_qbData.screens[ screenId ];
	}

	function resume() {
		m_waitCount--;
		if( m_waitCount === 0 ) {
			startReadyList();
		}
	}

	function startReadyList() {
		var i, temp;

		if( document.readyState !== "loading" ) {
			m_waiting = false;
			temp = m_readyList.slice();
			m_readyList = [];
			for( i = 0; i < temp.length; i++ ) {
				temp[ i ]();
			}
		} else {
			clearTimeout( m_startReadyListTimeout );
			m_startReadyListTimeout = setTimeout( startReadyList, 10 );
		}
	}

	function wait() {
		m_waitCount++;
		m_waiting = true;
	}

	// This trigger a function once QBS is completely loaded
	addCommand( "ready", ready, false, false, [ "fn" ] );
	function ready( args ) {
		var fn;

		fn = args[ 0 ];

		if( qbs.util.isFunction( fn ) ) {
			if( m_waiting ) {
				m_readyList.push( fn );
			} else if ( document.readyState === "loading" ) {
				m_readyList.push( fn );
				clearTimeout( m_startReadyListTimeout );
				m_startReadyListTimeout = setTimeout( startReadyList, 10 );
			} else {
				fn();
			}
		}
	}

	// Set the active screen on qbs
	addCommand( "setScreen", setScreen, false, false, [ "screen" ] );
	addSetting( "screen", setScreen, false, [ "screen" ] );
	function setScreen( args ) {
		var screenObj, screenId;

		screenObj = args[ 0 ];

		if( qbs.util.isInteger( screenObj ) ) {
			screenId = screenObj;
		} else if( screenObj && qbs.util.isInteger( screenObj.id ) ) {
			screenId = screenObj.id;
		}
		if( ! m_qbData.screens[ screenId ] ) {
			m_qbData.log( "screen: Invalid screen." );
			return;
		}
		m_qbData.activeScreen = m_qbData.screens[ screenId ];
	}

	// Remove all screens from the page and memory
	addCommand( "removeAllScreens", removeAllScreens, false, false, [] );
	function removeAllScreens() {
		var i, screenData;
		for( i in m_qbData.screens ) {
			screenData = m_qbData.screens[ i ];
			screenData.screenObj.removeScreen();
		}
		m_qbData.nextScreenId = 0;
	}

	addCommand( "getScreen", getScreen, false, false, [ "screenId" ] );
	function getScreen( args ) {
		var screenId, screen;

		screenId = args[ 0 ];
		screen = getScreenData( screenId, "getScreen" );
		return screen.screenObj;
	}

	// Set the default palette
	addCommand( "setDefaultColor", setDefaultColor, false, false, [ "color" ] );
	addSetting( "defaultColor", setDefaultColor, false, [ "color" ] );
	function setDefaultColor( args ) {
		var c;

		c = args[ 0 ];
		if( !isNaN( Number( c ) ) && m_qbData.defaultPalette.length > c ) {
			m_qbData.defaultColor = c;
		} else {
			c = qbs.util.convertToColor( c );
			if( c === null ) {
				m_qbData.log(
					"setDefaultColor: invalid color value for parameter color."
				);
			}
		}
	}

	// Set the default palette
	addCommand( "setDefaultPal", setDefaultPal, false, false, [ "pal" ] );
	addSetting( "defaultPal", setDefaultPal, false, [ "pal" ] );
	function setDefaultPal( args ) {
		var pal, i, c;

		pal = args[ 0 ];
		if( ! qbs.util.isArray( pal ) ) {
			m_qbData.log( "setDefaultPal: parameter pal is not an array." );
			return;
		}

		if( pal.length < 1 ) {
			m_qbData.log( "setDefaultPal: parameter pal must have at least one color value." );
		}

		m_qbData.defaultPalette = [];
		
		if( pal.length > 1 ) {
			m_qbData.defaultColor = 1;
		} else {
			m_qbData.defaultColor = 0;
		}

		for( i = 0; i < pal.length; i++ ) {
			c = qbs.util.convertToColor( pal[ i ] );
			if( c === null ) {
				m_qbData.log(
					"setDefaultPal: invalid color value inside array pal."
				);
				m_qbData.defaultPalette.push(
					qbs.util.convertToColor( "#000000" )
				);
			} else {
				m_qbData.defaultPalette.push(
					qbs.util.convertToColor( pal[ i ] )
				);
			}
		}

		// Set color 0 to transparent
		m_qbData.defaultPalette[ 0 ] = qbs.util.convertToColor( [
			m_qbData.defaultPalette[ 0 ].r,
			m_qbData.defaultPalette[ 0 ].g,
			m_qbData.defaultPalette[ 0 ].b,
			0
		] );
	}

	// Get default pal command
	addCommand( "getDefaultPal", getDefaultPal, false, false, [] );
	function getDefaultPal( args ) {
		var i, color, colors;
		colors = [];
		for( i = 0; i < m_qbData.defaultPalette.length; i++ ) {
			color = {
				"r": m_qbData.defaultPalette[ i ].r,
				"g": m_qbData.defaultPalette[ i ].g,
				"b": m_qbData.defaultPalette[ i ].b,
				"a": m_qbData.defaultPalette[ i ].a,
				"s": m_qbData.defaultPalette[ i ].s
			};
			colors.push( m_qbData.defaultPalette[ i ] );
		}
		return colors;
	}

	// Global settings command
	addCommand( "set", set, false, true, m_qbData.settingsList, true );
	function set( screenData, args ) {
		var options, optionName, setting, optionValues;

		options = args[ 0 ];

		// Loop through all the options
		for( optionName in options ) {

			// If the option is a valid setting
			if( m_qbData.settings[ optionName ] ) {

				// Get the setting data
				setting = m_qbData.settings[ optionName ];

				// Parse the options from the setting
				optionValues = options[ optionName ];
				if( 
					! qbs.util.isArray( optionValues ) && 
					typeof optionValues === "object"
				) {
					optionValues = parseOptions( setting, [ optionValues ] );
				} else {
					optionValues = [ optionValues ];
				}

				// Call the setting function
				if( setting.isScreen ) {
					if( ! screenData ) {
						screenData = getScreenData(
							undefined, "set " + setting.name
						);
					}
					setting.fn( screenData, optionValues );
				} else {
					setting.fn( optionValues );
				}
			}
		}
	}

	addCommand( "setErrorMode", setErrorMode, false, false, [ "mode" ] );
	addSetting( "errorMode", setErrorMode, false, [ "mode" ] );
	function setErrorMode( args ) {
		var mode;

		mode = args[ 0 ];

		if( mode === "log" ) {
			m_qbData.log = logError;
		} else if( mode === "throw" ) {
			m_qbData.log = throwError;
		} else if( mode === "none" ) {
			m_qbData.log = noError;
		} else {
			m_qbData.log(
				"setErrorMode: mode must be one of the following strings: " +
				"log, throw, none."
			);
			return;
		}
	}

	function logError( msg ) {
		console.error( msg );
	}

	function throwError( msg ) {
		throw msg;
	}

	function noError() {}

	

	return m_api;

} )();
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
/*
* File: qbs-keyboard.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_keys, m_keyKeys, m_keyLookup, m_keyCodes, m_preventKeys,
	m_inputs, m_inputIndex, m_t, m_promptInterval, m_blink, m_promptBackground,
	m_promptBackgroundWidth, m_onKeyEventListeners, m_anyKeyEventListeners, m_keyboard,
	m_isKeyEventsActive, m_onKeyCombos;

m_qbData = qbs._.data;
m_keyLookup = {
	"Alt_1": "AltLeft",
	"Alt_2": "AltRight",
	"ArrowDown_0": "ArrowDown",
	"ArrowLeft_0": "ArrowLeft",
	"ArrowRight_0": "ArrowRight",
	"ArrowUp_0": "ArrowUp",
	"\\_0": "Backslash",
	"|_0": "Backslash",
	"~_0": "Backquote",
	"`_0": "Backquote",
	"Backspace_0": "Backspace",
	"[_0": "BracketLeft",
	"{_0": "BracketLeft",
	"]_0": "BracketRight",
	"}_0": "BracketRight",
	"CapsLock_0": "CapsLock",
	"ContextMenu_0": "ContextMenu",
	"Control_1": "ControlLeft",
	"Control_2": "ControlRight",
	",_0": "Comma",
	"<_0": "Comma",
	"Delete_0": "Delete",
	")_0": "Digit0",
	"0_0": "Digit0",
	"1_0": "Digit1",
	"!_0": "Digit1",
	"2_0": "Digit2",
	"@_0": "Digit2",
	"3_0": "Digit3",
	"#_0": "Digit3",
	"4_0": "Digit4",
	"$_0": "Digit4",
	"5_0": "Digit5",
	"%_0": "Digit5",
	"6_0": "Digit6",
	"^_0": "Digit6",
	"7_0": "Digit7",
	"&_0": "Digit7",
	"8_0": "Digit8",
	"*_0": "Digit8",
	"9_0": "Digit9",
	"(_0": "Digit9",
	"End_0": "End",
	"Enter_0": "Enter",
	"+_0": "Equal",
	"=_0": "Equal",
	"Escape_0": "Escape",
	"F1_0": "F1",
	"F2_0": "F2",
	"F3_0": "F3",
	"F4_0": "F4",
	"F5_0": "F5",
	"F6_0": "F6",
	"F7_0": "F7",
	"F8_0": "F8",
	"F9_0": "F9",
	"F10_0": "F10",
	"F11_0": "F11",
	"F12_0": "F12",
	"Home_0": "Home",
	"Insert_0": "Insert",
	"a_0": "KeyA",
	"A_0": "KeyA",
	"b_0": "KeyB",
	"B_0": "KeyB",
	"c_0": "KeyC",
	"C_0": "KeyC",
	"d_0": "KeyD",
	"D_0": "KeyD",
	"e_0": "KeyE",
	"E_0": "KeyE",
	"f_0": "KeyF",
	"F_0": "KeyF",
	"g_0": "KeyG",
	"G_0": "KeyG",
	"h_0": "KeyH",
	"H_0": "KeyH",
	"i_0": "KeyI",
	"I_0": "KeyI",
	"j_0": "KeyJ",
	"J_0": "KeyJ",
	"k_0": "KeyK",
	"K_0": "KeyK",
	"l_0": "KeyL",
	"L_0": "KeyL",
	"m_0": "KeyM",
	"M_0": "KeyM",
	"n_0": "KeyN",
	"N_0": "KeyN",
	"o_0": "KeyO",
	"O_0": "KeyO",
	"p_0": "KeyP",
	"P_0": "KeyP",
	"q_0": "KeyQ",
	"Q_0": "KeyQ",
	"r_0": "KeyR",
	"R_0": "KeyR",
	"S_0": "KeyS",
	"s_0": "KeyS",
	"t_0": "KeyT",
	"T_0": "KeyT",
	"u_0": "KeyU",
	"U_0": "KeyU",
	"v_0": "KeyV",
	"V_0": "KeyV",
	"w_0": "KeyW",
	"W_0": "KeyW",
	"x_0": "KeyX",
	"X_0": "KeyX",
	"y_0": "KeyY",
	"Y_0": "KeyY",
	"z_0": "KeyZ",
	"Z_0": "KeyZ",
	"Meta_1": "MetaLeft",
	"Meta_2": "MetaRight",
	"__0": "Minus",
	"-_0": "Minus",
	"NumLock_0": "NumLock",
	"0_3": "Numpad0",
	"Insert_3": "Numpad0",
	"1_3": "Numpad1",
	"End_3": "Numpad1",
	"2_3": "Numpad2",
	"ArrowDown_3": "Numpad2",
	"3_3": "Numpad3",
	"PageDown_3": "Numpad3",
	"4_3": "Numpad4",
	"ArrowLeft_3": "Numpad4",
	"5_3": "Numpad5",
	"Clear_3": "Numpad5",
	"6_3": "Numpad6",
	"ArrowRight_3": "Numpad6",
	"7_3": "Numpad7",
	"Home_3": "Numpad7",
	"8_3": "Numpad8",
	"ArrowUp_3": "Numpad8",
	"9_3": "Numpad9",
	"PageUp_3": "Numpad9",
	"+_3": "NumpadAdd",
	"._3": "NumpadDecimal",
	"Delete_3": "NumpadDecimal",
	"/_3": "NumpadDivide",
	"Enter_3": "NumpadEnter",
	"*_3": "NumpadMultiply",
	"-_3": "NumpadSubtract",
	"PageDown_0": "PageDown",
	"PageUp_0": "PageUp",
	"Cancel_0": "Pause",
	"Pause_0": "Pause",
	"._0": "Period",
	">_0": "Period",
	"PrintScreen_0": "PrintScreen",
	"'_0": "Quote",
	"\"_0": "Quote",
	"ScrollLock_0": "ScrollLock",
	";_0": "Semicolon",
	":_0": "Semicolon",
	"Shift_1": "ShiftLeft",
	"Shift_2": "ShiftRight",
	"/_0": "Slash",
	"?_0": "Slash",
	" _0": "Space",
	"Tab_0": "Tab"
};
m_keys = {};
m_keyCodes = {};
m_keyKeys = {};
m_preventKeys = {};
m_inputs = [];
m_inputIndex = 0;
m_onKeyEventListeners = {};
m_anyKeyEventListeners = {
	"down": [],
	"up": []
};
m_onKeyCombos = {};
m_keyboard = {
	"lookup": {
		"BS": { "val": String.fromCharCode( 27 ) + " BACK" },
		"CP": { "val": String.fromCharCode( 24 ) + " CAPS" },
		"CP2": { "val": String.fromCharCode( 25 ) + " CAPS" },
		//"ENTER": { "val": String.fromCharCode( 17 ) + "ENTER" },
		"ENTER": {
			"val": 
				String.fromCharCode( 17 ) +
				String.fromCharCode( 217 ) + "RET" 
		},
		"SY": { "val": " SYMBOLS" },
		"NU": { "val": "" },
		"PM": { "val": "+/-" }
	},
	"keys": {
		"lowercase":
			( "1 2 3 4 5 6 7 8 9 0 BS " +
			"q w e r t y u i o p CP " +
			"a s d f g h j k l SY " +
			"z x c SPACE v b n m ENTER" ).split( /\s+/ )
		,
		"uppercase":
			( "1 2 3 4 5 6 7 8 9 0 BS " +
			"Q W E R T Y U I O P CP2 " +
			"A S D F G H J K L SY " +
			"Z X C SPACE V B N M ENTER" ).split( /\s+/ )
		,
		"symbol":
			( "~ ! @ # $ % ^ & * | BS " +
			"( ) { } [ ] < > \\ / CP " +
			"` \" ' , . ; : ? _ SY " +
			"+ - NU NU NU NU NU NU ENTER" ).split( /\s+/ ),
		"numbers":
			( "1  2 3  4  5  6  7  8  9  0     BS " +
			  "PM . ENTER ").split( /\s+/ )
	},
	"keys2": [],
	"formats": [
		[
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"| | | | | | | | | | |      |",
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"| | | | | | | | | | |      |",
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"| | | | | | | | | |        |",
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"| | | |     | | | | |      |",
			"*-*-*-*-----*-*-*-*-*------*"
		], [
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"| | | | | | | | | | |      |",
			"*-*-*-*-*-*-*-*-*-*-*------*",
			"|     | |                  |",
			"*-----*-*------------------*"
		]
	],
	"keyCase": "lowercase",
	"background": null,
	"eventsLoaded": false,
	"isLowerCase": true,
	"format": null
};
m_keyboard.format = m_keyboard.formats[ 0 ];
m_isKeyEventsActive = false;

initOnscreenKeyboard();

function initOnscreenKeyboard() {
	var caseTypes, keys, key, i, j, lCase, uCase, symbol, numbers;

	caseTypes = [ "lowercase", "uppercase", "symbol", "numbers" ];

	// Convert lookup values
	for( i = 0; i < caseTypes.length; i++ ) {
		for( j = 0; j < m_keyboard.keys[ caseTypes[ i ] ].length; j++ ) {
			keys = m_keyboard.keys[ caseTypes[ i ] ];
			key = keys[ j ];
			if( m_keyboard.lookup[ key ] ) {
				keys[ j ] = m_keyboard.lookup[ key ].val;
			}
		}
	}

	// Special Cases
	m_keyboard.lookup[ String.fromCharCode( 27 ) + " BACK" ] = {
		"key": "Backspace",
		"keyCode": 8
	};
	m_keyboard.lookup[ String.fromCharCode( 24 ) + " CAPS" ] = {
		"key": "CapsLock",
		"keyCode": 20
	};
	m_keyboard.lookup[ String.fromCharCode( 25 ) + " CAPS" ] = {
		"key": "CapsLock",
		"keyCode": 20
	};
	m_keyboard.lookup[
		String.fromCharCode( 17 ) + String.fromCharCode( 217 ) + "RET"
	] = {
		"key": "Enter",
		"keyCode": 13
	};
	m_keyboard.lookup[ " SYMBOLS" ] = {
		"key": "SYMBOLS",
		"keyCode": 0
	};
	m_keyboard.lookup[ "SPACE" ] = {
		"key": " ",
		"keyCode": 32
	};

	// Create keys2 object
	for( i = 0; i < m_keyboard.keys[ "lowercase" ].length; i++ ) {
		lCase = m_keyboard.keys[ "lowercase" ][ i ];
		uCase = m_keyboard.keys[ "uppercase" ][ i ];
		symbol = m_keyboard.keys[ "symbol" ][ i ];

		if( i < m_keyboard.keys[ "numbers" ].length ) {
			numbers = m_keyboard.keys[ "numbers" ][ i ];
		} else {
			numbers = null;
		}

		m_keyboard.keys2.push( {
			"lowercase": lCase,
			"uppercase": uCase,
			"symbol": symbol,
			"numbers": numbers
		} );
	}
}

// Set keyboard event listeners
qbs._.addCommand( "startKeyboard", startKeyboard, false, false, [] );
function startKeyboard() {
	if( ! m_isKeyEventsActive ) {
		document.addEventListener( "keyup", keyup );
		document.addEventListener( "keydown", keydown );
		window.addEventListener( "blur", clearPressedKeys );
		m_isKeyEventsActive = true;
	}
}

// Command to stop event listeners on keyboard
qbs._.addCommand( "stopKeyboard", stopKeyboard, false, false, [] );
function stopKeyboard() {
	if( m_isKeyEventsActive ) {
		document.removeEventListener( "keyup", keyup );
		document.removeEventListener( "keydown", keydown );
		window.removeEventListener( "blur", clearPressedKeys );
		m_isKeyEventsActive = false;
	}
}

// Key up event - document event
function keyup( event ) {
	var key, modeKey, i, temp, keyVal;

	// Lookup the key by using key and location
	key = m_keyLookup[ event.key + "_" + event.location ];

	// Reset the keys - no longer pressed
	m_keys[ key ] = false;
	m_keyKeys[ event.key ] = false;
	m_keyCodes[ event.keyCode ] = false;

	// If a key is registered then prevent the default behavior
	if(
		m_preventKeys[ key ] ||
		m_preventKeys[ event.keyCode ] ||
		m_preventKeys[ event.key ]
	) {
		event.preventDefault();
		event.stopPropagation();
	}

	// Lookup the key
	key = m_keyLookup[ event.key + "_" + event.location ];
	keyVal = {
		"key": event.key,
		"location": event.location,
		"code": key,
		"keyCode": event.keyCode
	};

	// Create the modeKey
	modeKey = "up_" + lookupKey( keyVal.key );

	// trigger on key events
	if( m_onKeyEventListeners[ modeKey ] ) {
		temp = m_onKeyEventListeners[ modeKey ].slice();
		for( i = 0; i < temp.length; i++ ) {
			temp[ i ].fn( keyVal );
		}
	}

	// trigger any key events
	if( m_anyKeyEventListeners[ "up" ] ) {
		temp = m_anyKeyEventListeners[ "up" ].slice();
		for( i = 0; i < temp.length; i++ ) {
			temp[ i ].fn( keyVal );
		}
	}
}

// Key down - document event
function keydown( event ) {
	var key, keyVal, i, temp, modeKey;

	// If we are collecting any inputs
	if( m_inputs.length > 0 ) {
		collectInput( event );
	}

	// Lookup the key
	key = m_keyLookup[ event.key + "_" + event.location ];
	keyVal = {
		"key": event.key,
		"location": event.location,
		"code": key,
		"keyCode": event.keyCode
	};
	m_keys[ key ] = keyVal;
	m_keyKeys[ keyVal.key ] = keyVal;
	m_keyCodes[ event.keyCode ] = keyVal;

	// Prevent default behavior
	if(
		m_preventKeys[ key ] ||
		m_preventKeys[ event.keyCode ] ||
		m_preventKeys[ event.key ]
	) {
		event.preventDefault();
		event.stopPropagation();
	}

	// Create the modeKey
	modeKey = "down_" + lookupKey( keyVal.key );

	// trigger on key events
	if( m_onKeyEventListeners[ modeKey ] ) {
		temp = m_onKeyEventListeners[ modeKey ].slice();
		for( i = 0; i < temp.length; i++ ) {
			temp[ i ].fn( keyVal );
		}
	}

	// trigger any key events
	if( m_anyKeyEventListeners[ "down" ] ) {
		temp = m_anyKeyEventListeners[ "down" ].slice();
		for( i = 0; i < temp.length; i++ ) {
			temp[ i ].fn( keyVal );
		}
	}
}

// Clear all keypresses in case we lose focus
qbs._.addCommand( "clearKeys", clearKeys, false, false, [] );
function clearKeys() {
	var mode, i;

	// Clear key downs
	for( mode in m_onKeyEventListeners ) {
		for( i = m_onKeyEventListeners[ mode ].length - 1; i >= 0; i-- ) {
			m_onKeyEventListeners[ mode ].splice( i, 1 );
		}
	}

	// Clear any key downs
	for( mode in m_anyKeyEventListeners ) {
		for( i = m_anyKeyEventListeners[ mode ].length - 1; i >= 0; i-- ) {
			m_anyKeyEventListeners[ mode ].splice( i, 1 );
		}
	}

}

function clearPressedKeys() {
	var i, j, k;
	for( i in m_keys ) {
		m_keys[ i ] = false;
	}
	for( i in m_keyKeys ) {
		m_keyKeys[ i ] = false;
	}
	for( i in m_keyCodes ) {
		m_keyCodes[ i ] = false;
	}

	// Loop through all key combos
	for( i in m_onKeyCombos ) {

		// Loop through specific key combos
		for( j = 0; j < m_onKeyCombos[ i ].length; j++ ) {

			// Loop through allKeys array
			for( k = 0; k < m_onKeyCombos[ i ][ j ].allKeys.length; k++ ) {

				// Reset the array to false
				m_onKeyCombos[ i ][ j ].allKeys[ k ] = false;

			}
		}
	}
}

// Gets the status of a specific key or all keys currently pressed
qbs._.addCommand( "inkey", inkey, false, false, [ "key" ] );
function inkey( args ) {
	var key, keysReturn, i;

	key = args[ 0 ];

	// Activate key events
	startKeyboard();

	// If the key is provided then return the key status
	if( key != null ) {
		if( m_keys[ key ] ) {
			return m_keys[ key ];
		}
		if( m_keyKeys[ key ] ) {
			return m_keyKeys[ key ];
		}
		return m_keyCodes[ key ];
	}

	// If no key is provided then return all keys pressed status
	keysReturn = {};
	for( i in m_keys ) {
		if( m_keys[ i ] ) {
			keysReturn[ i ] = m_keys[ i ];
		}
	}
	return keysReturn;
}

// Adds an event trigger for a keypress
qbs._.addCommand( "onkey", onkey, false, false,
	[ "key", "mode", "fn", "once" ]
);
function onkey( args ) {
	var key, mode, fn, once, modeKey;

	key = args[ 0 ];
	mode = args[ 1 ];
	fn = args[ 2 ];
	once = !!( args[ 3 ] );

	// Validate mode
	if( mode == null ) {
		mode = "down";
	}

	// Check for key combo
	if( qbs.util.isArray( key ) ) {
		if( mode !== "down" ) {
			m_qbData.log(
				"onkey: mode must be down when using a key combo."
			);
			return;
		}
		onkeyCombo( key, fn, once );
		return;
	}

	// Validate key
	if( ! isNaN( key ) && typeof key !== "string" ) {
		m_qbData.log(
			"onkey: key needs to be either an interger keyCode or " +
			"a string key name."
		);
		return;
	}

	if( mode !== "down" && mode !== "up" ) {
		m_qbData.log(
			"onkey: mode needs to be down or up. "
		);
		return;
	}

	// Validate fn
	if( ! qbs.util.isFunction( fn ) ) {
		m_qbData.log( "onkey: fn is not a valid function." );
		return;
	}

	// Activate key event listeners
	startKeyboard();

	// Prevent key from being triggered in case onkey is called in a
	// keydown event
	setTimeout( function () {
		var tempFn, origFn;

		key = lookupKey( key );

		modeKey = mode + "_" + key;
		origFn = fn;
		// If it's a one time function
		if( once ) {
			tempFn = fn;
			fn = {
				"fn": function () {
					offkey( [ key, mode, origFn ] );
					tempFn();
				},
				"tempFn": tempFn
			};
		} else {
			fn = {
				"fn": origFn
			};
		}

		// Check for the infamous "any" key
		if( typeof key === "string" && key.toLowerCase() === "any" ) {
			m_anyKeyEventListeners[ mode ].push( fn );
		} else {
			if( ! m_onKeyEventListeners[ modeKey ] ) {
				m_onKeyEventListeners[ modeKey ] = [];
			}
			m_onKeyEventListeners[ modeKey ].push( fn );
		}

	}, 1 );
}

function onkeyCombo( keys, fn, once ) {
	var i, allKeys, comboData, comboId;

	comboId = keys.join( "" );
	allKeys = [];

	comboData = {
		"keys": keys.slice(),
		"keyData": [],
		"fn": fn,
		"allKeys": allKeys
	};

	// If the key combo doesn't exist add it
	if( ! m_onKeyCombos[ comboId ] ) {
		m_onKeyCombos[ comboId ] = [];
	}
	m_onKeyCombos[ comboId ].push( comboData );

	for( i = 0; i < keys.length; i++ ) {
		addKeyCombo( keys[ i ], i, allKeys, fn, once, comboData );
	}
}

function addKeyCombo( key, i, allKeys, fn, once, comboData ) {

	// Store the functions so that can run offkey later
	comboData.keyData.push( {
		"key": key,
		"keyComboDown": keyComboDown,
		"keyComboUp": keyComboUp
	} );

	// Default state is not pressed
	allKeys.push( false );

	// on key down
	onkey( [ key, "down", keyComboDown, false ] );

	// on key up
	onkey( [ key, "up", keyComboUp, false ] );

	function keyComboDown( e ) {
		allKeys[ i ] = true;
		if( allKeys.indexOf( false ) === -1 ) {
			if( once ) {
				offkey( [ key, "down", keyComboDown ] );
				offkey( [ key, "up", keyComboUp ] );
			}
			fn( e );
		}
	}

	function keyComboUp( e ) {
		allKeys[ i ] = false;
	}
}

function lookupKey( key ) {
	if( typeof key === "string" && key.length === 1 ) {
		key = key.toUpperCase();
		if( key >= "0" && key <= "9" ) {
			key = "Digit" + key;
		} else if( key >= "A" && key <= "Z" ) {
			key = "Key" + key;
		}
	}

	return key;
}

// Removes an event trigger for a keypress
qbs._.addCommand( "offkey", offkey, false, false, [ "key", "mode", "fn" ] );
function offkey( args ) {
	var key, mode, fn, isClear, i, eventListeners, modeKey;

	key = args[ 0 ];
	mode = args[ 1 ];
	fn = args[ 2 ];

	// Check for key combo
	if( qbs.util.isArray( key ) ) {
		if( mode !== "down" ) {
			m_qbData.log(
				"onkey: mode must be up when using a key combo."
			);
			return;
		}
		offkeyCombo( key, fn );
		return;
	}

	// Validate key
	if( ! isNaN( key ) && typeof key !== "string" ) {
		m_qbData.log(
			"offkey: key needs to be either an interger keyCode or " +
			"a string key name."
		);
		return;
	}

	// Validate mode
	if( mode == null ) {
		mode = "down";
	}

	if( mode !== "down" && mode !== "up" ) {
		m_qbData.log(
			"offkey: mode needs to be down or up. "
		);
		return;
	}

	// Validate fn
	if( ! qbs.util.isFunction( fn ) ) {
		m_qbData.log( "offkey: fn is not a valid function." );
		return;
	}

	key = lookupKey( key );
	modeKey = mode + "_" + key;

	isClear = false;
	if( ! qbs.util.isFunction( fn ) ) {
		isClear = true;
	}

	if( typeof key === "string" && key.toLowerCase() === "any" ) {
		if( isClear ) {
			m_anyKeyEventListeners[ mode ] = [];
		} else {
			for( i = m_anyKeyEventListeners[ mode ].length - 1; i >= 0; i-- ) {
				if( m_anyKeyEventListeners[ mode ][ i ].fn === fn ||
					m_anyKeyEventListeners[ mode ][ i ].tempFn === fn
				) {
					m_anyKeyEventListeners[ mode ].splice( i, 1 );
				}
			}
		}
	} else {
		if( m_onKeyEventListeners[ modeKey ] ) {
			eventListeners = m_onKeyEventListeners[ modeKey ];
			if( isClear ) {
				m_onKeyEventListeners[ modeKey ] = [];
			} else {
				for( i = eventListeners.length - 1; i >= 0; i-- ) {
					if( 
						eventListeners[ i ].fn === fn || 
						eventListeners[ i ].tempFn === fn
					) {
						eventListeners.splice( i, 1 );
					}
				}
			}
		}
	}
}

function offkeyCombo( keys, fn ) {
	var comboId, combos, comboData, i, j, keyData;

	comboId = keys.join( "" );
	combos = m_onKeyCombos[ comboId ];

	// Loop through all the key combos
	for( i = combos.length - 1; i >= 0; i-- ) {
		comboData = combos[ i ];
		if( comboData.fn === fn ) {
			for( j = 0; j < comboData.keyData.length; j++ ) {

				keyData = comboData.keyData[ j ];

				// on key down
				offkey(
					[ keyData.key, "down", keyData.keyComboDown, false ]
				);

				// on key up
				offkey(
					[ keyData.key, "up", keyData.keyComboUp, false ]
				);

			}
			combos.splice( i, 1 );
		}
	}

}

// Disables the default behavior for a key
qbs._.addCommand( "setActionKey", setActionKey, false, false,
	[ "key", "isEnabled" ]
);
qbs._.addSetting( "actionKey", setActionKey, false, [ "key", "isEnabled" ] );
function setActionKey( args ) {
	var key, isEnabled;

	key = args[ 0 ];
	if( args[ 1 ] == null ) {
		isEnabled = true;
	} else {
		isEnabled = !!( args[ 1 ] );
	}

	if( ! ( typeof key === "string" || qbs.util.isInteger( key ) ) ) {
		m_qbData.log(
			"setActionKey: key must be a string or integer"
		);
		return;
	}

	if( isEnabled ) {
		m_preventKeys[ key ] = true;
	} else {
		delete m_preventKeys[ key ];
	}
}

// Shows the prompt for the input command
function showPrompt( screenData, hideCursor ) {
	var msg, pos, dt, posPx, width, height, input;

	// If we are collecting any inputs
	if( m_inputs.length > 0 && m_inputIndex < m_inputs.length ) {
		input = m_inputs[ m_inputIndex ];

		detectOnscreenKeyboard( input );

		// If only negative numbers
		if(
			input.val === "" && input.isNumber && input.isNegative &&
			! input.isPositive
		) {
			input.val = "-";
		}

		msg = input.prompt + input.val;

		// Blink cursor every half second
		dt = ( new Date() ).getTime() - m_t;
		if( dt > 500 ) {
			m_blink = ! m_blink;
			m_t = ( new Date() ).getTime();
		}

		if( m_blink && ! hideCursor ) {
			msg += screenData.printCursor.prompt;
		}

		// Check if need to scroll first
		pos = m_qbData.commands.getPos( input.screenData );
		if(pos.row >= m_qbData.commands.getRows( input.screenData ) ) {			
			m_qbData.commands.print( input.screenData, [ "", false ] );	
			m_qbData.commands.setPos( input.screenData, [ pos.col, pos.row - 1] );
			pos = m_qbData.commands.getPos( input.screenData );
		}
		
		// Get the background pixels
		posPx = m_qbData.commands.getPosPx( input.screenData );
		width = ( msg.length + 1 ) * screenData.printCursor.font.width;
		height = screenData.printCursor.font.height;

		// If there is no background
		if( ! m_promptBackground ) {
			m_promptBackground = m_qbData.commands.get( input.screenData,
				[ posPx.x, posPx.y, posPx.x + width, posPx.y + height ]
			);
		} else if( m_promptBackgroundWidth < width ) {
			// We have a background but we need a bigger background
			m_qbData.commands.put( input.screenData,
				[ m_promptBackground, posPx.x, posPx.y, true ]
			);
			m_promptBackground = m_qbData.commands.get( input.screenData,
				[ posPx.x, posPx.y, posPx.x + width, posPx.y + height ]
			);
		} else {
			// Else redraw the background
			m_qbData.commands.put( input.screenData,
				[ m_promptBackground, posPx.x, posPx.y, true ]
			);
		}

		// Store the background width for later use
		m_promptBackgroundWidth = width;

		// Print the prompt		
		m_qbData.commands.print( input.screenData, [ msg, true ] );		
		m_qbData.commands.setPos( input.screenData, [ pos.col, pos.row ] );
		m_qbData.commands.render( input.screenData );

		if( input.showKeyboard && input.keyboardHidden ) {
			showOnscreenKeyboard( screenData, input );
			input.keyboardHidden = false;
		}

	} else {

		// There are no inputs then stop the interval and clear prompt data
		clearInterval( m_promptInterval );
		m_promptBackground = null;
		m_promptBackgroundWidth = 0;

	}
}

function showOnscreenKeyboard( screenData, input ) {
	var pos, hitBoxes, i, keys, x, y, width, height, font;

	if( input.isNumber ) {
		m_keyboard.keyCase = "numbers";
		m_keyboard.format = m_keyboard.formats[ 1 ];
	} else if( m_keyboard.keyCase === "numbers" ) {
		m_keyboard.keyCase = "lowercase";
		m_keyboard.format = m_keyboard.formats[ 0 ];
	}

	keys = m_keyboard.keys[ m_keyboard.keyCase ];
	pos = m_qbData.commands.getPos( screenData );
	m_qbData.commands.setPos( screenData, [ 0, pos.row + 1 ] );
	font = screenData.printCursor.font;
	x = pos.col * font.width;
	y = ( pos.row + 1 ) * font.height;
	width = m_keyboard.format[ 0 ].length * font.width;
	height = ( m_keyboard.format.length ) * font.height;

	if( m_keyboard.background ) {
		m_qbData.commands.put(
			screenData, [
				m_keyboard.background, x, y, true
			]
		);
	} else {
		m_keyboard.background = m_qbData.commands.get(
			screenData, [ x, y, x + width, y + height ]
		);
	}

	// Print the keyboard
	hitBoxes = m_qbData.commands.printTable(
		screenData, [
			keys,
			m_keyboard.format
		]
	);
	m_qbData.commands.setPos( screenData, [ pos.col, pos.row ] );

	if( ! m_keyboard.eventsLoaded ) {

		if( m_qbData.isTouchScreen ) {
			input.keyboardDetected = false;
		}

		// Add OnPress Events
		for( i = 0; i < hitBoxes.length; i++ ) {
			m_qbData.commands.onpress( screenData, [
				"down",
				onscreenKeyboardOnPress,
				false,
				hitBoxes[ i ].pixels, {
					"index": i,
					"screenData": screenData,
					"pixels": hitBoxes[ i ].pixels,
					"input": input
				}
			] );
		}

		m_keyboard.eventsLoaded = true;
		m_keyboard.hitBoxes = hitBoxes;
	}
}

function clearOnscreenKeyboardEvents( screenData ) {
	var hitBoxes, i;

	hitBoxes = m_keyboard.hitBoxes;

	if( m_keyboard.eventsLoaded ) {

		// Add OnPress Events
		for( i = 0; i < hitBoxes.length; i++ ) {
			m_qbData.commands.offpress( screenData, [
				"down",
				onscreenKeyboardOnPress,
				false,
				hitBoxes[ i ].pixels
			] );
		}

	}

	m_keyboard.eventsLoaded = false;
}

function hideOnscreenKeyboard( screenData ) {
	var pos, font, x, y;

	pos = m_qbData.commands.getPos( screenData );
	font = screenData.printCursor.font;
	x = pos.col * font.width;
	y = ( pos.row + 1 ) * font.height;
	m_qbData.commands.put(
		screenData, [
			m_keyboard.background, x, y, true
		]
	);
}

function onscreenKeyboardOnPress( data, keyData ) {
	var key, keyCode, index;

	if( keyData.input.keyboardDetected ) {
		keyData.input.keyboardDetected = false;
		return;
	}

	index = keyData.index;
	key = m_keyboard.keys2[ index ][ m_keyboard.keyCase ];

	if( m_keyboard.lookup[ key ] ) {
		keyCode = m_keyboard.lookup[ key ].keyCode;
		key = m_keyboard.lookup[ key ].key;
	} else {
		keyCode = 0;
	}

	if( key === "+/-" ) {
		if(
			keyData.input.val.length === 0 ||
			keyData.input.val.charAt( 0 ) !== "-"
		) {
			key = "-";
		} else {
			key = "+";
		}
	}

	if( key === "SYMBOLS" ) {
		m_keyboard.keyCase = "symbol";
	} else if( key === "CapsLock" ) {
		if( m_keyboard.isLowerCase ) {
			m_keyboard.keyCase = "uppercase";
			m_keyboard.isLowerCase = false;
		} else {
			m_keyboard.isLowerCase = true;
			m_keyboard.keyCase = "lowercase";
		}
	} else {
		collectInput( { "key": key, "keyCode": keyCode } );
	}

	if( key === "Enter" ) {
		showPrompt( keyData.screenData, true );
	} else {
		showOnscreenKeyboard( keyData.screenData, keyData.input );
		m_qbData.commands.setColor( keyData.screenData, [ 15 ] );
		m_qbData.commands.rect( keyData.screenData, [
			keyData.pixels.x, keyData.pixels.y,
			keyData.pixels.width + 1, keyData.pixels.height + 1
		] );
		m_qbData.commands.setColor( keyData.screenData, [ 7 ] );
	}
}

// Prompts the user to enter input through the keyboard.
qbs._.addCommand( "input", input, false, true, [
	"prompt", "callback", "isNumber", "isInteger", "allowNegative", "onscreenKeyboard"
] );
function input( screenData, args ) {
	var prompt, callback, isNumber, isInteger, onscreenKeyboard, 
		readyList, inputData, onscreenKeyboardOptions, allowNegative,
		min, max, isNegative, isPositive, promise, promiseData;

	prompt = args[ 0 ];
	callback = args[ 1 ];
	isNumber = !!( args[ 2 ] );
	isInteger = !!( args[ 3 ] );
	allowNegative = args[ 4 ];
	onscreenKeyboard = args[ 5 ];
	promiseData = {};
	promise = new Promise( function( resolve, reject ) {
		promiseData.resolve = resolve;
		promiseData.reject = reject;
	} );

	// Validate prompt
	if( prompt == null ) {
		prompt = "";
	}

	if( typeof prompt !== "string" ) {
		m_qbData.log( "input: prompt must be a string." );
		return;
	}

	// Validate callback
	if( callback != null && ! qbs.util.isFunction( callback ) ) {
		m_qbData.log( "input: callback must be a function." );
		return;
	}

	// Validate allowNegative
	if( allowNegative == null ) {
		allowNegative = true;
	} else {
		allowNegative = !!( allowNegative );
	}

	// Validate onscreenKeyboard
	if( onscreenKeyboard == null ) {
		onscreenKeyboard = "none";
	}

	if( typeof onscreenKeyboard !== "string" ) {
		m_qbData.log( "input: onscreenKeyboard must be a string." );
		return;
	}

	onscreenKeyboardOptions = [ "auto", "always", "none" ];
	if( onscreenKeyboardOptions.indexOf( onscreenKeyboard ) === -1 ) {
		m_qbData.log(
			"input: onscreenKeyboard must be " + 
			onscreenKeyboardOptions.slice( 0, 2 ).join( ", " ) + 
			" or none."
		);
		return;
	}

	max = null;

	if( allowNegative ) {
		min = null;
	} else {
		min = 0;
	}

	// Integer is a number
	if( isInteger ) {
		isNumber = true;
	}

	// Check if negative numbers are allowed
	if( min === null || min < 0 ) {
		isNegative = true;
	} else {
		isNegative = false;
	}

	// Check if positive numbers are allowed
	isPositive = true;

	// Turn on touch to detect if we need to use onscreen keyboard
	if( onscreenKeyboard === "auto" ) {
		m_qbData.commands.startTouch( screenData );
	}

	// Activate key event listeners
	startKeyboard();

	// Create a list of functions to trigger
	readyList = [];

	if( qbs.util.isFunction( callback ) ) {
		readyList.push( callback );
	}

	inputData = {
		"prompt": prompt,
		"isNumber": isNumber,
		"isInteger": isInteger,
		"isPositive": isPositive,
		"isNegative": isNegative,
		"min": min,
		"max": max,
		"val": "",
		"readyList": readyList,
		"promiseData": promiseData,
		"screenData": screenData,
		"onscreenKeyboard": onscreenKeyboard,
		"keyboardHidden": true,
		"showKeyboard": false,
		"keyboardDetected": false
	};

	if( onscreenKeyboard === "always" ) {
		inputData.showKeyboard = true;
	} else {
		detectOnscreenKeyboard( inputData );
	}

	m_inputs.push( inputData );
	m_t = ( new Date() ).getTime();
	m_promptInterval = setInterval( function() {
		showPrompt( screenData, false );
	}, 100 );

	return promise;
}

function detectOnscreenKeyboard( input ) {
	if(
		m_qbData.isTouchScreen &&
		input.onscreenKeyboard === "auto" &&
		input.showKeyboard === false
	) {
		input.showKeyboard = true;
		input.keyboardDetected = true;
	}
}

qbs._.addCommand( "cancelInput", cancelInput, false, true, [] );
function cancelInput( screenData, args ) {
	var i;

	for( i = m_inputs.length - 1; i >= 0; i-- ) {
		m_inputs.splice( i, 1 );
	}
	clearInterval( m_promptInterval );
}

function collectInput( event ) {
	var input, removeLastChar;

	removeLastChar = false;
	input = m_inputs[ m_inputIndex ];
	if( event.keyCode === 13 ) {

		// The enter key was pressed
		showPrompt( input.screenData, true );
		if( input.showKeyboard ) {
			hideOnscreenKeyboard( input.screenData );
			clearOnscreenKeyboardEvents( input.screenData );
		}

		m_qbData.commands.print( input.screenData, [ "" ] );
		triggerReady( input );
		m_inputIndex += 1;
		if( m_inputIndex >= m_inputs.length ) {
			m_inputs = [];
			m_inputIndex = 0;
		}
	} else if( event.keyCode === 8 ) {

		// The backspace key was pressed
		if( input.val.length > 0 ) {
			removeLastChar = true;
		}

	} else if( event.key && event.key.length === 1 ) {

		// Handle +/-
		if( input.isNumber && input.isPositive && input.isNegative ) {

			if(
				event.key === "-" &&
				( input.val.length === 0 || input.val.charAt( 0 ) !== "-" )
			) {
				input.val = "-" + input.val;
				return;
			} else if(
				event.key === "+" &&
				input.val.length > 0 &&
				input.val.charAt( 0 ) === "-"
			) {
				input.val = input.val.substr( 1 );
				return;
			}

		}

		// A character key was pressed
		input.val += event.key;

		// Return if character is not a digit
		if( input.isNumber ) {
			if( isNaN( Number( input.val ) ) ) {
				removeLastChar = true;
			} else if( input.max !== null && Number( input.val ) > input.max ) {
				removeLastChar = true;
			} else if( input.min !== null && Number( input.val ) < input.min ) {
				removeLastChar = true;
			} else if( input.isInteger && event.key === "." ) {
				removeLastChar = true;
			}
		}
	}

	// Remove one character from the end of the string
	if( removeLastChar ) {
		input.val = input.val.substring( 0, input.val.length - 1 );
	}
}

// Triggers the ready functions once the enter key has been pressed in input
function triggerReady( input ) {
	var i, temp;
	processInput( input );
	temp = input.readyList.slice();
	for( i = 0; i < temp.length; i++ ) {
		temp[ i ]( input.val );
	}
	input.promiseData.resolve( input.val );
}

// Process the input for numbers and if a number makes sure it meets the
// requirements
function processInput( input ) {
	if( input.isNumber ) {
		if( input.val === "" ) {
			if( ! isNaN( input.min ) ) {
				input.val = input.min;
			} else {
				input.val = 0;
			}
		} else {
			input.val = Number( input.val );
		}
	}
}

// Set the charcode for the input prompt
qbs._.addCommand( "setInputCursor", setInputCursor, false, true,
	[ "cursor" ]
);
qbs._.addSetting( "inputCursor", setInputCursor, true, [ "cursor" ] );
function setInputCursor( screenData, args ) {
	var cursor, font, i, badChar;

	cursor = args[ 0 ];

	if( qbs.util.isInteger( cursor ) ) {
		cursor = String.fromCharCode( cursor );
	}

	if( typeof cursor !== "string" ) {
		m_qbData.log( "setInputCursor: cursor must be a string or integer." );
		return;
	}

	font = screenData.printCursor.font;

	if( font.mode === "pixel" ) {
		badChar = false;
		for( i = 0; i < font.chars.length; i++ ) {
			if( font.chars.indexOf( cursor.charCodeAt( i ) ) === -1 ) {
				badChar = true;
				break;
			}
		}
		if( badChar ) {
			m_qbData.log( 
				"setInputCursor: font does not contain the cursor character."
			);
			return;
		}
	}

	screenData.printCursor.prompt = cursor;
}

// End of File Encapsulation
} )();
/*
* File: qbs-gamepad.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_controllers, m_controllerArr, m_events, m_gamepadLoopId,
	m_Modes, m_isLooping, m_loopInterval, m_axesSensitivity;

m_qbData = qbs._.data;

// Object to track all controller data
m_controllers = {};

// An array to return to user of all the controllers
// This is used instead of the object because an array is easier to loop
m_controllerArr = [];

// The event listener object
m_events = {};
m_Modes = [
	"connect",
	"disconnect",
	"axis",
	"pressed",
	"touched",
	"pressReleased",
	"touchReleased"
];
m_isLooping = false;
m_loopInterval = 8;
m_axesSensitivity = 0.2;

window.addEventListener( "gamepadconnected", gamepadConnected );
window.addEventListener( "gamepaddisconnected", gamepadDisconnected );

function gamepadConnected( e ) {
	m_controllers[ e.gamepad.index ] = e.gamepad;
	e.gamepad.controllerIndex = m_controllerArr.length;
	m_controllerArr.push( e.gamepad );
	updateController( e.gamepad );
}

function gamepadDisconnected( e ) {
	m_controllerArr.splice(
		m_controllers[ e.gamepad.index ].controllerIndex, 1
	);
	delete m_controllers[ e.gamepad.index ];
}

// qbs._.addCommand( "stopGamepads", stopGamepads, false, false, [] );
// function stopGamepads() {
// 	m_events = {};
// 	m_controllers = {};
// 	m_controllerArr = [];
// 	cancelAnimationFrame( m_gamepadLoopId );
// }

qbs._.addCommand( "ingamepads", ingamepads, false, false, [] );
function ingamepads() {
	if( m_controllers ) {
		updateControllers();
	}
	return m_controllerArr;
}

qbs._.addCommand( "ongamepad", ongamepad, false, false,
	[ "gamepadIndex", "mode", "item", "fn", "once", "customData" ] );
function ongamepad( args ) {
	var mode, item, fn, once, gamepadIndex, extraData, customData;

	gamepadIndex = args[ 0 ];
	mode = args[ 1 ];
	item = args[ 2 ];
	fn = args[ 3 ];
	once = !!args[ 4 ];
	customData = args[ 5 ];

	extraData = getExtraData( "ongamepad", item, gamepadIndex, mode );
	if( ! extraData ) {
		return;
	}
	extraData.mode = mode;

	// Add the event listener
	m_qbData.commands.onevent( mode, fn, once, false, m_Modes, "ongamepad",
		m_events, extraData.extraId, extraData, customData );

	// Start the loop if it isn't already started
	if( ! m_isLooping ) {
		m_gamepadLoopId = requestAnimationFrame( gamepadLoop );
	}

}

qbs._.addCommand( "offgamepad", offgamepad, false, false,
	[ "gamepadIndex", "mode", "item", "fn" ] );
function offgamepad( args ) {
	var mode, item, gamepadIndex, fn, extraData;

	gamepadIndex = args[ 0 ];
	mode = args[ 1 ];
	item = args[ 2 ];
	fn = args[ 3 ];

	extraData = getExtraData( "offgamepad", item, gamepadIndex, mode );
	if( ! extraData ) {
		return;
	}

	// Remove the event listener
	m_qbData.commands.offevent( mode, fn, m_Modes, "offgamepad", m_events,
		extraData.extraId );
}

function getExtraData( name, items, gamepadIndex, mode ) {
	var extraId, i;

	// Validate gamepadIndex
	gamepadIndex = parseInt( gamepadIndex );
	if( isNaN( gamepadIndex ) || gamepadIndex < 0 ) {
		m_qbData.log( name + ": gamepadIndex is not a valid index number." );
		return;
	}

	// Validate buttons
	if( mode === "connect" || mode === "disconnect" ) {
		items = null;
	} else if ( mode === "axis" ) {
		if( ! qbs.util.isInteger( items ) || items < 0 ) {
			m_qbData.log( name + ": items is not a valid axis index." );
			return;
		}
		items = [ items ];
	} else {
		if( typeof items === "string" && items.toLowerCase() === "any" ) {
			items = [
				0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
			];
		} else if( ! isNaN( parseInt( items ) ) && items >= 0 ) {
			items = [ items ];
		}
		if( ! qbs.util.isArray( items ) ) {
			m_qbData.log( name + ": items is not a valid array." );
			return;
		}
		for( i = 0; i < items.length; i++ ) {
			items[ i ] = parseInt( items[ i ] );
			if( isNaN( items[ i ] ) || items[ i ] < 0 ) {
				m_qbData.log(
					name + ": items contains an invalid button index."
				);
				return;
			}
			items.sort( function ( a, b ) { return a - b; } );
		}
	}

	extraId = "_" + gamepadIndex + ":" + items.join( "_" );

	return {
		"items": items,
		"gamepadIndex": gamepadIndex,
		"extraId": extraId
	};
}

function gamepadLoop() {
	m_isLooping = true;

	if( ! m_controllers ) {
		return;
	}

	updateControllers();
	triggerEvents();

	m_gamepadLoopId = requestAnimationFrame( gamepadLoop );
}

function triggerEvents() {
	var eventName, temp, gamepadIndex, items, mode, event, i;

	// Loop through all the events
	for( eventName in m_events ) {
		temp = m_events[ eventName ].slice();
		for( i = 0; i < temp.length; i++ ) {

			event = temp[ i ];
			mode = event.extraData.mode;

			// These events will not get triggered here
			if( mode === "connect" || mode === "disconnect" ) {
				continue;
			}

			gamepadIndex = event.extraData.gamepadIndex;

			// Make sure gamepad exists
			if( gamepadIndex >= m_controllerArr.length ) {
				continue;
			}

			items = event.extraData.items;

			if( mode === "axis" ) {
				triggerAxes( gamepadIndex, items[ 0 ], eventName );
			} else {
				triggerButtons( gamepadIndex, items, mode, eventName );
			}

		} // end loop through event items
	} // end loop through events
}

function triggerAxes( gamepadIndex, axis, eventName ) {
	var axes;

	// Get reference to the axes in the gamepad
	axes = m_controllerArr[ gamepadIndex ].axes2;

	if( axes.length > axis ) {
		if(
			axes[ axis ] > m_axesSensitivity ||
			axes[ axis ] < -m_axesSensitivity
		) {
			m_qbData.commands.triggerEventListeners(
				eventName, axes[ axis ],
				m_events
			);
		}
	}

}

function triggerButtons( gamepadIndex, items, mode, eventName ) {
	var buttons, i, button;

	// Get reference to the buttons in the gamepad
	buttons = m_controllerArr[ gamepadIndex ].buttons;

	// Loop through all the mapped buttons
	for( i = 0; i < items.length; i++ ) {
		button = buttons[ items[ i ] ];

		// If any of the buttons are pressed then we trigger the event listeners
		// then break to the next event
		if( button ) {
			button.index = items[ i ];
			if( button.pressed && mode === "pressed" ) {
				m_qbData.commands.triggerEventListeners(
					eventName, button, m_events
				);
				break;
			} else if( button.touched && mode === "touched" ) {
				m_qbData.commands.triggerEventListeners(
					eventName, button, m_events
				);
				break;
			} else if( button.pressReleased && mode === "pressReleased" ) {
				m_qbData.commands.triggerEventListeners(
					eventName, button, m_events
				);
				break;
			} else if( button.touchReleased && mode === "touchReleased" ) {
				m_qbData.commands.triggerEventListeners(
					eventName, button, m_events
				);
				break;
			}
		}
	}
}

function updateControllers() {
	var i, gamepads;

	if( "getGamepads" in navigator ) {
		gamepads = navigator.getGamepads();
	} else if ( "webkitGetGamepads" in navigator ) {
		gamepads = navigator.webkitGetGamepads();
	} else {
		gamepads = [];
	}

	for( i = 0; i < gamepads.length; i++ ) {
		if( gamepads[ i ] && gamepads[ i ].index in m_controllers ) {
			updateController( gamepads[ i ] );
		}
	}
}

function updateController( gamepad ) {
	var i, controllerIndex, controller, buttons, button1, button2;

	controller = m_controllers[ gamepad.index ];

	// Get the index of the controller in the controller array
	controllerIndex = controller.controllerIndex;
	gamepad.controllerIndex = controllerIndex;

	// Update pressReleased and touchReleased for all buttons
	buttons = controller.buttons;
	for( i = 0; i < buttons.length; i++ ) {
		button1 = buttons[ i ];
		button2 = gamepad.buttons[ i ];
		if( button1.pressed && ! button2.pressed ) {
			button2.pressReleased = true;
		} else {
			button2.pressReleased = false;
		}
		if( button1.touched && ! button2.touched ) {
			button2.touchReleased = true;
		} else {
			button2.touchReleased = false;
		}
	}

	// Calibrate the axis sensitivity
	gamepad.axes2 = [];
	for( i = 0; i < gamepad.axes.length; i++ ) {
		gamepad.axes2.push( smoothAxis( gamepad.axes[ i ] ) );
	}

	// Update the controller object
	m_controllers[ gamepad.index ] = gamepad;

	// Update the controller array
	m_controllerArr[ controllerIndex ] = gamepad;
}

function smoothAxis( axis ) {
	if( Math.abs( axis ) < m_axesSensitivity ) {
		return 0;
	}
	axis = axis - Math.sign( axis ) * m_axesSensitivity;
	axis = axis / ( 1 - m_axesSensitivity );
	return axis;
}

// End of File Encapsulation
} )();
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
/*
* File: qbs-screen.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

// QBS Core API
// State Function
// Creates a new screen object
qbs._.addCommand( "screen", screen, false, false,
	[ "aspect", "container", "isOffscreen", "noStyles", "isMultiple",
	"resizeCallback" ]
);
function screen( args ) {

	var aspect, container, isOffscreen, noStyles, isMultiple, resizeCallback,
		aspectData, screenObj, screenData, i, commandData;

	// Input from args
	aspect = args[ 0 ];
	container = args[ 1 ];
	isOffscreen = args[ 2 ];
	noStyles = args[ 3 ];
	isMultiple = args[ 4 ];
	resizeCallback = args[ 5 ];

	if( resizeCallback != null && ! qbs.util.isFunction( resizeCallback ) ) {
		m_qbData.log(
			"screen: resizeCallback must be a function."
		);
		return;
	}

	if( typeof aspect === "string" && aspect !== "" ) {
		aspect = aspect.toLowerCase();
		aspectData = parseAspect( aspect );
		if( ! aspectData ) {
			m_qbData.log(
				"screen: invalid value for aspect."
			);
			return;
		}
		aspectData.isMultiple = !!( isMultiple );
	}

	if( isOffscreen ) {
		if( ! aspectData ) {
			m_qbData.log(
				"screen: You must supply an aspect ratio with exact dimensions for " +
				"offscreen screens."
			);
			return;
		}
		if( aspectData.splitter !== "x" ) {
			m_qbData.log(
				"screen: You must use aspect ratio with e(x)act pixel dimensions such" +
				" as 320x200 offscreen screens."
			);
			return;
		}
		screenData = createOffscreenScreen( aspectData );
	} else {
		if( typeof container === "string" ) {
			container = document.getElementById( container );
		}
		if( container && ! qbs.util.isDomElement( container ) ) {
			m_qbData.log( "screen: Invalid argument container. Container must be a" +
				" DOM element or a string id of a DOM element."
			);
			return;
		}
		if( noStyles ) {
			screenData = createNoStyleScreen( aspectData, container );
		} else {
			screenData = createScreen( aspectData, container, resizeCallback );
		}
	}

	screenData.cache = {
		"findColor": {}
	};

	// Setup commands
	screenObj = {};
	screenData.commands = {};

	// Loop through all the screen commands
	for( i in m_qbData.screenCommands ) {

		commandData = m_qbData.screenCommands[ i ];
		screenData.commands[ i ] = commandData.fn;

		// Setup the api
		setupApiCommand( screenObj, i, screenData, commandData );

	}

	// Assign a reference to the object
	screenData.screenObj = screenObj;

	// Assign the id of the screen
	screenObj.id = screenData.id;
	screenObj.screen = true;

	return screenObj;

};

function setupApiCommand( screenObj, name, screenData, cmd ) {
	screenObj[ name ] = function () {
		var args = m_qbData.commands.parseOptions( cmd, [].slice.call( arguments ) );
		return screenData.commands[ name ]( screenData, args );
	};
}

// Parses the aspect ratio string
function parseAspect( aspect ) {
	var width, height, parts, splitter;

	// 2 Types of ratio's pct or exact pixels
	if( aspect.indexOf( ":" ) > -1 ) {
		splitter = ":";
	} else if( aspect.indexOf( "x" ) > -1 ) {
		splitter = "x";
	} else if ( aspect.indexOf( "e" ) ) {
		splitter = "e";
	}

	parts = aspect.split( splitter );

	// Get the width and validate it
	width = Number( parts[ 0 ] );
	if( isNaN( width ) || width === 0 ) {
		return;
	}

	// Get the height and validate it
	height = Number( parts[ 1 ] );
	if( isNaN( height ) || height === 0 ) {
		return;
	}

	return {
		"width": width,
		"height": height,
		"splitter": splitter
	};
}

// Create's a new offscreen canvas
function createOffscreenScreen( aspectData ) {
	var canvas, bufferCanvas;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	canvas.width = aspectData.width;
	canvas.height = aspectData.height;
	bufferCanvas = document.createElement( "canvas" );
	bufferCanvas.width = aspectData.width;
	bufferCanvas.height = aspectData.height;

	return createScreenData( canvas, bufferCanvas, null, aspectData, true,
		false, null
	);
}

// Create a new canvas
function createScreen( aspectData, container, resizeCallback ) {
	var canvas, bufferCanvas, size, isContainer;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	bufferCanvas = document.createElement( "canvas" );

	// Style the canvas
	canvas.style.backgroundColor = "black";
	canvas.style.position = "absolute";
	canvas.style.imageRendering = "pixelated";
	canvas.style.imageRendering = "crisp-edges";

	// If no container applied then use document body.
	isContainer = true;
	if( ! qbs.util.isDomElement( container ) ) {
		isContainer = false;
		document.documentElement.style.height = "100%";
		document.documentElement.style.margin = "0";
		document.body.style.height = "100%";
		document.body.style.margin = "0";
		document.body.style.overflow = "hidden";
		canvas.style.left = "0";
		canvas.style.top = "0";
		container = document.body;
	}

	// Make sure the container is not blank
	if( container.offsetHeight === 0 ) {
		container.style.height = "200px";
	}

	// Append the canvas to the container
	container.appendChild( canvas );

	if( aspectData ) {

		// Calculate the size of the container
		size = getSize( container );

		// Set the canvas size
		setCanvasSize( aspectData, canvas, size.width, size.height );

		// Set the buffer size
		bufferCanvas.width = canvas.width;
		bufferCanvas.height = canvas.height;

	} else {

		// If canvas is inside an element then apply static position
		if( isContainer ) {
			canvas.style.position = "static";
		}

		// Set canvas to fullscreen
		canvas.style.width = "100%";
		canvas.style.height = "100%";
		size = getSize( canvas );
		canvas.width = size.width;
		canvas.height = size.height;
		bufferCanvas.width = size.width;
		bufferCanvas.height = size.height;
	}
	return createScreenData( canvas, bufferCanvas, container, aspectData, false,
		false, resizeCallback
	);
}

function createNoStyleScreen( aspectData, container ) {
	var canvas, bufferCanvas, size;

	// Create the canvas
	canvas = document.createElement( "canvas" );
	bufferCanvas = document.createElement( "canvas" );

	// If no container applied then use document body.
	if( ! qbs.util.isDomElement( container ) ) {
		container = document.body;
	}

	// Append the canvas to the container
	container.appendChild( canvas );

	if( aspectData && aspectData.splitter === "x" ) {

		// Set the buffer size
		canvas.width = aspectData.width;
		canvas.height = aspectData.height;
		bufferCanvas.width = canvas.width;
		bufferCanvas.height = canvas.height;

	} else {
		size = getSize( canvas );
		bufferCanvas.width = size.width;
		bufferCanvas.height = size.height;
	}
	return createScreenData( canvas, bufferCanvas, container, aspectData, false,
		true, null
	);
}

// Create the screen data
function createScreenData(
	canvas, bufferCanvas, container, aspectData, isOffscreen, isNoStyles,
	resizeCallback
) {
	var screenData = {};

	// Set the screen id
	screenData.id = m_qbData.nextScreenId;
	m_qbData.nextScreenId += 1;
	m_qbData.activeScreen = screenData;

	// Set the screenId on the canvas
	canvas.dataset.screenId = screenData.id;

	// Set the screen default data
	screenData.canvas = canvas;
	screenData.width = canvas.width;
	screenData.height = canvas.height;
	screenData.container = container;
	screenData.aspectData = aspectData;
	screenData.isOffscreen = isOffscreen;
	screenData.isNoStyles = isNoStyles;
	screenData.context = canvas.getContext( "2d" );
	screenData.bufferCanvas = bufferCanvas;
	screenData.bufferContext = screenData.bufferCanvas.getContext( "2d" );
	screenData.dirty = false;
	screenData.isAutoRender = true;
	screenData.autoRenderMicrotaskScheduled = false;
	screenData.x = 0;
	screenData.y = 0;
	screenData.angle = 0;
	screenData.pal = m_qbData.defaultPalette.slice();
	screenData.fColor = screenData.pal[ m_qbData.defaultColor ];
	screenData.colors = [ screenData.fColor ];
	screenData.context.fillStyle = screenData.fColor.s;
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.mouseStarted = false;
	screenData.touchStarted = false;
	screenData.printCursor = {
		"x": 0,
		"y": 0,
		"font": m_qbData.defaultFont,
		"rows": Math.floor( canvas.height / m_qbData.defaultFont.height ),
		"cols": Math.floor( canvas.width / m_qbData.defaultFont.width ),
		"prompt": m_qbData.defaultPrompt,
		"breakWord": true
	};
	screenData.clientRect = canvas.getBoundingClientRect();
	screenData.mouse = {
		"x": -1,
		"y": -1,
		"buttons": 0,
		"lastX": -1,
		"lastY": -1
	};
	screenData.touches = {};
	screenData.lastTouches = {};
	screenData.pixelMode = true;
	screenData.pen = {
		"draw": m_qbData.defaultPenDraw,
		"size": 1
	};
	screenData.blendPixelCmd = m_qbData.defaultBlendCmd;

	// Disable anti aliasing
	screenData.context.imageSmoothingEnabled = false;

	// Event listeners
	screenData.onMouseEventListeners = {};
	screenData.onTouchEventListeners = {};
	screenData.onPressEventListeners = {};
	screenData.onClickEventListeners = {};
	screenData.mouseEventListenersActive = 0;
	screenData.touchEventListenersActive = 0;
	screenData.pressEventListenersActive = 0;
	screenData.clickEventListenersActive = 0;
	screenData.lastEvent = null;

	// Right click is enabled
	screenData.isContextMenuEnabled = true;

	// Resize callback
	screenData.resizeCallback = resizeCallback;

	// Set this to the active screen
	m_qbData.screens[ screenData.id ] = screenData;

	return screenData;
}

// Sets the canvas size
function setCanvasSize( aspectData, canvas, maxWidth, maxHeight ) {
	var width, height, newWidth, newHeight, splitter, ratio1, ratio2, size,
		factor, factorX, factorY;

	width = aspectData.width;
	height = aspectData.height;
	splitter = aspectData.splitter;

	// If set size to exact multiple
	if( aspectData.isMultiple && splitter !== ":" ) {
		factorX = Math.floor( maxWidth / width );
		factorY = Math.floor( maxHeight / height );
		if( factorX > factorY ) {
			factor = factorY;
		} else {
			factor = factorX;
		}
		if( factor < 1 ) {
			factor = 1;
		}
		newWidth = width * factor;
		newHeight = height * factor;
	} else {

		// Calculate the screen ratios
		ratio1 = height / width;
		ratio2 = width / height;
		newWidth = maxHeight * ratio2;
		newHeight = maxWidth * ratio1;

		// Calculate the best fit
		if( newWidth > maxWidth ) {
			newWidth = maxWidth;
			newHeight = newWidth * ratio1;
		} else {
			newHeight = maxHeight;
		}
	}

	// Set the size
	canvas.style.width = Math.floor( newWidth ) + "px";
	canvas.style.height = Math.floor( newHeight ) + "px";

	// Set the margins
	canvas.style.marginLeft = Math.floor( ( maxWidth - newWidth ) / 2 ) + "px";
	canvas.style.marginTop = Math.floor( ( maxHeight - newHeight ) / 2 ) + "px";

	// Extending the canvas to match container size
	if( splitter === "e" ) {

		// Extend as many pixels that fit
		if( aspectData.isMultiple ) {

			width = Math.floor( maxWidth / factor );
			height = Math.floor( maxHeight / factor );
			newWidth = width * factor;
			newHeight = height * factor;
		} else {

			// Add the margin size to width and height
			width += Math.round( ( maxWidth - newWidth ) * ( width / newWidth ) );
			height += Math.round(
				( maxHeight - newHeight ) * ( height / newHeight )
			);
			newWidth = maxWidth;
			newHeight = maxHeight;

		}

		// Reset the margins after adjustments
		canvas.style.marginLeft = Math.floor( ( maxWidth - newWidth ) / 2 ) + "px";
		canvas.style.marginTop = Math.floor( ( maxHeight - newHeight ) / 2 ) + "px";

		// Reset the canvas size after adjustments
		canvas.style.width = newWidth + "px";
		canvas.style.height = newHeight + "px";
		canvas.width = width;
		canvas.height = height;

	} else if( splitter === "x" ) {

		// Set canvas size to be exact specified from the aspect ratio
		canvas.width = width;
		canvas.height = height;

	} else {

		// Set the canvas size to the compute canvas size
		size = getSize( canvas );
		canvas.width = size.width;
		canvas.height = size.height;

	}
}

// Resizes all screens
function resizeScreens() {
	var i, screenData, size, fromSize, toSize;

	for( i in m_qbData.screens ) {
		screenData = m_qbData.screens[ i ];

		// Skip if screen is not visible
		if(
			screenData.isOffscreen ||
			screenData.isNoStyles ||
			screenData.canvas.offsetParent === null
		) {
			continue;
		}

		// Store the previous size
		fromSize = {
			"width": screenData.canvas.offsetWidth,
			"height": screenData.canvas.offsetHeight
		};

		// Draw the canvas to the buffer
		screenData.bufferContext.clearRect( 0, 0, screenData.width,
			screenData.height
		);
		screenData.bufferContext.drawImage( screenData.canvas, 0, 0 );

		if( screenData.aspectData ) {

			// Update the canvas to the new size
			size = getSize( screenData.container );
			setCanvasSize(
				screenData.aspectData, screenData.canvas, size.width,
				size.height
			);

		} else {

			// Update canvas to fullscreen absolute pixels
			size = getSize( screenData.canvas );
			screenData.canvas.width = size.width;
			screenData.canvas.height = size.height;

		}

		// Resize the client rectangle
		screenData.clientRect = screenData.canvas.getBoundingClientRect();

		// Draw the buffer back onto the canvas
		screenData.context.drawImage( screenData.bufferCanvas, 0, 0,
			screenData.width, screenData.height
		);

		// Set the new buffer size
		screenData.bufferCanvas.width = screenData.canvas.width;
		screenData.bufferCanvas.height = screenData.canvas.height;

		// Set the new screen size
		screenData.width = screenData.canvas.width;
		screenData.height = screenData.canvas.height;

		// Send the resize data to the client
		if( screenData.resizeCallback ) {
			toSize = {
				"width": screenData.canvas.offsetWidth,
				"height": screenData.canvas.offsetHeight
			};
			if(
				fromSize.width !== toSize.width ||
				fromSize.height !== toSize.height
			) {
				screenData.resizeCallback( fromSize, toSize );
			}
		}
	}
}

function getSize( element ) {
	var computedStyle, paddingX, paddingY, borderX, borderY, elementWidth,
		elementHeight;

	computedStyle = getComputedStyle( element );

	// Compute the padding
	paddingX = parseFloat( computedStyle.paddingLeft ) +
		parseFloat( computedStyle.paddingRight );
	paddingY = parseFloat( computedStyle.paddingTop ) +
		parseFloat( computedStyle.paddingBottom );

	// Compute the borders
	borderX = parseFloat( computedStyle.borderLeftWidth ) +
		parseFloat( computedStyle.borderRightWidth );
	borderY = parseFloat( computedStyle.borderTopWidth ) +
		parseFloat( computedStyle.borderBottomWidth );

	// Compute the dimensions
	elementWidth = element.offsetWidth - paddingX - borderX;
	elementHeight = element.offsetHeight - paddingY - borderY;

	return {
		"width": elementWidth,
		"height": elementHeight
	};
}

// Any time the screen resizes need to resize canvas too
window.addEventListener( "resize", resizeScreens );

// End of File Encapsulation
} )();
/*
* File: qbs-screen-mouse.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

qbs._.addCommand( "startMouse", startMouse, false, true, [] );
function startMouse( screenData ) {
	if( ! screenData.mouseStarted ) {
		screenData.canvas.addEventListener( "mousemove", mouseMove );
		screenData.canvas.addEventListener( "mousedown", mouseDown );
		screenData.canvas.addEventListener( "mouseup", mouseUp );
		screenData.canvas.addEventListener( "contextmenu", onContextMenu );
		screenData.mouseStarted = true;
	}
}

qbs._.addCommand( "stopMouse", stopMouse, false, true, [] );
function stopMouse( screenData ) {
	if( screenData.mouseStarted ) {
		screenData.canvas.removeEventListener( "mousemove", mouseMove );
		screenData.canvas.removeEventListener( "mousedown", mouseDown );
		screenData.canvas.removeEventListener( "mouseup", mouseUp );
		screenData.canvas.removeEventListener( "contextmenu", onContextMenu );
		screenData.mouseStarted = false;
	}
}

function mouseMove( e ) {
	var screenData;

	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "move" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "move", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "move", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}
}

function mouseDown( e ) {
	var screenData;

	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "down" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "down", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "down", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "click", getMouse( screenData ),
			screenData.onClickEventListeners, "down"
		);
	}
}

function mouseUp( e ) {
	var screenData;

	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "up" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "up", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "up", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "click", getMouse( screenData ),
			screenData.onClickEventListeners, "up"
		);
	}
}

function onContextMenu( e ) {
	var screenData;

	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	if( ! screenData.isContextMenuEnabled ) {
		e.preventDefault();
		return false;
	}
}

function updateMouse( screenData, e, action ) {
	var rect, x, y, lastX, lastY;

	rect = screenData.clientRect;
	x = Math.floor(
		( e.clientX - rect.left ) / rect.width * screenData.width
	);
	y = Math.floor(
		( e.clientY - rect.top ) / rect.height * screenData.height
	);

	if( screenData.mouse ) {
		if( screenData.mouse.x ) {
			lastX = screenData.mouse.x;
		} else {
			lastX = x;
		}
		if( screenData.mouse.y ) {
			lastY = screenData.mouse.y;
		} else {
			lastY = y;
		}
	}

	screenData.mouse = {
		"x": x,
		"y": y,
		"lastX": lastX,
		"lastY": lastY,
		"buttons": e.buttons,
		"action": action
	};
	screenData.lastEvent = "mouse";
}

qbs._.addCommand( "getMouse", getMouse, true, true, [] );
function getMouse( screenData ) {
	var mouse;

	mouse = {};
	mouse.x = screenData.mouse.x;
	mouse.y = screenData.mouse.y;
	mouse.lastX = screenData.mouse.lastX;
	mouse.lastY = screenData.mouse.lastY;
	mouse.buttons = screenData.mouse.buttons;
	mouse.action = screenData.mouse.action;
	mouse.type = "mouse";

	return mouse;
}

qbs._.addCommand( "inmouse", inmouse, false, true, [] );
function inmouse( screenData ) {
	
	// Activate the mouse event listeners
	startMouse( screenData );

	return getMouse( screenData );
}

// Adds an event trigger for a mouse event
qbs._.addCommand( "onmouse", onmouse, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function onmouse( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_qbData.commands.onevent(
		mode, fn, once, hitBox, [ "down", "up", "move" ], "onmouse",
		screenData.onMouseEventListeners, null, null, customData
	);

	// Activate the mouse event listeners
	if( isValid ) {
		startMouse( screenData );
		screenData.mouseEventListenersActive += 1;
	}
}

// Removes an event trigger for a mouse event
qbs._.addCommand( "offmouse", offmouse, false, true, [ "mode", "fn" ] );
function offmouse( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];

	isValid = m_qbData.commands.offevent(
		mode, fn, [ "down", "up", "move" ], "offmouse",
		screenData.onMouseEventListeners
	);

	if( isValid ) {
		if( fn == null ) {
			screenData.mouseEventListenersActive = 0;
		} else {
			screenData.mouseEventListenersActive -= 1;
			if( screenData.mouseEventListenersActive < 0 ) {
				screenData.mouseEventListenersActive = 0;
			}
		}
	}
}

qbs._.addCommand( "setEnableContextMenu", setEnableContextMenu, false, true,
	[ "isEnabled" ]
);
qbs._.addSetting( "enableContextMenu", setEnableContextMenu, true,
	[ "isEnabled" ]
);
function setEnableContextMenu( screenData, args ) {
	screenData.isContextMenuEnabled = !!( args[ 0 ] );

	// Activate the mouse event listeners
	startMouse( screenData );
}

qbs._.addCommand( "onpress", onpress, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function onpress( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_qbData.commands.onevent(
		mode, fn, once, hitBox, [ "down", "up", "move" ], "onpress",
		screenData.onPressEventListeners, null, null, customData
	);

	// Activate the mouse event listeners
	if( isValid ) {
		m_qbData.commands.startMouse( screenData );
		m_qbData.commands.startTouch( screenData );
		screenData.pressEventListenersActive += 1;
	}
}

qbs._.addCommand( "offpress", offpress, false, true,
	[ "mode", "fn" ]
);
function offpress( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];

	isValid = m_qbData.commands.offevent(
		mode, fn, [ "down", "up", "move" ], "offpress",
		screenData.onPressEventListeners
	);

	if( isValid ) {
		if( fn == null ) {
			screenData.pressEventListenersActive = 0;
		} else {
			screenData.pressEventListenersActive -= 1;
			if( screenData.pressEventListenersActive < 0 ) {
				screenData.pressEventListenersActive = 0;
			}
		}
	}
}

qbs._.addCommand( "inpress", inpress, false, true, [] );
function inpress( screenData ) {
	
	// Activate the mouse event listeners
	m_qbData.commands.startMouse( screenData );
	m_qbData.commands.startTouch( screenData );

	if( screenData.lastEvent === "touch" ) {
		return m_qbData.commands.getTouchPress( screenData );
	} else {
		return m_qbData.commands.getMouse( screenData );
	}
}

qbs._.addCommand( "onclick", onclick, false, true,
	[ "fn", "once", "hitBox", "customData" ]
);
function onclick( screenData, args ) {
	var fn, once, hitBox, isValid, customData;

	fn = args[ 0 ];
	once = args[ 1 ];
	hitBox = args[ 2 ];
	customData = args[ 3 ];

	if( hitBox == null ) {
		hitBox = {
			x: 0,
			y: 0,
			width: m_qbData.commands.width( screenData ),
			height: m_qbData.commands.height( screenData )
		};
		// m_qbData.log(
		// 	"onclick: hitBox is required and must contain x, y," +
		// 	" width, and height."
		// );
		// return;
	}
	
	isValid = m_qbData.commands.onevent(
		"click", fn, once, hitBox, [ "click" ], "onclick",
		screenData.onClickEventListeners, null, null, customData
	);

	// Activate the mouse event listeners
	if( isValid ) {
		m_qbData.commands.startMouse( screenData );
		m_qbData.commands.startTouch( screenData );
		screenData.clickEventListenersActive += 1;
	}
}

qbs._.addCommand( "offclick", offclick, false, true,
	[ "fn" ]
);
function offclick( screenData, args ) {
	var fn, isValid;

	fn = args[ 0 ];

	isValid = m_qbData.commands.offevent(
		"click", fn, [ "click" ], "offclick",
		screenData.onClickEventListeners
	);

	if( isValid ) {
		if( fn == null ) {
			screenData.clickEventListenersActive = 0;
		} else {
			screenData.clickEventListenersActive -= 1;
			if( screenData.clickEventListenersActive < 0 ) {
				screenData.clickEventListenersActive = 0;
			}
		}
	}
}

// End of File Encapsulation
} )();
/*
* File: qbs-screen-touch.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

qbs._.addCommand( "startTouch", startTouch, false, true, [] );
function startTouch( screenData ) {
	if( ! screenData.touchStarted ) {
		screenData.canvas.addEventListener( "touchstart", touchStart );
		screenData.canvas.addEventListener( "touchmove", touchMove );
		screenData.canvas.addEventListener( "touchend", touchEnd );
		screenData.canvas.addEventListener( "touchcancel", touchEnd );
		screenData.touchStarted = true;
	}
}

qbs._.addCommand( "stopTouch", stopTouch, false, true, [] );
function stopTouch( screenData ) {
	if( screenData.touchStarted ) {
		screenData.canvas.removeEventListener( "touchstart", touchStart );
		screenData.canvas.removeEventListener( "touchmove", touchMove );
		screenData.canvas.removeEventListener( "touchend", touchEnd );
		screenData.canvas.removeEventListener( "touchcancel", touchEnd );
		screenData.touchStarted = false;
	}
}

function touchStart( e ) {
	var screenData;

	m_qbData.isTouchScreen = true;

	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "start" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "start",
			getTouch( screenData ), screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "down",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);

		// This will prevent mouse down event start event from firing
		e.preventDefault();
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "click",
			getTouchPress( screenData ),
			screenData.onClickEventListeners, "down"
		);
	}
}

function touchMove( e ) {
	var screenData;
	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "move" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "move",
			getTouch( screenData ), screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "move",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);
	}
}

function touchEnd( e ) {
	var screenData;
	screenData = m_qbData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "end" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "end", getTouch( screenData ),
			screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "up",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_qbData.commands.triggerEventListeners( "click",
			getTouchPress( screenData ),
			screenData.onClickEventListeners, "up"
		);
	}
}

function updateTouch( screenData, e, action ) {
	var rect, j, touch, touchData, newTouches;

	if( screenData.clientRect ) {
		newTouches = {};
		rect = screenData.clientRect;
		for( j = 0; j < e.touches.length; j++ ) {
			touch = e.touches[ j ];
			touchData = {};
			touchData.x = Math.floor(
				( touch.clientX - rect.left ) / rect.width * screenData.width
			);
			touchData.y = Math.floor(
				( touch.clientY - rect.top ) / rect.height * screenData.height
			);
			touchData.id = touch.identifier;
			if( screenData.touches[ touchData.id ] ) {
				touchData.lastX = screenData.touches[ touchData.id ].x;
				touchData.lastY = screenData.touches[ touchData.id ].y;
			} else {
				touchData.lastX = null;
				touchData.lastY = null;
			}
			touchData.action = action;
			newTouches[ touchData.id ] = touchData;
		}
		screenData.lastTouches = screenData.touches;
		screenData.touches = newTouches;
		screenData.lastEvent = "touch";
	}
}

function getTouch( screenData ) {
	var touchArr, i, touch, touchData;

	touchArr = [];

	// Make a local copy of touch Object
	for( i in screenData.touches ) {
		touch = screenData.touches[ i ];
		touchData = {
			"x": touch.x,
			"y": touch.y,
			"id": touch.id,
			"lastX": touch.lastX,
			"lastY": touch.lastY,
			"action": touch.action,
			"type": "touch"
		};
		touchArr.push( touchData );
	}

	return touchArr;
}

qbs._.addCommand( "getTouchPress", getTouchPress, true, true, [] );
function getTouchPress( screenData ) {

	function copyTouches( touches, touchArr, action ) {
		for( i in touches ) {
			touch = touches[ i ];
			touchData = {
				"x": touch.x,
				"y": touch.y,
				"id": touch.id,
				"lastX": touch.lastX,
				"lastY": touch.lastY,
				"action": touch.action,
				"type": "touch"
			};
			if( action !== undefined ) {
				touch.action = action;
			}
			touchArr.push( touchData );
		}
	}

	var touchArr, i, touch, touchData;

	touchArr = [];

	copyTouches( screenData.touches, touchArr );

	if( touchArr.length === 0 ) {
		copyTouches( screenData.lastTouches, touchArr, "up" );
	}

	if( touchArr.length > 0 ) {
		touchData = touchArr[ 0 ];
		if( touchData.action === "up" ) {
			touchData.buttons = 0;
		} else {
			touchData.buttons = 1;
		}
		touchData.touches = touchArr;

		return touchData;
	} else {
		return {
			"x": -1,
			"y": -1,
			"id": -1,
			"lastX": -1,
			"lastY": -1,
			"action": "none",
			"buttons": 0,
			"type": "touch"
		};
	}
}

qbs._.addCommand( "intouch", intouch, false, true, [] );
function intouch( screenData ) {

	startTouch( screenData );

	return getTouch( screenData );
}

// Adds an event trigger for a mouse event
qbs._.addCommand( "ontouch", ontouch, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function ontouch( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_qbData.commands.onevent(
		mode, fn, once, hitBox, [ "start", "end", "move" ],
		"ontouch", screenData.onTouchEventListeners, null, null,
		customData
	);

	if( isValid ) {
		startTouch( screenData );
		screenData.touchEventListenersActive += 1;
	}
}

// Removes an event trigger for a touch event
qbs._.addCommand( "offtouch", offtouch, false, true, [ "mode", "fn" ] );
function offtouch( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];


	isValid = m_qbData.commands.offevent( mode, fn, [ "start", "end", "move" ],
		"offtouch", screenData.onTouchEventListeners
	);

	if( isValid ) {
		if( fn == null ) {
			screenData.touchEventListenersActive = 0;
		} else {
			screenData.touchEventListenersActive -= 1;
			if( screenData.touchEventListenersActive < 0 ) {
				screenData.touchEventListenersActive = 0;
			}
		}
	}
}

qbs._.addCommand( "setPinchZoom", setPinchZoom, false, false,
	[ "isEnabled" ]
);
qbs._.addSetting( "pinchZoom", setPinchZoom, false, [ "isEnabled" ] );
function setPinchZoom( args ) {
	var isEnabled;

	isEnabled = !!( args[ 0 ] );

	if( isEnabled ) {
		document.body.style.touchAction = "";
	} else {
		document.body.style.touchAction = "none";
	}
}

// End of File Encapsulation
} )();
/*
* File: qbs-screenCommands.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_maxDifference;

m_qbData = qbs._.data;
m_maxDifference = ( 255 * 255 ) * 3.25;

// Remove the screen from the page and memory
qbs._.addCommand( "removeScreen", removeScreen, false, true, [] );
function removeScreen( screenData ) {
	var i, screenId;

	screenId = screenData.id;

	if( screenData === m_qbData.activeScreen ) {
		for( i in m_qbData.screens ) {
			if( m_qbData.screens[ i ] !== screenData ) {
				m_qbData.activeScreen = m_qbData.screens[ i ];
			}
		}
	}

	screenData.screenObj.cancelInput();

	// Remove all commands from screen object
	for( i in screenData.screenObj ) {
		delete screenData.screenObj[ i ];
	}

	// Remove the canvas from the page
	if( screenData.canvas.parentElement ) {
		screenData.canvas.parentElement.removeChild( screenData.canvas );
	}

	// Set the values to null
	screenData.canvas = null;
	screenData.bufferCanvas = null;
	screenData.pal = null;
	screenData.commands = null;
	screenData.context = null;
	screenData.imageData = null;
	screenData.screenObj = null;

	// Delete the screen from the screens container
	delete m_qbData.screens[ screenId ];

}

// Set the background color of the canvas
qbs._.addCommand( "setBgColor", setBgColor, false, true, [ "color" ] );
qbs._.addSetting( "bgColor", setBgColor, true, [ "color" ] );
function setBgColor( screenData, args ) {
	var color, bc;

	color = args[ 0 ];

	if( qbs.util.isInteger( color ) ) {
		bc = screenData.pal[ color ];
	} else {
		bc = qbs.util.convertToColor( color );
	}
	if( bc && typeof bc.s === "string" ) {
		screenData.canvas.style.backgroundColor = bc.s;
	} else {
		m_qbData.log( "bgColor: invalid color value for parameter c." );
		return;
	}
}

// Set the background color of the container
qbs._.addCommand( "setContainerBgColor", setContainerBgColor, false, true,
	[ "color" ]
);
qbs._.addSetting( "containerBgColor", setContainerBgColor, true,
	[ "color" ]
);
function setContainerBgColor( screenData, args ) {
	var color, bc;

	color = args[ 0 ];

	if( screenData.container ) {
		if( qbs.util.isInteger( color ) ) {
			bc = screenData.pal[ color ];
		} else {
			bc = qbs.util.convertToColor( color );
		}
		if( bc && typeof bc.s === "string" ) {
			screenData.container.style.backgroundColor = bc.s;
			return;
		} else {
			m_qbData.log( "containerBgColor: invalid color value for parameter c." );
			return;
		}
	}
}

qbs._.addCommand( "width", width, false, true, [] );
function width( screenData ) {
	return screenData.width;
}

qbs._.addCommand( "height", height, false, true, [] );
function height( screenData ) {
	return screenData.height;
}

qbs._.addCommand( "canvas", canvas, false, true, [] );
function canvas( screenData ) {
	return screenData.canvas;
}

// Finds a color from the palette and returns it's index.
qbs._.addCommand( "findColor", findColor, false, true,
	[ "color", "tolerance", "isAddToPalette" ] );
function findColor( screenData, args ) {
	var color, tolerance, isAddToPalette, i, pal, dr, dg, db, da, difference, simularity;

	color = args[ 0 ];
	tolerance = args[ 1 ];
	isAddToPalette = !!( args[ 2 ] );

	if(tolerance === undefined) {
		tolerance = 1;
	}

	tolerance = tolerance * ( 2 - tolerance ) * m_maxDifference;
	pal = screenData.pal;

	if( screenData.cache[ "findColor" ][ color.s ] ) {
		return screenData.cache[ "findColor" ][ color.s ];
	}

	color = m_qbData.commands.findColorValue(
		screenData, color, "color"
	);

	for( i = 0; i < pal.length; i++ ) {
		if( pal[ i ].s === color.s ) {
			screenData.cache[ "findColor" ][ color.s ] = i;
			return i;
		} else {
			dr = pal[ i ].r - color.r;
			dg = pal[ i ].g - color.g;
			db = pal[ i ].b - color.b;
			da = pal[ i ].a - color.a;

			difference = ( dr * dr + dg * dg + db * db + da * da * 0.25 );
			simularity = m_maxDifference - difference;

			if( simularity >= tolerance ) {
				screenData.cache[ "findColor" ][ color.s ] = i;
				return i;
			}
		}
	}
	if( isAddToPalette ) {
		pal.push( color );
		screenData.cache[ "findColor" ][ color.s ] = pal.length - 1;
		return pal.length - 1;
	}
	return 0;
}

qbs._.addCommand( "setPixelMode", setPixelMode, false, true, [ "isEnabled" ] );
qbs._.addSetting( "pixelMode", setPixelMode, true, [ "isEnabled" ] );
function setPixelMode( screenData, args ) {
	var isEnabled;

	isEnabled = args[ 0 ];

	if( isEnabled ) {
		screenData.context.imageSmoothingEnabled = false;
		screenData.pixelMode = true;
	} else {
		screenData.context.imageSmoothingEnabled = true;
		screenData.pixelMode = false;
	}
}

// Set pen command
qbs._.addCommand( "setPen", setPen, false, true, [ "pen", "size", "noise" ] );
qbs._.addSetting( "pen", setPen, true, [ "pen", "size", "noise" ] );
function setPen( screenData, args ) {
	var pen, size, noise, i;

	pen = args[ 0 ];
	size = args[ 1 ];
	noise = args[ 2 ];

	if( ! m_qbData.pens[ pen ] ) {
		m_qbData.log(
			"setPen: Argument pen is not a valid pen. Valid pens: " +
			m_qbData.penList.join(", " )
		);
		return;
	}
	if( ! qbs.util.isInteger( size ) ) {
		m_qbData.log( "setPen: Argument size is not a valid number." );
		return;
	}
	if( noise && ( ! qbs.util.isArray( noise ) && Number.isNaN( noise ) ) ) {
		m_qbData.log( "setPen: Argument noise is not an array or number." );
		return;
	}
	if( qbs.util.isArray( noise ) ) {
		noise = noise.slice();
		for( i = 0; i < noise.length; i++ ) {
			if( Number.isNaN( noise[ i ] ) ) {
				m_qbData.log(
					"setPen: Argument noise array contains an invalid value."
				);
				return;
			}
		}
		// Make sure that noise array contains at least 4 values
//		for(; i < 4; i++ ) {
//			noise.push( 0 );
//		}
	}

	if( pen === "pixel" ) {
		size = 1;
	}

	// Set the minimum pen size to 1;
	if( size < 1 ) {
		size = 1;
	}

	// Handle special case of size of one
	if( size === 1 ) {

		// Size is one so only draw one pixel
		screenData.pen.draw = m_qbData.pens.pixel.cmd;

		// Set the line width for context draw
		screenData.context.lineWidth = 1;
	} else {

		// Set the draw mode for pixel draw
		screenData.pen.draw = m_qbData.pens[ pen ].cmd;

		// Set the line width for context draw
		screenData.context.lineWidth = size * 2 - 1;
	}

	screenData.pen.noise = noise;
	screenData.pen.size = size;
	screenData.context.lineCap = m_qbData.pens[ pen ].cap;
}

qbs._.addCommand( "setBlendMode", setBlendMode, false, true, [ "mode" ] );
qbs._.addSetting( "blendMode", setBlendMode, true, [ "mode" ] );
function setBlendMode( screenData, args ) {
	var mode;

	mode = args[ 0 ];
	if( ! m_qbData.blendCommands[ mode ] ) {
		m_qbData.log(
			"setBlendMode: Argument blend is not a valid blend mode. Valid modes: " +
			m_qbData.blendCommandsList.join(", " )
		);
		return;
	}

	screenData.blendPixelCmd = m_qbData.blendCommands[ mode ];
}

qbs._.addCommand( "triggerEventListeners", triggerEventListeners, true, true,
	[] );
function triggerEventListeners( mode, data, listenerArr, clickStatus ) {
	var temp, i, j, pos, newData, isHit;

	if( listenerArr[ mode ] ) {

		// Make a temp copy so we don't get infinite loop if new event listener
		// added here
		temp = listenerArr[ mode ].slice();

		// Loop through all the event listeners
		for( i = 0; i < temp.length; i++ ) {

			// If click up but no click down then skip this
			if( clickStatus === "up" ) {
				if( ! temp[ i ].clickDown ) {
					continue;
				}
			}

			// If there is a hitbox then need to check if we are in range
			if( temp[ i ].hitBox ) {

				isHit = false;

				// If it's an array loop - touches
				if( qbs.util.isArray ( data ) ) {
					newData = [];
					for( j = 0; j < data.length; j++ ) {
						pos = data[ j ];
						if( qbs.util.inRange( pos, temp[ i ].hitBox ) ) {
							newData.push( pos );
						}
					}
					if( newData.length > 0 ) {
						isHit = true;
					}
				} else {
					newData = data;

					// If it's not an array
					if( qbs.util.inRange( data, temp[ i ].hitBox ) ) {
						isHit = true;
					}
				}

				if( isHit ) {

					// If click don't trigger event listener on down
					if( clickStatus === "down" ) {
						temp[ i ].clickDown = true;
					} else {
						temp[ i ].clickDown = false;
						temp[ i ].fn( newData, temp[ i ].customData );
					}
				}

			} else {

				// if no hit box then just trigger the event
				temp[ i ].fn( data, temp[ i ].customData );

			}
		}
	}
}

qbs._.addCommand( "onevent", onevent, true, true, [] );
function onevent( mode, fn, once, hitBox, modes, name, listenerArr, extraId,
	extraData, customData
) {

	var i, modeFound;

	// Make sure mode is valid
	modeFound = false;

	for( i = 0; i < modes.length; i++ ) {
		if( mode === modes[ i ] ) {
			modeFound = true;
			break;
		}
	}
	if( ! modeFound ) {
		m_qbData.log(
			name + ": mode needs to be on of the following " +
			modes.join( ", " ) + "."
		);
		return false;
	}

	// Make sure once is a boolean
	once = !!( once );

	// Make sure function is valid
	if( ! qbs.util.isFunction( fn ) ) {
		m_qbData.log( name + ": fn is not a valid function." );
		return false;
	}

	// Validate hitbox
	if( hitBox ) {
		if(
			! qbs.util.isInteger( hitBox.x ) ||
			! qbs.util.isInteger( hitBox.y ) ||
			! qbs.util.isInteger( hitBox.width ) ||
			! qbs.util.isInteger( hitBox.height )
		) {
			m_qbData.log(
				name + ": hitbox must have properties x, y, width, and " +
				"height whose values are integers."
			);
			return false;
		}
	}

	// Prevent event from being triggered in case event is called in an event
	setTimeout( function () {
		var originalFn, newMode;

		// Add extraId to mode
		if( typeof extraId === "string" ) {
			newMode = mode + extraId;
		} else {
			newMode = mode;
		}

		originalFn = fn;

		// If it's a one time function
		if( once ) {
			fn = function ( data, customData ) {
				offevent( mode, originalFn, modes, name, listenerArr, extraId );
				originalFn( data, customData );
			};
		}

		if( ! listenerArr[ newMode ] ) {
			listenerArr[ newMode ] = [];
		}
		listenerArr[ newMode ].push( {
			"fn": fn,
			"hitBox": hitBox,
			"extraData": extraData,
			"clickDown": false,
			"originalFn": originalFn,
			"customData": customData
		} );

	}, 1 );

	return true;
}

qbs._.addCommand( "offevent", offevent, true, true, [] );
function offevent( mode, fn, modes, name, listenerArr, extraId ) {

	var isClear, i, modeFound;

	// Make sure mode is valid
	modeFound = false;
	for( i = 0; i < modes.length; i++ ) {
		if( mode === modes[ i ] ) {
			modeFound = true;
			break;
		}
	}
	if( ! modeFound ) {
		m_qbData.log( name + ": mode needs to be one of the following " +
			modes.join( ", " ) + ".");
		return false;
	}

	// Add extraId to mode
	if( typeof extraId === "string" ) {
		mode += extraId;
	}

	// Validate fn
	if( fn == null ) {
		isClear = true;
	} else {
		isClear = false;
		if( ! qbs.util.isFunction( fn ) ) {
			m_qbData.log( name + ": fn is not a valid function." );
			return false;
		}
	}

	if( listenerArr[ mode ] ) {
		if( isClear ) {
			delete listenerArr[ mode ];
		} else {
			for( i = listenerArr[ mode ].length - 1; i >= 0; i-- ) {
				if( listenerArr[ mode ][ i ].originalFn === fn ) {
					listenerArr[ mode ].splice( i, 1 );
				}
				if( listenerArr[ mode ].length === 0 ) {
					delete listenerArr[ mode ];
				}
			}
		}
		return true;
	}
}

// Remove the screen from the page and memory
qbs._.addCommand( "clearEvents", clearEvents, false, true, [] );
function clearEvents( screenData ) {
	// Reset all event listeners
	screenData.onMouseEventListeners = {};
	screenData.onTouchEventListeners = {};
	screenData.onPressEventListeners = {};
	screenData.onClickEventListeners = {};
	screenData.mouseEventListenersActive = 0;
	screenData.touchEventListenersActive = 0;
	screenData.pressEventListenersActive = 0;
	screenData.clickEventListenersActive = 0;
	screenData.lastEvent = null;	
}

qbs._.addCommand( "setAutoRender", setAutoRender, false, true,
	[ "isAutoRender" ] );
function setAutoRender( screenData, args ) {
	var isAutoRender;

	isAutoRender = args[ 0 ];
	screenData.isAutoRender = !!( isAutoRender );

	if( screenData.isAutoRender ) {
		screenData.screenObj.render();
	}
}

// End of File Encapsulation
} )();
/*
* File: qbs-screen-helper.js
*/

// Start of File Encapsulation
( function () {
"use strict";

var m_qbData;

m_qbData = qbs._.data;

qbs._.addBlendCommand( "normal", normalBlend );
function normalBlend( screenData, x, y, c ) {
	var data, i;

	// Get the image data
	data = screenData.imageData.data

	// Calculate the index
	i = ( ( screenData.width * y ) + x ) * 4;

	data[ i ] = c.r;
	data[ i + 1 ] = c.g;
	data[ i + 2 ] = c.b;
	data[ i + 3 ] = c.a;
}

qbs._.addBlendCommand( "blended", blendPixel );
function blendPixel( screenData, x, y, c ) {
	var data, i, pct, pct2;

	// Get the image data
	data = screenData.imageData.data

	// Calculate the index
	i = ( ( screenData.width * y ) + x ) * 4;

	// displayColor = sourceColor × alpha / 255 + backgroundColor × (255 – alpha) / 255
	// blend = ( source * source_alpha) + desitination * ( 1 - source_alpha)
	pct = c.a / 255;
	pct2 = ( 255 - c.a ) / 255;
	data[ i ] = ( c.r * pct ) + data[ i ] * pct2
	data[ i + 1 ] = ( c.g * pct ) + data[ i + 1 ] * pct2;
	data[ i + 2 ] = ( c.b * pct ) + data[ i + 2 ] * pct2;
}

qbs._.addCommand( "getImageData", getImageData, true, false );
function getImageData( screenData ) {
	if( screenData.dirty === false ) {
		screenData.imageData = screenData.context.getImageData(
			0, 0, screenData.width, screenData.height
		);
	}
}

qbs._.addCommand( "setImageDirty", setImageDirty, true, false );
function setImageDirty( screenData ) {
	if( screenData.dirty === false ) {
		screenData.dirty = true;
		if(
			screenData.isAutoRender && 
			! screenData.autoRenderMicrotaskScheduled 
		) {
			screenData.autoRenderMicrotaskScheduled = true;
			qbs.util.queueMicrotask( function () {
				if( screenData.screenObj && screenData.isAutoRender ) {
					screenData.screenObj.render();
				}
				screenData.autoRenderMicrotaskScheduled = false;
			} );
		}
	}
}

qbs._.addCommand( "setPixel", setPixel, true, false );
function setPixel( screenData, x, y, c ) {
	screenData.blendPixelCmd( screenData, x, y, c );
}

qbs._.addCommand( "setPixelSafe", setPixelSafe, true, false );
qbs._.addPen( "pixel", setPixelSafe, "square" );
function setPixelSafe( screenData, x, y, c ) {
	if( x < 0 || x >= screenData.width || y < 0 || y >= screenData.height ) {
		return;
	}

	m_qbData.commands.getImageData( screenData );
	c = getPixelColor( screenData, c );
	screenData.blendPixelCmd( screenData, x, y, c );
	m_qbData.commands.setImageDirty( screenData );
}

qbs._.addCommand( "getPixelColor", getPixelColor, true, false );
function getPixelColor( screenData, c ) {
	var noise, change, half, c2;

	noise = screenData.pen.noise;
	if( ! noise ) {
		return c;
	}
	c2 = { "r": c.r, "g": c.g, "b": c.b, "a": c.a };
	half = noise / 2;
	if( qbs.util.isArray( noise ) ) {
		c2.r = qbs.util.clamp(
			Math.round( c2.r + qbs.util.rndRange( -noise[ 0 ], noise[ 0 ] ) ),
			0, 255
		);
		c2.g = qbs.util.clamp(
			Math.round( c2.g + qbs.util.rndRange( -noise[ 1 ], noise[ 1 ] ) ),
			0, 255
		);
		c2.b = qbs.util.clamp(
			Math.round( c2.b + qbs.util.rndRange( -noise[ 2 ], noise[ 2 ] ) ),
			0, 255
		);
		c2.a = qbs.util.clamp(
			c2.a + qbs.util.rndRange( -noise[ 3 ], noise[ 3 ] ),
			0, 255
		);
	} else {
		change = Math.round( Math.random() * noise - half );
		c2.r = qbs.util.clamp( c2.r + change, 0, 255 );
		c2.g = qbs.util.clamp( c2.g + change, 0, 255 );
		c2.b = qbs.util.clamp( c2.b + change, 0, 255 );
	}
	return c2;
}

qbs._.addCommand( "drawSquarePen", drawSquarePen, true, false );
qbs._.addPen( "square", drawSquarePen, "square" );
function drawSquarePen( screenData, x, y, c ) {
	var size, x2, y2, offset;

	// Size must always be an odd number
	size = screenData.pen.size * 2 - 1;

	// Compute the center offset of the square
	offset = Math.round( size / 2 ) - 1;

	// Draw the square
	for( y2 = 0; y2 < size; y2++ ) {
		for( x2 = 0; x2 < size; x2++ ) {
			m_qbData.commands.setPixelSafe(
				screenData,
				x2 + x - offset,
				y2 + y - offset,
				c
			);
		}
	}

	m_qbData.commands.setImageDirty( screenData );
}

qbs._.addCommand( "drawCirclePen", drawCirclePen, true, false );
qbs._.addPen( "circle", drawCirclePen, "round" );
function drawCirclePen( screenData, x, y, c ) {
	var size, half, x2, y2, x3, y3, offset, r;

	// Special case for pen size 2
	if( screenData.pen.size === 2 ) {
		m_qbData.commands.setPixelSafe( screenData, x, y, c );
		m_qbData.commands.setPixelSafe( screenData, x + 1, y, c );
		m_qbData.commands.setPixelSafe( screenData, x - 1, y, c );
		m_qbData.commands.setPixelSafe( screenData, x, y + 1, c );
		m_qbData.commands.setPixelSafe( screenData, x, y - 1, c );
		m_qbData.commands.setImageDirty( screenData );
		return;
	}

	// Double size to get the size of the outer box
	size = screenData.pen.size * 2;

	// Half is size of radius
	half = screenData.pen.size;

	// Calculate the center of circle
	offset = half - 1;

	// Loop through the square boundary outside of the circle
	for( y2 = 0; y2 < size; y2++ ) {
		for( x2 = 0; x2 < size; x2++ ) {

			// Compute the coordinates
			x3 = x2 - offset;
			y3 = y2 - offset;

			// Compute the radius of point - round to make pixel perfect
			r = Math.round( Math.sqrt( x3 * x3 + y3 * y3 ) );

			// Only draw the pixel if it is inside the circle
			if( r < half ) {
				m_qbData.commands.setPixelSafe( screenData, x3 + x, y3 + y, c );
			}
		}
	}

	m_qbData.commands.setImageDirty( screenData );
}

qbs._.addCommand( "getPixelInternal", getPixelInternal, true, false );
function getPixelInternal( screenData, x, y ) {
	var data, i;

	// Get the image data
	data = screenData.imageData.data;

	// Calculate the index of the color
	i = ( ( screenData.width * y ) + x ) * 4;

	return {
		r: data[ i ],
		g: data[ i + 1 ],
		b: data[ i + 2 ],
		a: data[ i + 3 ]
	};
}

qbs._.addCommand( "getPixel", getPixel, false, true, [ "x", "y" ] );
function getPixel( screenData, args ) {
	var x, y, data, i;

	x = args[ 0 ];
	y = args[ 1 ];

	// Get the image data
	m_qbData.commands.getImageData( screenData );
	data = screenData.imageData.data;

	// Calculate the index of the color
	i = ( ( screenData.width * y ) + x ) * 4;

	return qbs.util.convertToColor( {
		r: data[ i ],
		g: data[ i + 1 ],
		b: data[ i + 2 ],
		a: data[ i + 3 ]
	} );
}

qbs._.addCommand( "getPixelSafe", getPixelSafe, true, false );
function getPixelSafe( screenData, x, y ) {

	m_qbData.commands.getImageData( screenData );

	return getPixelInternal( screenData, x, y );
}

// Finds a color from the palette and returns it's value.
qbs._.addCommand( "findColorValue", findColorValue, true, false );
function findColorValue( screenData, colorInput, commandName ) {
	var colorValue;

	if( qbs.util.isInteger( colorInput ) ) {
		if( colorInput > screenData.pal.length ) {
			m_qbData.log(
				commandName + ": parameter color is not a color in the palette."
			);
			return;
		}
		colorValue = screenData.pal[ colorInput ]
	} else {
		colorValue = qbs.util.convertToColor( colorInput );
		if( colorValue === null ) {
			m_qbData.log( commandName +
				": parameter color is not a valid color format."
			);
			return;
		}
	}
	return colorValue;
}

// Set the default pen draw function
m_qbData.defaultPenDraw = setPixelSafe;

// Set the default set pixel mode function
m_qbData.defaultBlendCmd = normalBlend;

// End of File Encapsulation
} )();
/*
* File: qbs-screen-graphics.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

// Circle command
qbs._.addCommands( "circle", pxCircle, aaCircle,
	[ "x", "y", "radius", "fillColor" ]
);
function pxCircle( screenData, args ) {
	var x, y, radius, fillColor, i, x2, y2, midPoint, color, isFill,
		tempData;

	x = args[ 0 ];
	y = args[ 1 ];
	radius = args[ 2 ];
	fillColor = args[ 3 ];

	isFill = false;

	if(
		! qbs.util.isInteger( x ) ||
		! qbs.util.isInteger( y ) ||
		! qbs.util.isInteger( radius )
	) {
		m_qbData.log( "circle: x, y, r must be integers." );
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
			screenData, fillColor, "circle"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	m_qbData.commands.getImageData( screenData );

	if( isFill ) {
		m_qbData.commands.setImageDirty( screenData );
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
		m_qbData.commands.paint( screenData, [ x, y, fillColor ] );

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

	m_qbData.commands.setImageDirty( screenData );
}

function aaCircle( screenData, args ) {
	var x, y, r, fillColor, isFill, angle1, angle2;

	x = args[ 0 ] + 0.5;
	y = args[ 1 ] + 0.5;
	r = args[ 2 ] - 0.9;
	fillColor = args[ 3 ];

	if( isNaN( x ) || isNaN( y ) || isNaN( r ) ) {
		m_qbData.log("circle: parameters cx, cy, r must be numbers.");
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
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
	angle1 = qbs.util.degreesToRadian( 0 );
	angle2 = qbs.util.degreesToRadian( 360 );
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
}

// Arc command
qbs._.addCommands( "arc", pxArc, aaArc,
	[ "x", "y", "radius", "angle1", "angle2" ]
);
function pxArc( screenData, args ) {
	var x, y, radius, angle1, angle2, color, x2, y2, midPoint, winding;

	function set( x2, y2 ) {
		var a;
		a = ( qbs.util.radiansToDegrees( Math.atan2( y2 - y, x2 - x ) ) );
		a = ( a + 360 ) % 360;
		if( winding ) {
			if( a >= angle1 || a <= angle2 ) {
				screenData.pen.draw( screenData, x2, y2, color );
			}
		} else if( a >= angle1 && a <= angle2 ) {
			screenData.pen.draw( screenData, x2, y2, color );
		}
	}

	x = args[ 0 ];
	y = args[ 1 ];
	radius = args[ 2 ];
	angle1 = args[ 3 ];
	angle2 = args[ 4 ];
	angle1 = ( angle1 + 360 ) % 360;
	angle2 = ( angle2 + 360 ) % 360;
	winding = false;
	if( angle1 > angle2 ) {
		winding = true;
	}
	m_qbData.commands.getImageData( screenData );

	// Make sure x and y are integers
	if( isNaN( x ) || isNaN( y ) || isNaN( radius ) ) {
		m_qbData.log( "circle: Argument's cx, cy, r must be numbers." );
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
		m_qbData.commands.setImageDirty( screenData );
		return;
	} else if( radius === 0 ) {
		screenData.pen.draw( screenData, x, y, color );
		m_qbData.commands.setImageDirty( screenData );
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

	m_qbData.commands.setImageDirty( screenData );

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
			m_qbData.log( "arc: parameters cx, cy, r, a1, a2 must be numbers." );
		return;
	}

	x = x + 0.5;
	y = y + 0.5;
	radius = radius - 0.9;
	if( radius < 0 ) {
		radius = 0;
	}

	screenData.screenObj.render();
	angle1 = qbs.util.degreesToRadian( angle1 );
	angle2 = qbs.util.degreesToRadian( angle2 );
	screenData.context.beginPath();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.moveTo(
		x + Math.cos( angle1 ) * radius,
		y + Math.sin(angle1) * radius
	);
	screenData.context.arc( x, y, radius, angle1, angle2 );
	screenData.context.stroke();
}

// Ellipse command
qbs._.addCommands( "ellipse", pxEllipse, aaEllipse,
	[ "x", "y", "radiusX", "radiusY", "fillColor" ]
);
function pxEllipse( screenData, args ) {
	var x, y, radiusX, radiusY, fillColor, tempData, color, dx, dy, d1, d2, x2,
		y2, isFill, i;

	x = args[ 0 ];
	y = args[ 1 ];
	radiusX = args[ 2 ];
	radiusY = args[ 3 ];
	fillColor = args[ 4 ];

	if( isNaN( x ) || isNaN( y ) || isNaN( radiusX ) || isNaN( radiusY ) ) {
		m_qbData.log(
			"ellipse: parameters x, y, radiusX, radiusY must be numbers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
			screenData, fillColor, "circle"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	m_qbData.commands.getImageData( screenData );

	if( isFill ) {
		m_qbData.commands.setImageDirty( screenData );
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
		m_qbData.commands.setImageDirty( screenData );
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
		m_qbData.commands.paint( screenData, [ x, y, fillColor ] );

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

	m_qbData.commands.setImageDirty( screenData );
}

function aaEllipse( screenData, args ) {
	var cx, cy, rx, ry, fillColor, isFill;

	cx = args[ 0 ];
	cy = args[ 1 ];
	rx = args[ 2 ];
	ry = args[ 3 ];
	fillColor = args[ 4 ];

	if( isNaN( cx ) || isNaN( cy ) || isNaN( rx ) || isNaN( ry ) ) {
		m_qbData.log(
			"ellipse: parameters x, y, radiusX, radiusY must be numbers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
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
		cx, cy, rx, ry, 0, qbs.util.math.deg360, false
	);
	if( isFill ) {
		screenData.context.fillStyle = fillColor.s;
		screenData.context.fill();
	}
	screenData.context.stroke();
}

// Put command
qbs._.addCommand( "put", put, false, true, [ "data", "x", "y", "includeZero" ] );
function put( screenData, args ) {
	var data, x, y, includeZero, dataX, dataY, startX, startY, width, height, i, c;

	data = args[ 0 ];
	x = args[ 1 ];
	y = args[ 2 ];
	includeZero = !!( args[ 3 ] );

	// Exit if no data
	if( ! data || data.length < 1 ) {
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

	m_qbData.commands.getImageData( screenData );

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

	m_qbData.commands.setImageDirty( screenData );
}

// Get command
qbs._.addCommand( "get", get, false, true,
	[ "x1", "y1", "x2", "y2", "tolerance" ]
);
function get( screenData, args ) {
	var x1, y1, x2, y2, tolerance, t, imageData, data, x, y, c, r,
		g, b, i, row, a;

	x1 = args[ 0 ];
	y1 = args[ 1 ];
	x2 = args[ 2 ];
	y2 = args[ 3 ];
	tolerance = args[ 4 ];

	x1 = qbs.util.clamp( x1, 0, screenData.width - 1 );
	x2 = qbs.util.clamp( x2, 0, screenData.width - 1 );
	y1 = qbs.util.clamp( y1, 0, screenData.height - 1 );
	y2 = qbs.util.clamp( y2, 0, screenData.height - 1 );
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

	m_qbData.commands.getImageData( screenData );

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
				qbs.util.rgbToColor( r, g, b, a ),
				tolerance
			);
			data[ row ].push( c );
		}
		row += 1;
	}

	return data;
}

// PSET command
qbs._.addCommands( "pset", pset, aaPset, [ "x", "y" ] );
function pset( screenData, args ) {
	var x, y, color;

	x = args[ 0 ];
	y = args[ 1 ];

	// Make sure x and y are integers
	if( ! qbs.util.isInteger( x ) || ! qbs.util.isInteger( y ) ) {
		m_qbData.log( "pset: Argument's x and y must be integers." );
		return;
	}

	// Set the cursor
	screenData.x = x;
	screenData.y = y;

	// Make sure x and y are on the screen
	if( ! qbs.util.inRange2( x, y, 0, 0, screenData.width, screenData.height ) ) {
		//m_qbData.log( "pset: Argument's x and y are not on the screen." );
		return;
	}

	// Get the fore color
	color = screenData.fColor;

	m_qbData.commands.getImageData( screenData );
	screenData.pen.draw( screenData, x, y, color );
	m_qbData.commands.setImageDirty( screenData );
}

function aaPset( screenData, args ) {
	var x, y;

	x = args[ 0 ];
	y = args[ 1 ];

	// Make sure x and y are integers
	if( ! qbs.util.isInteger( x ) || ! qbs.util.isInteger( y ) ) {
		m_qbData.log( "pset: Argument's x and y must be integers." );
		return;
	}

	// Set the cursor
	screenData.x = x;
	screenData.y = y;

	// Make sure x and y are on the screen
	if( ! qbs.util.inRange2( x, y, 0, 0, screenData.width, screenData.height ) ) {
		//m_qbData.log( "pset: Argument's x and y are not on the screen." );
		return;
	}

	screenData.screenObj.render();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.beginPath();
	screenData.context.moveTo( x, y );
	screenData.context.lineTo( x, y );
	screenData.context.stroke();
}

// Line command
qbs._.addCommands( "line", pxLine, aaLine, [ "x1", "y1", "x2", "y2" ] );
function pxLine( screenData, args ) {
	var x1, y1, x2, y2, color, dx, dy, sx, sy, err, e2;

	x1 = args[ 0 ];
	y1 = args[ 1 ];
	x2 = args[ 2 ];
	y2 = args[ 3 ];

	// Make sure x and y are integers
	if( ! qbs.util.isInteger( x1 ) || ! qbs.util.isInteger( y1 ) ||
		! qbs.util.isInteger( x2 ) || ! qbs.util.isInteger( y2 ) ) {
		m_qbData.log( "line: Argument's x1, y1, x2, and y2 must be integers." );
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
	m_qbData.commands.getImageData( screenData );

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

	m_qbData.commands.setImageDirty( screenData );
}

function aaLine( screenData, args ) {
	var x1, y1, x2, y2;

	x1 = args[ 0 ];
	y1 = args[ 1 ];
	x2 = args[ 2 ];
	y2 = args[ 3 ];

	if( isNaN( x1 ) || isNaN( y1 ) || isNaN( x2 ) || isNaN( y2 ) ) {
		m_qbData.log("line: parameters x1, y1, x2, y2 must be numbers.");
		return;
	}

	screenData.screenObj.render();
	screenData.context.strokeStyle = screenData.fColor.s;
	screenData.context.beginPath();
	screenData.context.moveTo( x1, y1 );
	screenData.context.lineTo( x2, y2 );
	screenData.context.stroke();
}

// Rect command
qbs._.addCommands( "rect", pxRect, aaRect,
	[ "x", "y", "width", "height", "fillColor" ]
);
function pxRect( screenData, args ) {
	var x, y, width, height, fillColor, isFill, x2, y2, tempColor, x3;

	x = args[ 0 ];
	y = args[ 1 ];
	width = args[ 2 ];
	height = args[ 3 ];
	fillColor = args[ 4 ];

	if(
		! qbs.util.isInteger( x ) ||
		! qbs.util.isInteger( y ) ||
		! qbs.util.isInteger( width ) ||
		! qbs.util.isInteger( height )
	) {
		m_qbData.log( "rect: x, y, width, and height must be integers." );
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
			screenData, fillColor, "rect"
		);
		if( fillColor === undefined ) {
			return;
		}
		isFill = true;
	}

	x2 = x + width - 1;
	y2 = y + height - 1;

	m_qbData.commands.line( screenData, [ x, y, x2, y ] );
	m_qbData.commands.line( screenData, [ x2, y, x2, y2 ] );
	m_qbData.commands.line( screenData, [ x2, y2, x, y2 ] );
	m_qbData.commands.line( screenData, [ x, y2, x, y ] );

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
				m_qbData.commands.setPixel( screenData, x3, y, fillColor );
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
		m_qbData.log(
			"rect: parameters x, y, width, height must be numbers."
		);
		return;
	}

	if( fillColor != null ) {
		fillColor = m_qbData.commands.findColorValue(
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
}

// Set Pal Color command
qbs._.addCommand( "setPalColor", setPalColor, false, true,
	[ "index", "color" ]
);
qbs._.addSetting( "palColor", setPalColor, true,
	[ "index", "color" ]
);
function setPalColor( screenData, args ) {
	var index, color, colorValue, i;

	index = args[ 0 ];
	color = args[ 1 ];

	if(
		! qbs.util.isInteger( index ) ||
		index < 0 ||
		index > screenData.pal.length
	) {
		m_qbData.log( "setPalColor: index is not a valid integer value." );
		return;
	}
	colorValue = qbs.util.convertToColor( color );
	if( colorValue === null ) {
		m_qbData.log(
			"setPalColor: parameter color is not a valid color format."
		);
		return;
	}

	// Check if we are changing the current selected fore color
	if( screenData.fColor.s === screenData.pal[ index ].s ) {
		screenData.fColor = colorValue;
	}

	// Check if we are changing any of the colors
	for( i = 0; i < screenData.colors.length; i++ ) {
		if( screenData.colors[ i ].s === screenData.pal[ index ].s ) {
			screenData.colors[ i ] = colorValue;
		}
	}

	screenData.pal[ index ] = colorValue;
}

// Get pal command
qbs._.addCommand( "getPal", getPal, false, true, [] );
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
		colors.push( screenData.pal[ i ] );
	}
	return colors;
}

// Color command
qbs._.addCommand( "setColor", setColor, false, true,
	[ "color", "isAddToPalette" ]
);
qbs._.addSetting( "color", setColor, true, [ "color", "isAddToPalette" ] );
function setColor( screenData, args ) {
	var colorInput, colorValue, isAddToPalette, colors;

	colorInput = args[ 0 ];
	isAddToPalette = !!( args[ 1 ] );
	colorValue = m_qbData.commands.findColorValue(
		screenData, colorInput, "color"
	);

	if( colorValue === undefined ) {
		return;
	}
	colors = [ colorValue ];

	if( isAddToPalette ) {
		screenData.fColor = screenData.screenObj.findColor(
			colorValue, isAddToPalette
		);
	} else {
		screenData.fColor = colorValue;
	}

	screenData.colors = colors;

	screenData.context.fillStyle = colorValue.s;
	screenData.context.strokeStyle = colorValue.s;
}

// Colors command
qbs._.addCommand( "setColors", setColors, false, true, [ "colors" ] );
qbs._.addSetting( "colors", setColors, true, [ "colors" ] );
function setColors( screenData, args ) {
	var colorInput, colorValue, i, colors;

	colorInput = args[ 0 ];
	colors = [];
	if( qbs.util.isArray( colorInput ) ) {
		if( colorInput.length === 0 ) {
			m_qbData.log( "color: color array cannot be empty." );
			return;
		}
		for( i = 0; i < colorInput.length; i++ ) {
			colorValue = m_qbData.commands.findColorValue(
				screenData, colorInput[ i ], "color"
			);
			if( colorValue === undefined ) {
				return;
			}
			colors.push( colorValue );
		}
		colorValue = colors[ 0 ];
	} else {
		m_qbData.log( "color: colors must be an array." );
		return;
	}

	screenData.fColor = colorValue;
	screenData.colors = colors;

	screenData.context.fillStyle = colorValue.s;
	screenData.context.strokeStyle = colorValue.s;
}

qbs._.addCommand( "swapColor", swapColor, false, true,
	[ "oldColor", "newColor" ]
);
function swapColor( screenData, args ) {
	var oldColor, newColor, index, x, y, i, data;

	oldColor = args[ 0 ];
	newColor = args[ 1 ];

	// Validate oldColor
	if( ! qbs.util.isInteger( oldColor ) ) {
		m_qbData.log( "swapColor: parameter oldColor must be an integer." );
		return;
	} else if( oldColor < 0 || oldColor > screenData.pal.length ) {
		m_qbData.log( "swapColor: parameter oldColor is an invalid integer." );
		return;
	}

	index = oldColor;
	oldColor = screenData.pal[ index ];

	// Validate newColor
	newColor = qbs.util.convertToColor( newColor );
	if( newColor === null ) {
		m_qbData.log(
			"swapColor: parameter newColor is not a valid color format."
		);
		return;
	}

	m_qbData.commands.getImageData( screenData );
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

	m_qbData.commands.setImageDirty( screenData );

	// Update the pal data
	screenData.pal[ index ] = newColor;

}

// Point command
qbs._.addCommand( "point", point, false, true, [ "x", "y" ] );
function point( screenData, args ) {
	var x, y, i, c, data;

	x = args[ 0 ];
	y = args[ 1 ];

	// Make sure x and y are integers
	if( ! qbs.util.isInteger( x ) || ! qbs.util.isInteger( y ) ) {
		m_qbData.log("point: Argument's x and y must be integers.");
		return;
	}

	m_qbData.commands.getImageData( screenData );
	data = screenData.imageData.data;

	// Calculate the index
	i = ( ( screenData.width * y ) + x ) * 4;
	c = qbs.util.convertToColor( {
		r: data[ i ],
		g: data[ i + 1 ],
		b: data[ i + 2 ],
		a: data[ i + 3 ]
	} );
	return screenData.screenObj.findColor( c );
}

// CLS command
qbs._.addCommand( "cls", cls, false, true, [] );
function cls( screenData ) {
	screenData.context.clearRect( 0, 0, screenData.width, screenData.height );
	screenData.imageData = null;
	screenData.printCursor.x = 0;
	screenData.printCursor.y = 0;
	screenData.x = 0;
	screenData.y = 0;
	screenData.dirty = false;
}

qbs._.addCommand( "filterImg", filterImg, false, true, [ "filter" ] );
function filterImg( screenData, args ) {
	var filter, data, x, y, i, color;

	filter = args[ 0 ];

	if( ! qbs.util.isFunction( filter ) ) {
		m_qbData.log("filter: Argument filter must be a callback function.");
		return;
	}

	m_qbData.commands.getImageData( screenData );
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
					qbs.util.isInteger( color.r ) &&
					qbs.util.isInteger( color.g ) &&
					qbs.util.isInteger( color.b ) &&
					qbs.util.isInteger( color.a ) ) {
				color.r = qbs.util.clamp( color.r, 0, 255 );
				color.g = qbs.util.clamp( color.g, 0, 255 );
				color.b = qbs.util.clamp( color.b, 0, 255 );
				color.a = qbs.util.clamp( color.a, 0, 255 );
				data[ i ] = color.r;
				data[ i + 1 ] = color.g;
				data[ i + 2 ] = color.b;
				data[ i + 3 ] = color.a;
			}
		}
	}

	m_qbData.commands.setImageDirty( screenData );
}

// Render command
qbs._.addCommand( "render", render, false, true, [] );
function render( screenData ) {
	if( screenData.imageData && screenData.dirty ) {
		screenData.context.putImageData( screenData.imageData, 0, 0 );
	}
	screenData.dirty = false;
}

// End of File Encapsulation
} )();
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
/*
* File: qbs-screen-images.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_qbWait, m_qbResume, m_callback;

m_qbData = qbs._.data;
m_qbWait = qbs._.wait;
m_qbResume = qbs._.resume;
m_callback = null;

qbs._.addCommand( "loadImage", loadImage, false, false, [ "src", "name" ] );
function loadImage( args ) {
	var src, name, image, callback, tempOnload;

	src = args[ 0 ];
	name = args[ 1 ];

	if( typeof src === "string" ) {

		// Create a new image
		image = new Image();

		// Set the source
		image.src = src;

	} else {
		if(
			! src || ( src.tagName !== "IMG" && src.tagName !== "CANVAS" )
		) {
			m_qbData.log(
				"loadImage: src must be a string, image element, or canvas."
			);
			return;
		}
		image = src;
	}

	if( typeof name !== "string" ) {
		name = "" + m_qbData.imageCount;
		m_qbData.imageCount += 1;
	}

	m_qbData.images[ name ] = {
		"image": null,
		"type": "image"
	};

	// Store callback locally
	callback = m_callback;
	m_callback = null;

	if( ! image.complete ) {
		m_qbWait();
		if( qbs.util.isFunction( image.onload ) ) {
			tempOnload = image.onload;
		}
		image.onload = function () {
			if( tempOnload ) {
				tempOnload();
			}
			m_qbData.images[ name ].image = image;
			if( qbs.util.isFunction( callback ) ) {
				callback();
			}
			m_qbResume();
		};
	} else {
		m_qbData.images[ name ].image = image;
		if( qbs.util.isFunction( callback ) ) {
			callback();
		}
	}

	return name;
}

qbs._.addCommand(
	"loadSpritesheet", loadSpritesheet, false, false,
	[ "src", "width", "height", "margin", "name" ]
);
function loadSpritesheet( args ) {
	var src, spriteWidth, spriteHeight, margin, name;

	src = args[ 0 ];
	spriteWidth = args[ 1 ];
	spriteHeight = args[ 2 ];
	margin = args[ 3 ];
	name = args[ 4 ];

	if( margin == null ) {
		margin = 0;
	}

	// Validate spriteWidth and spriteHeight
	if(
		! qbs.util.isInteger( spriteWidth ) ||
		! qbs.util.isInteger( spriteHeight )
	) {
		m_qbData.log( "loadSpriteSheet: width, and height must be integers." );
		return;
	}

	// size cannot be less than 1
	if( spriteWidth < 1 || spriteHeight < 1 ) {
		m_qbData.log(
			"loadSpriteSheet: width, and height must be greater " +
			"than 0."
		);
		return;
	}

	// Validate margin
	if( ! qbs.util.isInteger( margin ) ) {
		m_qbData.log( "loadSpriteSheet: margin must be an integer." );
		return;
	}

	// Validate name
	if( typeof name !== "string" ) {
		name = "" + m_qbData.imageCount;
		m_qbData.imageCount += 1;
	}

	// Load the frames when the image gets loaded
	m_callback = function () {
		var imageData, width, height, x1, y1, x2, y2;

		// Update the image data
		imageData = m_qbData.images[ name ];
		imageData.type = "spritesheet";
		imageData.spriteWidth = spriteWidth;
		imageData.spriteHeight = spriteHeight;
		imageData.margin = margin;
		imageData.frames = [];

		// Prepare for loops
		width = imageData.image.width;
		height = imageData.image.height;
		x1 = imageData.margin;
		y1 = imageData.margin;
		x2 = x1 + imageData.spriteWidth;
		y2 = y1 + imageData.spriteHeight;

		// Loop through all the frames
		while( y2 <= height - imageData.margin ) {
			while( x2 <= width - imageData.margin ) {
				imageData.frames.push( {
					"x": x1,
					"y": y1,
					"width": imageData.spriteWidth,
					"height": imageData.spriteHeight
				} );
				x1 += imageData.spriteWidth + imageData.margin;
				x2 = x1 + imageData.spriteWidth;
			}
			x1 = imageData.margin;
			x2 = x1 + imageData.spriteWidth;
			y1 += imageData.spriteHeight + imageData.margin;
			y2 = y1 + imageData.spriteHeight;
		}
	};

	loadImage( [ src, name ] );

	return name;
}

qbs._.addCommand( "drawImage", drawImage, false, true,
	[ "name", "x", "y", "angle", "anchorX", "anchorY", "alpha", "scaleX", "scaleY" ]
);
function drawImage( screenData, args ) {
	var name, x, y, angle, anchorX, anchorY, alpha, img, scaleX, scaleY;

	name = args[ 0 ];
	x = args[ 1 ];
	y = args[ 2 ];
	angle = args[ 3 ];
	anchorX = args[ 4 ];
	anchorY = args[ 5 ];
	alpha = args[ 6 ];
	scaleX = args[ 7 ];
	scaleY = args[ 8 ];

	if( typeof name === "string" ) {
		if( ! m_qbData.images[ name ] ) {
			m_qbData.log( "drawImage: invalid image name" );
			return;
		}
		img = m_qbData.images[ name ].image;
	} else {
		if( ! name && ! name.canvas && ! name.getContext ) {
			m_qbData.log(
				"drawImage: image source object type. Must be an image" +
				" already loaded by the loadImage command or a screen."
			);
			return;
		}
		if( qbs.util.isFunction( name.canvas ) ) {
			img = name.canvas();
		} else {
			img = name;
		}
	}

	drawItem( screenData, img, x, y, angle, anchorX, anchorY, alpha, null, scaleX, scaleY );
}

qbs._.addCommand( "drawSprite", drawSprite, false, true,
	[
		"name", "frame", "x", "y", "angle", "anchorX", "anchorY", "img",
		"alpha", "scaleX", "scaleY"
	]
);
function drawSprite( screenData, args ) {
	var name, frame, x, y, angle, anchorX, anchorY, alpha, img, scaleX, scaleY;

	name = args[ 0 ];
	frame = args[ 1 ];
	x = args[ 2 ];
	y = args[ 3 ];
	angle = args[ 4 ];
	anchorX = args[ 5 ];
	anchorY = args[ 6 ];
	alpha = args[ 7 ];
	scaleX = args[ 8 ];
	scaleY = args[ 9 ];

	// Validate name
	if( ! m_qbData.images[ name ] ) {
		m_qbData.log( "drawSprite: invalid sprite name" );
		return;
	}

	// Validate frame
	if(
		! qbs.util.isInteger( frame ) ||
		frame >= m_qbData.images[ name ].frames.length ||
		frame < 0
	) {
		m_qbData.log( "drawSprite: frame number is not valid" );
		return;
	}

	img = m_qbData.images[ name ].image;

	drawItem(
		screenData, img, x, y, angle, anchorX, anchorY, alpha,
		m_qbData.images[ name ].frames[ frame ], scaleX, scaleY
	);
}

function drawItem(
	screenData, img, x, y, angle, anchorX, anchorY, alpha, spriteData, scaleX, scaleY
) {
	var context, oldAlpha;

	if( scaleX === undefined || isNaN( Number( scaleX ) ) ) {
		scaleX = 1;
	}

	if( scaleY === undefined || isNaN( Number( scaleY ) ) ) {
		scaleY = 1;
	}

	if( ! angle ) {
		angle = 0;
	}

	// Convert the angle from degrees to radian
	angle = qbs.util.degreesToRadian( angle );

	if( ! anchorX ) {
		anchorX = 0;
	}
	if( ! anchorY ) {
		anchorY = 0;
	}

	if( ! alpha && alpha !== 0 ) {
		alpha = 255;
	}

	if( spriteData ) {
		anchorX = Math.round( spriteData.width * anchorX );
		anchorY = Math.round( spriteData.height * anchorY );
	} else {
		anchorX = Math.round( img.width * anchorX );
		anchorY = Math.round( img.height * anchorY );
	}

	context = screenData.context;

	oldAlpha = context.globalAlpha;
	context.globalAlpha = ( alpha / 255 );

	screenData.screenObj.render();

	context.translate( x, y );
	context.rotate( angle );
	context.scale( scaleX, scaleY );
	if( spriteData == null ) {
		context.drawImage( img, -anchorX, -anchorY );
	} else {
		context.drawImage(
			img, 
			spriteData.x, spriteData.y, spriteData.width, spriteData.height,
			-anchorX, -anchorY, spriteData.width, spriteData.height
		);
	}
	context.scale( 1 / scaleX, 1 / scaleY );
	context.rotate( -angle );
	context.translate( -x, -y );
	context.globalAlpha = oldAlpha;
}

// End of File Encapsulation
} )();
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
/*
* File: qbs-screen-table.js
*/

// Start of File Encapsulation
( function () {

	"use strict";
	var m_qbData, m_borderStyles;

	m_qbData = qbs._.data;

	m_borderStyles = {
		"single": [
			[ 218, 196, 194, 191 ],
			[ 195, 196, 197, 180 ],
			[ 192, 196, 193, 217 ],
			[ 179, 32, 179 ]
		],
		"double": [
			[ 201, 205, 203, 187 ],
			[ 204, 205, 206, 185 ],
			[ 200, 205, 202, 188 ],
			[ 186, 32, 186 ]
		],
		"singleDouble": [
			[ 213, 205, 209, 184 ],
			[ 198, 205, 216, 181 ],
			[ 212, 205, 207, 190 ],
			[ 179, 32, 179 ]
		],
		"doubleSingle": [
			[ 214, 196, 210, 183 ],
			[ 199, 196, 215, 182 ],
			[ 211, 196, 208, 189 ],
			[ 186, 32, 186 ]
		],
		"thick": [
			[ 219, 223, 219, 219 ],
			[ 219, 223, 219, 219 ],
			[ 223, 223, 223, 223 ],
			[ 219, 32, 219 ]
		]
	};
	qbs._.addCommand( "printTable", printTable, false, true,
		[ "items", "tableFormat", "borderStyle", "isCentered" ]
	);
	function printTable( screenData, args ) {

		var items, width, tableFormat, borderStyle, isCentered, isFormatted, i;

		items = args[ 0 ];
		tableFormat = args[ 1 ];
		borderStyle = args[ 2 ];
		isCentered = !!( args[ 3 ] );
		if( ! qbs.util.isArray( items ) ) {
			m_qbData.log( "printTable: items must be an array" );
			return;
		}

		if( ! borderStyle ) {
			borderStyle = m_borderStyles[ "single" ];
		}

		if( tableFormat == null ) {
			isFormatted = false;
		} else if( qbs.util.isArray( tableFormat ) ) {
			for( i = 0; i < tableFormat.length; i++ ) {
				if( typeof tableFormat[ i ] !== "string" ) {
					m_qbData.log(
						"printTable: tableFormat must be an array of strings"
					);
					return;
				}
			}
			isFormatted = true;
		} else {
			m_qbData.log(
				"printTable: tableFormat must be an array"
			);
			return;
		}

		if( typeof borderStyle === "string" && m_borderStyles[ borderStyle ] ) {
			borderStyle = m_borderStyles[ borderStyle ];
		} else if( ! qbs.util.isArray( borderStyle ) ) {
			m_qbData.log(
				"printTable: borderStyle must be an integer or array"
			);
			return;
		}

		if( isFormatted ) {
			return buildFormatedTable(
				screenData, items, borderStyle, tableFormat, isCentered
			);
		} else {
			width = m_qbData.commands.getCols( screenData );
			return buildStandardTable( screenData, items, width, borderStyle );
		}
	}

	function buildStandardTable( screenData, items, width, borders ) {
		var row, col, msg, msgTop, msgMid, msgBot, cellWidth, cellHeight,
			rowWidth, rowPad, bottomRow, boxes, font, startPos, box;

		msg = "";
		boxes = [];
		font = screenData.printCursor.font;
		startPos = m_qbData.commands.getPos( screenData );
		cellHeight = 2;

		for( row = 0; row < items.length; row += 1 ) {

			// Calculate the cellWidth
			cellWidth = Math.floor( width / items[ row ].length );
			if( cellWidth < 3 ) {
				cellWidth = 3;
			}

			rowWidth = ( cellWidth - 2 ) * items[ row ].length +
				items[ row ].length + 1;
			rowPad = Math.round( ( width - rowWidth ) / 2 );
			msgTop = qbs.util.padL( "", rowPad, " " );
			msgMid = msgTop;
			msgBot = msgTop;

			// Format all the cells
			for( col = 0; col < items[ row ].length; col += 1 ) {

				createBox(
					( col * ( cellWidth - 1 ) ) + rowPad,
					( row * 2 ) + startPos.row, boxes, font
				);
				box = boxes[ boxes.length - 1 ];
				box.pos.width = cellWidth - 1;
				box.pos.height = 2;
				box.pixels.width = box.pos.width * font.width;
				box.pixels.height = box.pos.height * font.height;

				if( col === items[ row ].length - 1 ) {
					box.pixels.width += 1;
				}

				if( row === items.length - 1 ) {
					box.pixels.height += 1;
				}

				// Middle cell
				msgMid += String.fromCharCode( borders[ 3 ][ 0 ] ) +
					qbs.util.pad(
						items[ row ][ col ],
						cellWidth - 2,
						String.fromCharCode( borders[ 3 ][ 1 ] )
					);

				if( col === items[ row ].length - 1 ) {
					msgMid += String.fromCharCode( borders[ 3 ][ 2 ] );
				}

				// Top Row
				if( row === 0 ) {

					// Top left corner
					if( col === 0 ) {
						msgTop += String.fromCharCode( borders[ 0 ][ 0 ] );
					} else {
						msgTop += String.fromCharCode( borders[ 0 ][ 2 ] );
					}

					// Top center line
					msgTop += qbs.util.pad( "", cellWidth - 2,
						String.fromCharCode( borders[ 0 ][ 1 ] )
					);

					// Top Right corner
					if( col === items[ row ].length - 1 ) {
						msgTop += String.fromCharCode( borders[ 0 ][ 3 ] );
					}

				}

				// Bottom Row
				if( row === items.length - 1 ) {
					bottomRow = 2;
				} else {
					bottomRow = 1;
				}

				// Bottom Left Corner
				if( col === 0 ) {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 0 ] );
				} else {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 2 ] );
				}

				// Bottom center line
				msgBot += qbs.util.pad( "", cellWidth - 2, String.fromCharCode(
					borders[ bottomRow ][ 1 ] )
				);

				// Bottom Right corner
				if( col === items[ row ].length - 1 ) {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 3 ] );
				}

			}

			// Move to the next row
			if( row === 0 ) {
				msg += msgTop + "\n";
			}
			msg += msgMid + "\n";
			msg += msgBot + "\n";
		}

		msg = msg.substr( 0, msg.length - 1 );
		m_qbData.commands.print( screenData, [ msg ] );

		return boxes;
	}

	function buildFormatedTable(
		screenData, items, borders, tableFormat, isCentered
	) {
		var row, col, msg, cell, cellDirs, boxes, i, pos, posAfter, padding,
			font;

		msg = "";
		boxes = [];
		pos = m_qbData.commands.getPos( screenData );
		font = screenData.printCursor.font;

		// Set padding for centered table
		if( isCentered ) {
			pos.col = Math.floor( ( m_qbData.commands.getCols( screenData ) -
				tableFormat[ 0 ].length ) / 2
			);
		}

		// Create the padding
		padding = qbs.util.pad( "", pos.col, " " );
		m_qbData.commands.setPos( screenData, [ 0, pos.row ] );

		for( row = 0; row < tableFormat.length; row += 1 ) {
			msg += padding;
			for( col = 0; col < tableFormat[ row ].length; col += 1 ) {
				cell = tableFormat[ row ].charAt( col );

				// Table Intersection
				if( cell === "*" ) {

					cellDirs = "" +
						lookCell( col, row, "left", tableFormat ) +
						lookCell( col, row, "right", tableFormat ) +
						lookCell( col, row, "up", tableFormat ) +
						lookCell( col, row, "down", tableFormat );

					if( cellDirs === " - |" ) {

						// Top Left Section
						msg += String.fromCharCode( borders[ 0 ][ 0 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "-- |" ) {

						// Top Middle Section
						msg += String.fromCharCode( borders[ 0 ][ 2 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "-  |" ) {

						// Top Right Section
						msg += String.fromCharCode( borders[ 0 ][ 3 ] );

					} else if( cellDirs === " -||" ) {

						// Middle Left Section
						msg += String.fromCharCode( borders[ 1 ][ 0 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );
	
					} else if( cellDirs === "--||" ) {

						// Middle Middle
						msg += String.fromCharCode( borders[ 1 ][ 2 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "- ||" ) {

						// Middle Right
						msg += String.fromCharCode( borders[ 1 ][ 3 ] );

					} else if( cellDirs === " -| " ) {

						// Bottom Left
						msg += String.fromCharCode( borders[ 2 ][ 0 ] );

					} else if( cellDirs === "--| " ) {

						// Bottom Middle
						msg += String.fromCharCode( borders[ 2 ][ 2 ] );

					} else if( cellDirs === "- | " ) {

						// Bottom Right
						msg += String.fromCharCode( borders[ 2 ][ 3 ] );

					}
				} else if( cell === "-" ) {
					msg += String.fromCharCode( borders[ 0 ][ 1 ] );
				} else if( cell === "|" ) {
					msg += String.fromCharCode( borders[ 3 ][ 0 ] );
				} else {
					msg += " ";
				}
			}
			msg += "\n";
		}

		posAfter = m_qbData.commands.getPos( screenData );
		completeBoxes( boxes, tableFormat, font, pos );

		msg = msg.substr( 0, msg.length - 1 );
		m_qbData.commands.print( screenData, [ msg ] );

		i = 0;
		for( row = 0; row < items.length; row += 1 ) {
			if( qbs.util.isArray( items[ row ] ) ) {
				for( col = 0; col < items[ row ].length; col += 1 ) {
					if( i < boxes.length ) {
						printItem(
							screenData, boxes[ i ], items[ row ][ col ],
							pos.col
						);
						i += 1;
					}
				}
			} else {
				printItem( screenData, boxes[ i ], items[ row ], pos.col );
				i += 1;
			}
		}

		m_qbData.commands.setPos( screenData,
			[ 0, posAfter.row + tableFormat.length ]
		);

		return boxes;
	}

	function printItem( screenData, box, msg ) {
		var pos, width, height, isVertical, col, row, startRow, index;

		if( ! box ) {
			return;
		}

		msg = "" + msg;

		// Calculate dimensions
		width = box.pos.width;
		height = box.pos.height;

		if( box.format.toLowerCase() === "v" ) {
			isVertical = true;
		}

		if( isVertical ) {
			if( msg.length > height ) {
				msg = msg.substr( 0, height );
			}
		} else {
			if( msg.length > width ) {
				msg = msg.substr( 0, width );
			}
		}

		pos = m_qbData.commands.getPos( screenData );
		
		if( isVertical ) {
			index = 0;
			col = box.pos.col + Math.round( width / 2 );
			startRow = box.pos.row + 1 +
				Math.floor( ( height - msg.length ) / 2 );
			for( row = startRow; row <= height + startRow; row += 1 ) {
				m_qbData.commands.setPos( screenData, [ col, row ] );
				m_qbData.commands.print( screenData,
					[ msg.charAt( index ), true ]
				);
				index += 1;
			}
		} else {
			col = box.pos.col + 1 + Math.floor( ( width - msg.length ) / 2 );
			row = box.pos.row + Math.round( height / 2 );
			m_qbData.commands.setPos( screenData, [ col, row ] );
			m_qbData.commands.print( screenData, [ msg, true ] );
		}
		m_qbData.commands.setPos( screenData, [ pos.col, pos.row ] );
	}

	function createBox( col, row, boxes, font ) {
		boxes.push( {
			"pos": {
				"col": col,
				"row": row,
				"width": null,
				"height": null
			},
			"pixels": {
				"x": ( col * font.width ) + Math.round( font.width / 2 ) - 1,
				"y": ( row * font.height ) + Math.round( font.height / 2 ),
				"width": null,
				"height": null
			},
			"format": " "
		} );
	}

	function completeBoxes( boxes, tableFormat, font, pos ) {
		var i, box, xt, yt, cell;

		for( i = 0; i < boxes.length; i += 1 ) {
			box = boxes[ i ];

			// Compute table coordiantes for formating character
			xt = box.pos.col + 1 - pos.col;
			yt = box.pos.row + 1 - pos.row;

			// Find the formating character
			if( yt < tableFormat.length && xt < tableFormat[ yt ].length ) {
				box.format = tableFormat[ yt ].charAt( xt );
			}

			// Compute table coordiantes
			xt = box.pos.col - pos.col;
			yt = box.pos.row - pos.row;

			// Find box.width
			while( xt < tableFormat[ yt ].length - 1 ) {
				xt += 1;
				if( tableFormat[ yt ].charAt( xt ) === "*" ) {
					cell = lookCell( xt, yt, "down", tableFormat );
					if( cell === "|" ) {
						box.pos.width = ( pos.col + ( xt - 1 ) ) - box.pos.col;
						box.pixels.width = ( box.pos.width + 1 ) * font.width;
						//box.pixels.width += 1;
						// if( xt === tableFormat[ yt ].length - 1 ) {
						// 	box.pixels.width += 1;
						// }
						break;
					}
				}
			}

			// Box ends at table end
			if( box.pos.width === null ) {
				box.pos.width = ( pos.col + ( xt - 1 ) ) - box.pos.col;
				box.pixels.width = ( box.pos.width + 1 ) * font.width + 1;
			}

			// Find box.height
			while( yt < tableFormat.length - 1 ) {
				yt += 1;
				if( tableFormat[ yt ].charAt( xt ) === "*" ) {
					cell = lookCell( xt, yt, "left", tableFormat );
					if( cell === "-" ) {
						box.pos.height = ( pos.row + ( yt - 1 ) ) -
							box.pos.row;
						box.pixels.height = ( box.pos.height + 1 ) *
							font.height;
						//box.pixels.height += 1;
						// if( yt === tableFormat.length - 1 ) {
						// 	box.pixels.height += 1;
						// }
						break;
					}
				}
			}

			// Box ends at table end
			if( box.pos.height === null ) {
				box.pos.height = ( pos.row + ( yt - 1 ) ) - box.pos.row;
				box.pixels.height = ( box.pos.height + 1 ) * font.height + 1;
			}
		}
	}

	function lookCell( x, y, dir, tableFormat ) {
		if( dir === "left" ) {
			x -= 1;
		} else if( dir === "right" ) {
			x += 1;
		} else if( dir === "up" ) {
			y -= 1;
		} else if( dir === "down" ) {
			y += 1;
		}

		if( y >= tableFormat.length || y < 0 || x < 0 ) {
			return " ";
		}

		if( x >= tableFormat[ y ].length ) {
			return " ";
		}

		if(
			tableFormat[ y ].charAt( x ) === "*" &&
			( dir === "left" || dir === "right" )
		) {
			return "-";
		}

		if(
			tableFormat[ y ].charAt( x ) === "*" &&
			( dir === "up" || dir === "down" )
		) {
			return "|";
		}

		return tableFormat[ y ].charAt( x );
	}

// End of File Encapsulation
} )();
/*
* File: qbs-screen-images.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData;

m_qbData = qbs._.data;

qbs._.addCommand( "draw", draw, false, true, [ "drawString" ] );
function draw( screenData, args ) {

	var drawString, tempColors, i, reg, parts, isReturn, lastCursor,
		isBlind, isArc, drawArgs, color, len, angle, color1, radius, angle1,
		angle2;

	drawString = args[ 0 ];

	if( typeof drawString !== "string" ) {
		m_qbData.log( "draw: drawString must be a string." );
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
				len = getInt( drawArgs[ 1 ], 1 );
				angle = qbs.util.degreesToRadian( 90 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//E - Up and Right
			case "E":
				len = getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = qbs.util.degreesToRadian( 315 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//F - Down and Right
			case "F":
				len = getInt(  drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = qbs.util.degreesToRadian( 45 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//G - Down and Left
			case "G":
				len = getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = qbs.util.degreesToRadian( 135 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//H - Up and Left
			case "H":
				len = getInt( drawArgs[ 1 ], 1 );
				len = Math.sqrt( len * len + len * len );
				angle = qbs.util.degreesToRadian( 225 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//L - Left
			case "L":
				len = getInt( drawArgs[ 1 ], 1 );
				angle = qbs.util.degreesToRadian( 180 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//R - Right
			case "R":
				len = getInt( drawArgs[ 1 ], 1 );
				angle = qbs.util.degreesToRadian( 0 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//U - Up
			case "U":
				len = getInt( drawArgs[ 1 ], 1 );
				angle = qbs.util.degreesToRadian( 270 ) + screenData.angle;
				screenData.x += Math.round( Math.cos( angle ) * len );
				screenData.y += Math.round( Math.sin( angle ) * len );
				break;

			//P - Paint
			case "P":
			case "S":
				color1 = getInt( drawArgs[ 1 ], 0 );

				screenData.screenObj.paint( screenData.x, screenData.y, color1,
					drawArgs[ 0 ] === "S" );
				isBlind = true;
				break;

			//A - Arc Line
			case "A":
				radius = getInt( drawArgs[ 1 ], 1 );
				angle1 = getInt( drawArgs[ 3 ], 1 );
				angle2 = getInt( drawArgs[ 5 ], 1 );
				isArc = true;
				break;

			//TA - T - Turn Angle
			case "T":
				screenData.angle = qbs.util.degreesToRadian(
					getInt( drawArgs[ 1 ], 1 )
				);
				isBlind = true;
				break;

			//M - Move
			case "M":
				screenData.x = getInt( drawArgs[ 1 ], 1 );
				screenData.y = getInt( drawArgs[ 3 ], 1 );
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

function getInt( val, val_default ) {
	val = parseInt( val );
	if( isNaN( val ) ) {
		val = val_default;
	}
	return val;
}

// End of File Encapsulation
} )();
/*
* File: qbs-sound.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_qbData, m_qbWait, m_qbResume, m_audioPools, m_nextAudioId,
	m_audioContext, m_soundPool, m_nextSoundId;

m_qbData = qbs._.data;
m_qbWait = qbs._.wait;
m_qbResume = qbs._.resume;
m_audioPools = {};
m_nextAudioId = 0;
m_audioContext = null;
m_soundPool = {};
m_nextSoundId = 0;

// Loads a sound
qbs._.addCommand( "createAudioPool", createAudioPool, false, false, [
	"src", "poolSize"
] );
function createAudioPool( args ) {
	var src, poolSize, i, audioItem, audio, audioId;

	src = args[ 0 ];
	poolSize = args[ 1 ];

	// Validate parameters
	if( ! src ) {
		m_qbData.log( "createAudioPool: No sound source provided." );
		return;
	}
	if( poolSize === undefined || isNaN( poolSize ) ) {
		poolSize = 1;
	}

	// Create the audio item
	audioItem = {
		"pool": [],
		"index": 0
	};

	// Create the audio pool
	for( i = 0; i < poolSize; i++ ) {

		// Create the audio item
		audio = new Audio( src );

		loadAudio( audioItem, audio );
	}

	// Add the audio item too the global object
	audioId = "audioPool_" + m_nextAudioId;
	m_audioPools[ audioId ] = audioItem;

	// Increment the last audio id
	m_nextAudioId += 1;

	// Return the id
	return audioId;
}

function loadAudio( audioItem, audio ) {

	function audioReady() {
		audioItem.pool.push( {
			"audio": audio,
			"timeout": 0,
			"volume": 1
		} );
		audio.removeEventListener( "canplay", audioReady );
		m_qbResume();
	}

	// Wait until audio item is loaded
	m_qbWait();

	// Wait until audio can play
	audio.addEventListener( "canplay", audioReady );

	// If audio has an error
	audio.onerror = function () {
		var errors, errorCode, index;
		errors = [
			"MEDIA_ERR_ABORTED - fetching process aborted by user",
			"MEDIA_ERR_NETWORK - error occurred when downloading",
			"MEDIA_ERR_DECODE - error occurred when decoding",
			"MEDIA_ERR_SRC_NOT_SUPPORTED - audio/video not supported"
		];

		errorCode = audio.error.code;
		index = errorCode - 1;
		if( index > 0 && index < errors.length ) {
			m_qbData.log( "createAudioPool: " + errors[ index ] );
		} else {
			m_qbData.log( "createAudioPool: unknown error - " + errorCode );
		}
		m_qbResume();
	};

}

// Delete's the audio pool
qbs._.addCommand( "deleteAudioPool", deleteAudioPool, false, false, [
	"audioId"
] );
function deleteAudioPool( args ) {
	var audioId, i;

	audioId = args[ 0 ];

	// Validate parameters
	if( m_audioPools[ audioId ] ) {

		// Stop all the players
		for( i = 0; i < m_audioPools[ audioId ].pool.length; i++ ) {
			m_audioPools[ audioId ].pool[ i ].audio.pause();
		}

		// Delete the audio item from the pools
		delete m_audioPools[ audioId ];
	} else {
		m_qbData.log( "deleteAudioPool: " + audioId + " not found." );
	}
}

// Plays a sound from an audio id
qbs._.addCommand( "playAudioPool", playAudioPool, false, false, [
	"audioId", "volume", "startTime", "duration"
] );
function playAudioPool( args ) {
	var audioId, volume, startTime, duration, audioItem, audio, poolItem;

	audioId = args[ 0 ];
	volume = args[ 1 ];
	startTime = args[ 2 ];
	duration = args[ 3 ];

	// Validate audioId
	if( ! m_audioPools[ audioId ] ) {
		m_qbData.log( "playAudioPool: sound ID " + audioId + " not found." );
		return;
	}

	// Validate volume
	if( volume == null ) {
		volume = 1;
	}

	if( isNaN( volume ) || volume < 0 || volume > 1 ) {
		m_qbData.log(
			"playAudioPool: volume must be a number between 0 and " +
			"1 (inclusive)."
		);
		return;
	}

	// Validate startTime
	if( startTime == null ) {
		startTime = 0;
	}

	if( isNaN( startTime ) || startTime < 0 ) {
		m_qbData.log(
			"playAudioPool: startTime must be a number greater than or " +
			"equal to 0."
		);
		return;
	}

	// Validate duration
	if( duration == null ) {
		duration = 0;
	}

	if( isNaN( duration ) || duration < 0 ) {
		m_qbData.log(
			"playAudioPool: duration must be a number greater than or " +
			"equal to 0."
		);
		return;
	}

	// Get the audio item
	audioItem = m_audioPools[ audioId ];

	// Make sure that there is at least one sound loaded
	if( audioItem.pool.length === 0 ) {
		m_qbData.log( "playAudioPool: sound pool has no sounds loaded." );
		return;
	}

	// Get the audio player
	poolItem = audioItem.pool[ audioItem.index ];
	audio = poolItem.audio;

	// Set the volume
	audio.volume = m_qbData.volume * volume;
	poolItem.volume = volume;

	// Set the start time of the audio
	audio.currentTime = startTime;

	// Stop the audio if duration specified
	if( duration > 0 ) {
		clearTimeout( poolItem.timeout );
		poolItem.timeout = setTimeout( function () {
			audio.pause();
			audio.currentTime = 0;
		}, duration * 1000 );
	}

	// Play the sound
	audio.play();

	// Increment to next sound in the pool
	audioItem.index += 1;
	if( audioItem.index >= audioItem.pool.length ) {
		audioItem.index = 0;
	}
}

qbs._.addCommand( "stopAudioPool", stopAudioPool, false, false, [ "audioId" ] );
function stopAudioPool( args ) {
	var audioId, i, j;

	audioId = args[ 0 ];

	// If audioId not provided then stop all audio pools
	if( audioId == null ) {
		for( i in m_audioPools ) {
			for( j = 0; j < m_audioPools[ i ].pool.length; j += 1 ) {
				m_audioPools[ i ].pool[ j ].audio.pause();
			}
		}
		return;
	}

	// Validate audioId
	if( ! m_audioPools[ audioId ] ) {
		m_qbData.log( "stopAudioPool: audio ID " + audioId + " not found." );
		return;
	}

	// Stop current audio pool
	for( i = 0; i < m_audioPools[ audioId ].pool.length; i += 1 ) {
		m_audioPools[ audioId ].pool[ i ].audio.pause();
	}
}

// Plays a sound by frequency
qbs._.addCommand( "sound", sound, false, false, [
	"frequency", "duration", "volume", "oType", "delay", "attack", "decay"
] );
function sound( args ) {
	var frequency, duration, volume, oType, delay, attack, decay, stopTime,
		types, waveTables, i, j, context;

	frequency = args[ 0 ];
	duration = args[ 1 ];
	volume = args[ 2 ];
	oType = args[ 3 ];
	delay = args[ 4 ];
	attack = args[ 5 ];
	decay = args[ 6 ];

	// Validate frequency
	if( ! qbs.util.isInteger( frequency ) ) {
		m_qbData.log( "sound: frequency needs to be an integer." );
		return;
	}

	// Validate duration
	if( duration == null ) {
		duration = 1;
	}

	if( isNaN( duration ) || duration < 0 ) {
		m_qbData.log(
			"sound: duration needs to be a number equal to or greater than 0."
		);
		return;
	}

	// Validate volume
	if( volume == null ) {
		volume = 1;
	}

	if( isNaN( volume ) || volume < 0 || volume > 1 ) {
		m_qbData.log( "sound: volume needs to be a number between 0 and 1." );
		return;
	}

	// Validate attack
	if( attack == null ) {
		attack = 0;
	}

	if( isNaN( attack ) || attack < 0 ) {
		m_qbData.log(
			"sound: attack needs to be a number equal to or greater than 0."
		);
		return;
	}

	// Validate delay
	if( delay == null ) {
		delay = 0;
	}

	if( isNaN( delay ) || delay < 0 ) {
		m_qbData.log(
			"sound: delay needs to be a number equal to or greater than 0."
		);
		return;
	}

	// Validate decay
	if( decay == null ) {
		decay = 0.1;
	}

	if( isNaN( decay ) ) {
		m_qbData.log( "sound: decay needs to be a number." );
		return;
	}

	// Validate oType
	if( oType == null ) {
		oType = "triangle";
	}

	// Check for custom oType
	if( qbs.util.isArray( oType ) ) {
		if(
			oType.length !== 2 ||
			oType[ 0 ].length === 0 ||
			oType[ 1 ].length === 0 ||
			oType[ 0 ].length != oType[ 1 ].length
		) {
			m_qbData.log(
				"sound: oType array must be an array with two non empty " +
				"arrays of equal length."
			);
			return;
		}

		waveTables = [];

		// Look for invalid waveTable values
		for( i = 0; i < oType.length; i++ ) {
			for( j = 0; j < oType[ i ].length; j++ ) {
				if( isNaN( oType[ i ][ j ] ) ) {
					m_qbData.log(
						"sound: oType array must only contain numbers."
					);
					return;
				}
			}
			waveTables.push( new Float32Array( oType[ i ] ) );
		}

		oType = "custom";
	} else {

		if( typeof oType !== "string" ) {
			m_qbData.log( "sound: oType needs to be a string or an array." );
			return;
		}

		// Non-custom types
		types = [
			"triangle", "sine", "square", "sawtooth"
		];

		if( types.indexOf( oType ) === -1 ) {
			m_qbData.log(
				"sound: oType is not a valid type. oType must be " +
				"one of the following: triangle, sine, square, sawtooth."
			);
			return;
		}
	}

	// Create an audio context if none exist
	if( ! m_audioContext ) {
		context = window.AudioContext || window.webkitAudioContext;
		m_audioContext = new context();
	}

	// Calculate the stopTime
	stopTime = attack + duration + decay;

	return m_qbData.commands.createSound(
		"sound", m_audioContext, frequency, volume, attack, duration,
		decay, stopTime, oType, waveTables, delay
	);
}

// Internal create sound command
qbs._.addCommand( "createSound", createSound, true, false, [] );
function createSound(
	cmdName, audioContext, frequency, volume, attackTime, sustainTime,
	decayTime, stopTime, oType, waveTables, delay
) {
	var oscillator, envelope, wave, real, imag, currentTime, overlap,
		soundId, master;

	oscillator = audioContext.createOscillator();
	envelope = audioContext.createGain();
	master = audioContext.createGain();
	master.gain.value = m_qbData.volume;

	overlap = 0.0001;

	oscillator.frequency.value = frequency;
	if( oType === "custom" ) {
		real = waveTables[ 0 ];
			imag = waveTables[ 1 ];
			wave = audioContext.createPeriodicWave( real, imag );
			oscillator.setPeriodicWave( wave );
	} else {
		oscillator.type = oType;
	}

	if( attackTime === 0 ) {
		envelope.gain.value = volume;
	} else {
		envelope.gain.value = 0;
	}

	oscillator.connect( envelope );
	envelope.connect( master );
	master.connect( audioContext.destination );
	currentTime = audioContext.currentTime + delay + 0.01;

	// Set the attack
	if( attackTime > 0 ) {
		attackTime = Math.floor( attackTime * 10000 ) / 10000;
		envelope.gain.setValueCurveAtTime(
			new Float32Array( [ 0, volume ] ),
			currentTime,
			attackTime
		);

		// Add value to current time to prevent overlap of time curves
		currentTime += overlap;
	}

	// Set the sustain
	if( sustainTime > 0 ) {
		sustainTime = Math.floor( sustainTime * 10000 ) / 10000;
		envelope.gain.setValueCurveAtTime(
			new Float32Array( [ volume, 0.8 * volume ] ),
			currentTime + attackTime,
			sustainTime
		);

		// Add value to current time to prevent overlap of time curves
		currentTime += overlap;
	}

	// Set the decay
	if( decayTime > 0 ) {
		decayTime = Math.floor( decayTime * 10000 ) / 10000;
		envelope.gain.setValueCurveAtTime(
			new Float32Array( [ 0.8 * volume, 0.1 * volume, 0 ] ),
			currentTime + attackTime + sustainTime,
			decayTime
		);
	}

	oscillator.start( currentTime );
	oscillator.stop( currentTime + stopTime );

	soundId = "sound_" + m_nextSoundId;
	m_nextSoundId += 1;
	m_soundPool[ soundId ] = {
		"oscillator": oscillator,
		"master": master,
		"audioContext": audioContext
	};

	// delete sound when done
	setTimeout( function () {
		delete m_soundPool[ soundId ];
	}, ( currentTime + stopTime ) * 1000 );

	return soundId;
}

qbs._.addCommand( "stopSound", stopSound, false, false, [ "soundId" ] );
function stopSound( args ) {
	var soundId, i;

	soundId = args[ 0 ];

	// If soundId not provided then stop all sounds
	if( soundId == null ) {
		for( i in m_soundPool ) {
			m_soundPool[ i ].oscillator.stop( 0 );
		}
		return;
	}

	// Validate soundId
	if( ! m_soundPool[ soundId ] ) {
		//m_qbData.log( "stopSound: sound ID " + soundId + " not found." );
		return;
	}

	// Stop current sound
	m_soundPool[ soundId ].oscillator.stop( 0 );
}

qbs._.addCommand( "setVolume", setVolume, false, false, [ "volume" ] );
qbs._.addSetting( "volume", setVolume, false, [ "volume" ] );
function setVolume( args ) {
	var volume, i, j, poolItem;

	volume = args[ 0 ];

	if( isNaN( volume ) || volume < 0 || volume > 1 ) {
		m_qbData.log(
			"setVolume: volume needs to be a number between 0 and 1."
		);
		return;
	}

	m_qbData.volume = volume;

	// Update all active sounds
	for( i in m_soundPool ) {
		if( volume === 0 ) {

			// Set to near zero exponentially
			m_soundPool[ i ].master.gain.exponentialRampToValueAtTime(
				0.01, m_soundPool[ i ].audioContext.currentTime + 0.1
			);

			// Set to zero one milisecond later
			m_soundPool[ i ].master.gain.setValueAtTime(
				0, m_soundPool[ i ].audioContext.currentTime + 0.11
			);
		} else {
			m_soundPool[ i ].master.gain.exponentialRampToValueAtTime(
				volume, m_soundPool[ i ].audioContext.currentTime + 0.1
			);
		}
	}

	// Update all audio pools
	for( i in m_audioPools ) {
		for( j in m_audioPools[ i ].pool ) {
			poolItem = m_audioPools[ i ].pool[ j ];
			poolItem.audio.volume = m_qbData.volume * poolItem.volume;
		}
	}
}

// End of File Encapsulation
} )();
/*
* File: qbs-screen-images.js
*/

// Start of File Encapsulation
( function () {

	"use strict";
	
	var m_qbData, m_tracks, m_notesData, m_allNotes;

	m_qbData = qbs._.data;

	m_notesData = {
		"A": [ 27.50, 55.00,
			110, 220, 440, 880, 1760, 3520, 7040, 14080
		],
		"A#": [ 29.14, 58.27,
			116.541, 233.082, 466.164, 932.328, 1864.655, 3729.31, 7458.62,
			14917.24
		],
		"B": [ 30.87, 61.74,
			123.471, 246.942, 493.883, 987.767, 1975.533, 3951.066, 7902.132,
			15804.264
		],
		"C": [ 16.35, 32.70, 
			65.41, 130.813, 261.626, 523.251, 1046.502, 2093.005, 4186.009,
			8372.018
		],
		"C#": [ 17.32, 34.65,
			69.296, 138.591, 277.183, 554.365, 1108.731, 2217.461, 4434.922,
			8869.844
		],
		"D": [ 18.35, 36.71,
			73.416, 146.832, 293.665, 587.33, 1174.659, 2349.318, 4698.636,
			9397.272
		],
		"D#": [ 19.45, 38.89, 
			77.782, 155.563, 311.127, 622.254, 1244.508, 2489.016, 4978.032,
			9956.064
		],
		"E": [ 20.60, 41.20,
			82.407, 164.814, 329.628, 659.255, 1318.51, 2637.021, 5274.042,
			10548.084
		],
		"F": [ 21.83, 43.65,
			87.307, 174.614, 349.228, 698.456, 1396.913, 2793.826, 5587.652,
			11175.304
		],
		"F#": [ 23.12, 46.25,
			92.499, 184.997, 369.994, 739.989, 1479.978, 2959.955, 5919.91,
			11839.82
		],
		"G": [ 24.50, 49.00,
			97.999, 195.998, 391.995, 783.991, 1567.982, 3135.964, 6271.928,
			12543.856
		],
		"G#": [ 25.96, 51.91,
			103.826, 207.652, 415.305, 830.609, 1661.219, 3322.438,
			6644.876, 13289.752
		]
	};
	m_allNotes = [
		0, 16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50,
		29.14, 30.87, 32.70, 34.65, 36.71, 38.89, 41.20, 43.65, 46.25, 49.00,
		51.91, 55.00, 58.27, 61.74,
		65.406, 69.296, 73.416, 77.782, 82.407, 87.307, 92.499, 97.999,
		103.826, 110, 116.541, 123.471, 130.813, 138.591, 146.832, 155.563,
		164.814, 174.614, 184.997, 195.998, 207.652, 220, 233.082, 246.942,
		261.626, 277.183, 293.665, 311.127, 329.628, 349.228, 369.994, 391.995,
		415.305, 440, 466.164, 493.883, 523.251, 554.365, 587.33, 622.254,
		659.255, 698.456, 739.989, 783.991, 830.609, 880, 932.328, 987.767,
		1046.502, 1108.731, 1174.659, 1244.508, 1318.51, 1396.913, 1479.978,
		1567.982, 1661.219, 1760, 1864.655, 1975.533, 2093.005, 2217.461,
		2349.318, 2489.016, 2637.021, 2793.826, 2959.955, 3135.964, 3322.438,
		3520, 3729.31, 3951.066, 4186.009, 4434.922, 4698.636, 4978.032,
		5274.042, 5587.652, 5919.91, 6271.928, 6644.876, 7040, 7458.62,
		7902.132, 8372.018, 8869.844, 9397.272, 9956.064, 10548.084, 11175.304,
		11839.82, 13289.752, 14080, 14917.24, 15804.264
	];
	m_tracks = [];

	//qbs._.addCommand( "createTrack", createTrack, false, false, [ "playString" ] );
	function createTrack( args ) {
		var tracksStrings, playString, regString, reg, trackParts, i, j, k,
			trackId, index, trackIds, waveTables, start, end;
	
		playString = args[ 0 ];

		if( typeof playString !== "string" ) {
			m_qbData.log( "play: playString needs to be a string." );
			return;
		}

		// Convert the commands to uppercase and remove spaces
		playString = playString.split( /\s+/ ).join( "" ).toUpperCase();

		// Find wavetables
		waveTables = [];
		start = 0;
		while( start > -1 ) {
			start = playString.indexOf( "[[" );
			if( start > -1 ) {
				end = playString.indexOf( "]]", start );
				waveTables.push( playString.substring( start, end + 2 ) );
				i = waveTables.length - 1;
				playString = playString.replace(
					waveTables[ i ], "W" + i
				);
			}
		}

		// Convert wavetables to array
		for( i = 0; i < waveTables.length; i++ ) {
			waveTables[ i ] = JSON.parse( waveTables[ i ] );

			// Validate wavetable
			if(
				waveTables[ i ].length !== 2 || 
				waveTables[ i ][ 0 ].length !== waveTables[ i ][ 1 ].length
			) {
				
				waveTables[ i ] = "triangle";
				m_qbData.log( "play: wavetables in playstring must have 2 " +
					"arrays of the same length. Defaulting to triangle wave."
				);
				continue;
			}

			// Loop through all the values and make sure they are a number
			for( j = 0; j < 2; j += 1 ) {
				for( k = 0; k < waveTables[ i ][ j ].length; k++ ) {
					// Make sure value is a number
					waveTables[ i ][ j ][ k ] = parseFloat(
						waveTables[ i ][ j ][ k ]
					);
					if( isNaN( waveTables[ i ][ j ][ k ] ) ) {
						waveTables[ i ][ j ][ k ] = 0;
					}
				}
				waveTables[ i ][ j ] = new Float32Array( waveTables[ i ][ j ] );
			}
		}

		// Split the tracks by commas
		tracksStrings = playString.split( "," );
		trackIds = [];

		// Regular expression for the play command string
		regString = "" + 
			"(?=WS|WQ|WW|WT|W\\d[\\d]?|V\\d|Q\\d|O\\d|\\<|\\>|N\\d\\d?|" +
			"L\\d\\d?|MS|MN|ML|MU\\d|MU\\-\\d|MK\\d[\\d]?[\\d]?|" +
			"MZ\\d[\\d]?[\\d]?|MX\\d[\\d]?[\\d]?|MY\\d[\\d]?[\\d]?|" +
			"MW|P[\\d]?|T\\d|" + 
			"[[A|B|C|D|E|F|G][\\d]?[\\+|\\-|\\#|\\.\\.?]?)";
		reg = new RegExp( regString );

		for( i = 0; i < tracksStrings.length; i++ ) {

			// Replace complex parts with small symbols
			tracksStrings[ i ] = tracksStrings[ i ].replace(
				/SINE/g, "WS"
			);
			tracksStrings[ i ] = tracksStrings[ i ].replace(
				/SQUARE/g, "WQ"
			);
			tracksStrings[ i ] = tracksStrings[ i ].replace(
				/SAWTOOTH/g, "WW"
			);
			tracksStrings[ i ] = tracksStrings[ i ].replace(
				/TRIANGLE/g, "WT"
			);

			// Replace symbols with conflicts
			tracksStrings[ i ] = tracksStrings[ i ].replace( /MD/g, "MZ" );
			tracksStrings[ i ] = tracksStrings[ i ].replace( /MA/g, "MY" );
			tracksStrings[ i ] = tracksStrings[ i ].replace( /MT/g, "MX" );
			tracksStrings[ i ] = tracksStrings[ i ].replace( /MF/g, "MW" );
			tracksStrings[ i ] = tracksStrings[ i ].replace( /MO/g, "MU" );

			// Replace custom wave table
			trackParts = tracksStrings[ i ].split( reg );

			m_tracks.push( {
				"audioContext": new AudioContext(),
				"notes": [],
				"noteId": 0,
				"decayRate": 0.20,
				"attackRate": 0.15,
				"sustainRate": 0.65,
				"fullNote": false,
				"extra": 1,
				"space": "normal",
				"interval": 0,
				"time": 0,
				"tempo": 60 / 120,
				"noteLength": 0.25,
				"pace": 0.875,
				"octave": 4,
				"octaveExtra": 0,
				"volume": 1,
				"trackIds": trackIds,
				"type": "triangle",
				"waveTables": waveTables,
				"sounds": []
			} );
			trackId = m_tracks.length - 1;
			trackIds.push( trackId );
			for( j = 0; j < trackParts.length; j++ ) {
				index = trackParts[ j ].indexOf( "-" );

				// Only split the minus symbol if is not a music note
				if(
					index > -1 && 
					"ABCDEFG".indexOf( trackParts[ j ][ 0 ] ) === -1 
				) {
					m_tracks[ trackId ].notes.push( [
						trackParts[ j ].substr( 0, index ),
						trackParts[ j ].substr( index )
					] );
				} else {
					m_tracks[ trackId ].notes.push(
						trackParts[ j ].split( /(\d+)/ )
					);
				}
			}

		}

		return trackId;
	}

	function setTrackDefaults( track ) {
		track.noteId = 0;
		track.decayRate = 0.2;
		track.sustainRate = 0.65;
		track.fullNote = false;
		track.extra = 1;
		track.space = "normal";
		track.interval = 0;
		track.time = 0;
		track.tempo = 60 / 120;
		track.noteLength = 0.25;
		track.pace = 0.875;
		track.octave = 4;
		track.octaveExtra = 0;
		track.volume = 1;
		track.type = "triangle";
	}

	qbs._.addCommand( "play", play, false, false, [ "playString" ] );
	function play( args ) {
		var playString, trackId, trackId2, i;
	
		playString = args[ 0 ];

		if( typeof playString === "string" ) {
			trackId = createTrack( [ playString ] );
		} else if( qbs.util.isInteger( playString ) ) {
			trackId = playString;
			setTrackDefaults( m_tracks[ trackId ] );
		}

		if( m_tracks[ trackId ] ) {
			for( i = 0; i < m_tracks[ trackId ].trackIds.length; i++ ) {
				trackId2 = m_tracks[ trackId ].trackIds[ i ];
				m_tracks[ trackId2 ].noteId = 0;
				playTrack( trackId2 );
			}
		} else {
			m_qbData.log( "Playstring needs to be a string or a integer" );
		}

		return trackId
	}

	qbs._.addCommand( "stopPlay", stopPlay, false, false, [ "trackId" ] );
	function stopPlay( args ) {
		var trackId, i, trackIds, j;

		trackId = args[ 0 ];

		// Stop all tracks and substracks
		if( trackId == null ) {
			for( i = 0; i < m_tracks.length; i++ ) {
				for( j = 0; j < m_tracks[ i ].sounds.length; j++ ) {
					m_qbData.commands.stopSound( [ m_tracks[ i ].sounds[ j ] ] );
				}
			}
			m_tracks = [];

			return;
		}

		// Validate soundId
		if( ! m_tracks[ trackId ] ) {
			m_qbData.log( "stopPlay: track ID " + trackId + " not found." );
			return;
		}

		// Need to stop all sub tracks as well as main track
		trackIds = m_tracks[ trackId ].trackIds;
		for( i = 0; i < trackIds.length; i++ ) {
			for( j = 0; j < m_tracks[ trackIds[ i ] ].sounds.length; j++ ) {
				m_qbData.commands.stopSound( [ m_tracks[ trackIds[ i ] ].sounds[ j ] ] );
			}
			m_tracks[ trackIds[ i ] ] = null;
		}
	}

	function playTrack( trackId ) {
		var track, cmd, note, frequency, val, wait, octave;

		frequency = 0;
		track = m_tracks[ trackId ];
		if( track.noteId >= track.notes.length ) {
			return;
		}

		cmd = track.notes[ track.noteId ];
		wait = false;
		track.extra = 0;
		switch( cmd[ 0 ].charAt( 0 ) ) {
			case "A": 
			case "B":
			case "C":
			case "D":
			case "E":
			case "F":
			case "G":
				note = cmd[ 0 ];

				// + is the same as sharp
				note = note.replace( /\+/g, "#" );

				// Replace flats
				note = note.replace( "C-", "B" );
				note = note.replace( "D-", "C#" );
				note = note.replace( "E-", "D#" );
				note = note.replace( "G-", "F#" );
				note = note.replace( "A-", "G#" );
				note = note.replace( "B-", "A#" );

				// Replace Duplicate Sharps
				note = note.replace( "E#", "F" );
				note = note.replace( "B#", "C" );

				// Check for extra note length
				if( cmd.indexOf( ".." ) > 0 ) {
					track.extra = 1.75 * track.noteLength;
				} else if( cmd.indexOf( "." ) > 0 ) {
					track.extra = 1.5 * track.noteLength;
				}

				// Remove dot's from note
				note = note.replace( /\./g, "" );

				// Get the note frequency
				if( m_notesData[ note ] ) {
					octave = track.octave + track.octaveExtra;
					if( octave < m_notesData[ note ].length ) {
						frequency = m_notesData[ note ][ octave ];
					}
				}

				// Check if note length included
				if( cmd.length > 1 && cmd[ 1 ].indexOf( "." ) === -1 ) {
					val = getInt( cmd[ 1 ], 1 );
					track.extra = getNoteLength( val );
				}

				wait = true;
				break;
			case "N":
				val = getInt( cmd[ 1 ], 0 );
				if( val >= 0 && val < m_allNotes.length ) {
					frequency = m_allNotes[ val ];
				}
				wait = true;
				break;
			case "O":
				val = getInt( cmd[ 1 ], 4 );
				if( val >= 0 && val < m_notesData[ "A" ].length ) {
					track.octave = val;
				}
				break;
			case ">":
				track.octave += 1;
				if( track.octave >= m_notesData[ "A" ].length ) {
					track.octave = m_notesData[ "A" ].length - 1;
				}
				break;
			case "<":
				track.octave -= 1;
				if( track.octave < 0 ) {
					track.octave = 0;
				}
				break;
			case "L":
				val = getInt( cmd[ 1 ], 1 );
				track.noteLength = getNoteLength( val );
				break;
			case "T":
				val = getInt( cmd[ 1 ], 120 );
				if( val >= 32 && val < 256 ) {
					track.tempo = 60 / val;
				}
				break;
			case "M":
				switch( cmd[ 0 ] ) {
					case "MS":
						// Staccato
						track.pace = 0.75;
						break;
					case "MN":
						// Normal
						track.pace = 0.875;
						break;
					case "ML":
						// Legato
						track.pace = 1;
						break;
					case "MU":
						// Modify Octave
						val = getInt( cmd[ 1 ], 0 );
						track.octaveExtra = val;
						break;
					case "MY": 
						// Modify Attack Rate
						val = getInt( cmd[ 1 ], 25 );
						track.attackRate = val / 100;
						break;
					case "MX": 
						// Modify Sustain Rate
						val = getInt( cmd[ 1 ], 25 );
						track.sustainRate = val / 100;
						break;
					case "MZ":
						// Modify Decay Rate
						val = getInt( cmd[ 1 ], 25 );
						track.decayRate = val / 100;
						break;
					case "MW":
						// Play full note
						track.fullNote = ! track.fullNote;
						break;
				}
				break;
			case "P":
				wait = true;
				val = getInt( cmd[ 1 ], 1 );
				track.extra = getNoteLength( val );
				break;
			case "V":
				val = getInt( cmd[ 1 ], 50 );
				if( val < 0 ) {
					val = 0;
				} else if( val > 100 ) {
					val = 100;
				}
				track.volume = val / 100;
				break;
			case "W":
				if( cmd[ 0 ] === "WS" ) {
					track.type = "sine";
				} else if( cmd[ 0 ] === "WQ" ) {
					track.type = "square";
				} else if( cmd[ 0 ] === "WW" ) {
					track.type = "sawtooth";
				} else if( cmd[ 0 ] === "WT" ) {
					track.type = "triangle";
				} else {

					// Custom wavetable
					val = getInt( cmd[ 1 ], -1 );
					if( track.waveTables[ val ] ) {
						track.type = val;
					}
				}
				break;
		}

		// Calculate when to play the next note
		if( track.extra > 0 ) {
			track.interval = track.tempo * track.extra * track.pace * 4;
		} else {
			track.interval = track.tempo * track.noteLength * track.pace * 4;
		}

		// If it's a note then play it
		if( frequency > 0 ) {
			playNote( track, frequency );
		}

		// Move to the next instruction
		track.noteId += 1;

		// Check if we are done playing track
		if( track.noteId < track.notes.length ) {
			if( wait ) {
				track.time += track.interval;
			}
			playTrack( trackId );
		} else {
			setTimeout( function () {
				if( m_tracks[ trackId ] ) {
					removeTrack( trackId );
				}
			}, ( track.time + track.interval ) * 1000 );
		}
	}

	function removeTrack( trackId ) {
		var i, trackIds;
		
		// Need to stop all sub tracks as well as main track
		trackIds = m_tracks[ trackId ].trackIds;
		for( i = trackIds.length; i >= 0; i-- ) {
			m_tracks.splice( trackIds[ i ], 1 );
		}
	}

	function getNoteLength( val ) {
		if( val >= 1 && val < 65 ) {
			return 1 / val;
		}
		return 0.875;
	}

	function playNote( track, frequency ) {
		var attackTime, sustainTime, decayTime, volume, waveTables, oType,
			stopTime;

		volume = track.volume;
		attackTime = track.interval * track.attackRate;
		sustainTime = track.interval * track.sustainRate;
		decayTime = track.interval * track.decayRate;

		if(
			track.fullNote && 
			attackTime + sustainTime + decayTime > track.interval
		) {
			stopTime = track.interval;
		} else {
			stopTime = attackTime + sustainTime + decayTime;
		}

		if( typeof track.type === "string" ) {
			oType = track.type;
			waveTables = null;
		} else {
			waveTables = track.waveTables[ track.type ];
			if( qbs.util.isArray( waveTables ) ) {
				oType = "custom";
			} else {
				oType = waveTables;
				waveTables = null;
			}
		}

		track.sounds.push(
			m_qbData.commands.createSound(
				"play", track.audioContext, frequency, volume, attackTime,
				sustainTime, decayTime, stopTime, oType, waveTables, track.time 
			) 
		);
	}

	function getInt( val, val_default ) {
		val = parseInt( val );
		if( isNaN( val ) ) {
			val = val_default;
		}
		return val;
	}

// End of File Encapsulation
} )();
( function () {
"use strict";

qbs._.data.commands.loadFont( [ 
"0,14004,2602800,oidnrt,3po8cff,3vnhgs4,1uv77og,3hpuv70,0,3vjgoef,3o00000,0,0,0,0,1s,29si9do,19fvt51,31ovfn3,cevfh,31vrooc,1tv52h8,2g0kula,2d2hcsp,8r2jg0,3vvvj,f33opv,8efh0g,3ho84fj,2200idv,2c40237,3r4g000,0,0,0,0,0,g8420,22h800,57p9,3p80ea7,237000i,889019,111cc02,0,88420g,g4211,28oc,140011o,1000000,11000,1s00000,400,3333100,sjam9o,1g8423,203i889,1u060ho,hg0654,2fgg1sg,1s2f01p,3p4e07,31hhgo0,oi64hg,1h4e13,31g0c,o00100,gg444,41000v,v0010,1088803,2110080,sqb41o,1h4if4,20729oi,1o07421,1o0s94,19701sg,1sgf03p,3p0g03,384p4c0,14if4i8,1o8423,201o84i,s04ihg,2h40842,43o12r,1ul8g25,2blej03,28ka4s0,s97i10,1h4ib3,10729oi,140321g,ho0v21,21014i,14i6025,a4k404,1al9ok0,12a22i4,24k421,7g8og,1s06210,21g1gc3,30g0c2,42300g,2g00000,1v,o40000,1o2f3,10210s9,s003i1,1o0211,251g00c,14s700g,23gg800,6kjo4s,ge4i94,8021,g04,1884218,3180421,21000a,1ul8g01,3294i00,64i8o0,c5310,200ca30,2102ok8,g003j0,3jo0023,221000i,14i6g00,24k400,8lbsk0,a2118,14i70,2e01s44,u02230,20g0630,31g082,622019,1000001,74a5u0,16g9hgd,3ko16jf,3001si8,u0gngf,rs0000,1o,ocv003,30qdv00,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0",
6, 6, null, false, true 
] );

qbs._.data.commands.loadFont( [ 
"0,ugs,3gvtm2u,1tvmss7,vtskvf,2v710g0,g8efjg,21008e2,vfl8gs,g8e77p,311o003,f7hg00,3vvpoc7,vvu045,h8igg0,3v1mrdm,3efu71h,1ep4i8o,oi94hg,33oof4j,34233hg,u97i95,cq08mn,2pspiqc,21gsfn3,400233,2v3go40,gsv213,3jggka5,a50180,1val6h8,2h80e9j,94hj4s,3p,3jo08ef,24fjghv,gsvah0,2100842,lfjgg0,82fgg,2000044,v41000,8421,3g00098,1voa800,8477r,3g000vf,2e21000,0,8e7,4200g0,18ka000,kaf,2afih80,gug70b,33000p9,442ac0,gk4aki,1380844,0,ggg841,100g41,211100,k4fh1,1000021,fh0g00,0,2110000,f00000,0,210000g,2222200,1p2jamb,jg08ca,4213s0,1p21332,no0sh0,260k9o0,8ca97o,11o1ug8,u0k9o0,oggf4a,jg1uh1,442100,1p2h74a,jg0sh8,2f0g9o0,84000,2100042,10gg,888820,20g000f,2007o00,10820gg,2200sh0,22200g0,1p2nalq,3g08a8,2hfka40,3oi9729,ng0c98,g828o0,3oi94i9,ng1u94,e42bs0,3si8721,700c98,g9i8s0,252hfka,k80s42,4211o0,s4214i,1301ia5,c52j60,3gg8421,no12ra,2l8ka40,25il9ka,k80sh8,2h8k9o0,3oi9721,700sh8,2h8l9o3,3oi9731,1680sh8,e0k9o0,3ta4210,23g12h8,2h8k9o0,252h8k9,11012h8,2lal980,24ka22h,14812h5,4211o0,3t22222,no1og8,g843g0,210820g,g41o42,4213g0,gkh8g0,0,1v,g82000,7,17k9u0,30g8539,lg0007,h849o0,c216kq,1jc0007,hfk1o0,oi8e21,700006,2h8jo5s,30ga6i9,m80806,4211o0,4030ga,k9pg84,2a62h40,1g84210,23g000d,lalak0,mcka,k80007,h8k9o0,u4i9,323g006,2i93g8e,r6i1,700007,2g70bo0,10gu421,hg0008,2h8kpk0,h8k9,1100008,2lal980,h511,1480008,2h8jo5s,v111,7o0642,o210c0,g84010,2101g42,321300,15c0000,45,h8kbs0,1p2g8jg,309o0i0,i94hs0,o0e8nq,3g0sh6,274hs0,240c13i,13o0o06,274hs0,g0c13i,13o0007,g83gcc,1p2e8nq,3g1207,hfk1o0,1g0e8nq,3g1406,4211o0,1p2c210,23g0o06,4211o0,248a8nq,k80840,e8nq40,c0v43h,7o000c,267khk0,skifki,14o08a0,e8k9o0,12074a,jg0g40,e8k9o0,gk08ka,jg0g40,h8k9o0,1208k9,3g9p245,h8igg0,240h8ka,jg0847,2g83og8,oi8e22,ng12af,24fh0g0,3ome4it,if4c52,e212go,o0c13i,13o0c06,4211o0,88074a,jg0022,h8k9o0,1lc0f4a,k80qj0,pakq40,1p4i7g3,3g00oi9,c07g00,g04442,jg0000,v84000,fg8,g00iq6,r5cecv,15kbdiq,3s84080,842100,aaa2g,2g000k5,555000,1348p26,1268ll5,1l5d9ba,3ctreup,3erm842,4210g8,g84270,210g84e,4e10g8,ka52n8,2h8k000,fh8ka,s270,210ga5e,21eh8ka,ka52h8,2h8k00f,21eh8ka,kat0no,a52,25fg000,g8s270,0,e10g8,g8421s,842,4fo000,7s,210g842,43p0g8,7s,842,4fp0g8,g87i1s,210ga52,252p8ka,ka5i1s,3,342p8ka,katg7s,f,30ep8ka,ka5i1c,2h8k00f,30fo000,katg7c,2h8k84f,30fo000,ka52ns,f,30fp0g8,7s,2h8ka52,253o000,g87i1s,3,343p0g8,1s,2h8ka52,25fp8ka,g8vi7s,210g842,4e0000,1s,210hvvv,3vvvvvv,7v,3vvvose,se73ho,e73hos,1osfvvv,3vg0000,cqki,2i400e8,2u8ni10,1uh842,4000fq,252h8k0,3t28322,no0007,2ka5100,i94jl,2200cp,2210g80,3s8e8k9,313sc98,1voa8o0,oigoa9,mc0e83,f8c5s0,impdd,g00117,2iqbp10,oggf41,1g0sh8,2h8ka40,v07o1,3o0084f,24203s0,g41110,7o0888,8203s0,c94i10,210g842,4252go,oc0fo0,31g00cp,206co00,oi9300,0,630000,1g,721,216h8c,3h4i94g,oi2,8f0000,e73h,3000000",
6, 8, null, false, true 
] );

qbs._.data.commands.loadFont( [ 
"0,0,1v839c1,2upj0bu,1vfvmvv,31ufvru,1mftvnu,1u3g400,83gv7u,1u3g400,s7oe7u,3v7oe3s,810e3s,3v7oe3s,61s,u1g000,3vvvpu3,31ufvvv,3opi2,116cf00,3vs76dt,2upjgvv,7ge3rt,36cpj3o,u6cpj6,u1gvgo,vj6fpg,o71s70,1vm6vr3,1hmfpm0,2clkf77,3jjomkp,20e1u7u,3se1000,10sfnu,v0s0g0,c3ovgo,c7sf0o,1j6cpj6,1j00pg0,1vtnmrr,dhm6o0,v66e3c,1m3hj3o,0,1v7svg0,c3ovgo,1v3o67v,c3ovgo,c1g600,c1g60o,1v3o600,1g37u,61g000,30o7u,1g30000,1g60,30fs000,28pnv,1j28000,1gf3u,3vvu000,fvvru,u1g000,0,0,o7gu1g,o00c00,1m6or00,0,1m6pvjc,3v6or00,o7pg3o,6fgc00,cdj0o,o6dhg0,s6oe3m,3ecotg0,1g61g00,0,c30o30,1g30600,1g3060o,c30o00,6cf7v,u6c000,30c7s,o30000,0,30c30,7s,0,0,30c00,30o61g,1gc1000,1ucdjmu,3recv00,o70c1g,o31v00,1sco31o,1gcpv00,1sco31o,6cou00,e3or6c,3v0o7g0,3uc1u0c,6cou00,s61g7o,36cou00,3uco30o,o30c00,1scpj3o,36cou00,1scpj3s,61gs00,30c00,30c00,30c00,30c30,c30o60,1g30600,1v00,fo000,1g3060c,c30o00,1sco30o,o00c00,1ucdnmu,3fc0u00,o7hj6c,3ucpj00,3u6cpjs,1j6dv00,u6dg60,306cf00,3s6opj6,1j6pu00,3v64q3o,1k65vg0,3v64q3o,1k61s00,u6dg60,376cfg0,36cpj7s,36cpj00,1s30c1g,o30u00,f0o30c,36cou00,3j6cr3o,1m6dpg0,3o60o30,1h6dvg0,33etvnu,3bcdhg0,33edtmu,37cdhg0,s6phm6,336oe00,3u6cpjs,1g61s00,1scpj6c,3e7g700,3u6cpjs,1m6dpg0,1scpo3g,ecou00,3ub8c1g,o30u00,36cpj6c,36cpv00,36cpj6c,367gc00,33cdhmm,3vethg0,33ccr1o,s6phg0,36cpj3o,o30u00,3vcd30o,p6dvg0,1s60o30,1g60u00,3060c0o,60c0g0,1s1g60o,c1gu00,83gr66,0,0,7v,o30600,0,u0c,1ucotg0,3g60o3s,1j6dn00,u6c,30cou00,e0o33s,36cotg0,u6c,3uc0u00,s6oo7g,1g61s00,tmc,367o37o,3g60r3m,1j6dpg0,o00s1g,o30u00,60030c,6cpj3o,3g60pjc,1s6ppg0,1o30c1g,o30u00,1j7u,3vddhg0,1u6c,36cpj00,u6c,36cou00,1n36,1j7oo7g,tmc,367o30u,1n3m,1j61s00,v60,1s0pu00,830v1g,o38600,1j6c,36cotg0,1j6c,367gc00,1hmm,3vfsr00,1hjc,s6phg0,1j6c,367o37o,1v4o,o69v00,e30c70,o30700,c1g600,c1g600,3g30c0s,o31o00,1rdo000,0,10e3c,33cdvg0,1scpg6c,1s1g33o,co06c,36covg0,e00u6c,3uc0u00,1vc6f06,v6cfo0,3600u0c,1ucovg0,3g00u0c,1ucovg0,o30u0c,1ucovg0,u60,307g31o,1vc6f36,1v60f00,3600u6c,3uc0u00,3g00u6c,3uc0u00,3600s1g,o30u00,1ucce0o,c1gf00,3g00s1g,o30u00,333gr66,3vcdhg0,o3003o,36fpj00,e01v30,1s61v00,voc,1vsovo0,v6pj7u,36cpjg0,1sco03o,36cou00,co03o,36cou00,e003o,36cou00,1sco06c,36covg0,e006c,36covg0,co06c,367o37o,31hgf36,1j3o600,3601j6c,36cou00,c1gvm0,307s60o,s6op7g,1gedv00,36cou7s,ofoc1g,3scpj7q,33cvhm7,71m61s,c1hm3g,e00u0c,1ucovg0,s00s1g,o30u00,1o03o,36cou00,1o06c,36covg0,fg07o,36cpj00,3u01j7c,3udpj00,u6or1u,7s000,s6or1o,7o000,o00c30,30cou00,7s,30c0000,7s,60o000,31sdj6u,pmdj0f,31sdj6r,rmvjo3,c1g00o,c1g600,36pmc,1j36000,cophj,1jco000,h8g8k8,h8g8k8,1aqklda,1aqklda,3dnfmve,3dnfmve,c1g60o,c1g60o,c1g60o,3s1g60o,c1hu0o,3s1g60o,r3cdhm,3r3cdhm,0,3v3cdhm,1u0o,3s1g60o,r3dtg6,3r3cdhm,r3cdhm,r3cdhm,1vg6,3r3cdhm,r3dtg6,3v00000,r3cdhm,3v00000,c1hu0o,3s00000,0,3s1g60o,c1g60o,fg0000,c1g60o,3vg0000,0,3vhg60o,c1g60o,fhg60o,0,3vg0000,c1g60o,3vhg60o,c1g7oo,fhg60o,r3cdhm,rjcdhm,r3cdpg,vg0000,fpg,rjcdhm,r3dto0,3vg0000,1vo0,3rjcdhm,r3cdpg,rjcdhm,1vo0,3vg0000,r3dto0,3rjcdhm,c1hvo0,3vg0000,r3cdhm,3vg0000,1vo0,3vhg60o,0,3vjcdhm,r3cdhm,vg0000,c1g7oo,fg0000,7oo,fhg60o,0,vjcdhm,r3cdhm,3vjcdhm,c1hvoo,3vhg60o,c1g60o,3s00000,0,fhg60o,3vvvvvv,3vvvvvv,0,3vvvvvv,3of1s7g,3of1s7g,7gu3of,7gu3of,3vvvvvv,0,tms,34dotg0,7hj7o,36fhg60,fpj60,30c1g00,fsr3c,1m6or00,3ucoo1g,1gcpv00,vmo,3cdgs00,6cpj6,1j7oo60,7dn0o,c1g600,3u30u6c,367gc7s,s6phnu,336oe00,s6phm6,1m6prg0,e3063s,36cou00,vmr,3dns000,30ovmr,3dnso60,s61g7o,3060e00,1scpj6c,36cpj00,fo07s,fo000,o31v1g,o01v00,1g3061g,1g01v00,c30o1g,c01v00,71m6oo,c1g60o,c1g60o,cdhm3g,o3007s,30c00,7dn00,1rdo000,s6or1o,0,o,c00000,0,c00000,7go30c,3m6of0s,1s6or3c,1m00000,1o1gc30,1s00000,f1s,u3o000",
8, 8, null, false, true 
] );

qbs._.data.commands.loadFont( [ 
"0,0,0,0,1v839c1,20rr6c1,1v00000,vnv,3dvvvu3,3jvuvg0,0,6pvnu,3vfsv1o,800000,g,s7pvjs,s10000,0,c3of77,3jue60o,u00000,61s,1vfvvru,c1gf00,0,o,u3o600,0,3vvvvvv,3vufgu3,3jvvvvv,3vvu000,f36,1144phs,0,3vvvvvv,31pjfdt,2cs7vvv,3vvu000,f0s6hi,1scpj6c,1s00000,f36,1j6cf0o,1v1g600,0,vj6fpg,o30s7g,3g00000,vr3,1vm6or3,1jufpm0,0,c1hmps,3jjpmoo,c00000,1060,3gfhvno,3gc1000,0,10c3hu,3v3s3g6,100000,61s,1v1g60o,1v3o600,0,1j6cpj6,1j6c036,1j00000,vur,3dtmuor,dhm6o0,3s,3360e3c,33ccr1o,6ccv00,0,0,3vftvg0,0,c3ovgo,c1gvhs,c7s000,61s,1v1g60o,c1g600,0,c1g60o,c1gvhs,c00000,0,c0pvgc,c00000,0,c30,3v60c00,0,0,c1g60,3v00000,0,a3c,3v6oa00,0,g,s3gv3s,3vfs000,0,ftvjs,1u3ge0g,0,0,0,0,0,c3of1s,c1g00o,c00000,6cpj6,i00000,0,0,1m6pvjc,1m6pvjc,1m00000,c1gv66,31c0v06,23ccv0o,c00000,1gm6,61gc36,3300000,e3c,1m3gtms,36cotg0,1g,o30o00,0,0,30o,o30c1g,o1g300,0,o1g30c,60o30o,o00000,0,1j3pvps,1j00000,0,60o,1v1g600,0,0,0,c1g61g,0,0,3v00000,0,0,0,1g600,0,10c30o,o61g40,0,v66,37dttn6,33ccv00,0,c3gu0o,c1g60o,1v00000,v66,30o61g,1gcdvg0,0,1ucc1g6,u0c1m6,1u00000,30s,u6pj7u,60o7g0,0,3vc1g60,3u0c1m6,1u00000,e30,30c1v66,33ccv00,0,3vcc1gc,c30c1g,o00000,v66,33ccv66,33ccv00,0,1ucdhm6,1v0c1gc,1s00000,o,c00000,c1g000,0,1g600,60o,o00000,1gc,c30o1g,c0o1g0,0,3u,vg0,0,o1g,c0o1gc,c30o00,0,1ucdhgc,c1g00o,c00000,v66,33dtnmu,3ec0v00,0,83gr66,33fthm6,3300000,1v36,1j6cv36,1j6dv00,0,u6dgm0,30c1gj6,u00000,1u3c,1j6cpj6,1j6pu00,0,3v6coj8,1s6goj6,3v00000,1vj6,1h6gu38,1g61s00,0,u6dgm0,30dthj6,t00000,1hm6,33cdvm6,33cdhg0,0,u1g60o,c1g60o,u00000,7gc,60o30c,36cou00,0,3j6cr3c,1s6or36,3j00000,1s30,1g60o30,1h6dvg0,0,33etvnu,3bcdhm6,3300000,1hn6,3rftnme,33cdhg0,0,s6phm6,33cdhjc,s00000,1v36,1j6cv30,1g61s00,0,1ucdhm6,33ddnjs,60s000,1v36,1j6cv3c,1j6dpg0,0,1ucdhj0,s0phm6,1u00000,vju,1d1g60o,c1gf00,0,33cdhm6,33cdhm6,1u00000,1hm6,33cdhm6,1m3g400,0,33cdhm6,3bddvjs,1m00000,1hm6,1m3ge1o,1mcdhg0,0,1j6cpj6,u1g60o,u00000,1vm6,261gc30,31cdvg0,0,u30c1g,o30c1g,u00000,1060,3g70e0s,70c0g0,0,u0o30c,60o30c,u00000,83gr66,0,0,0,0,0,1vo0,o30600,0,0,0,3o,67pj6c,1r00000,1o30,1g7gr36,1j6cv00,0,3s,33c1g66,1u00000,70c,63or6c,36cotg0,0,3s,33ftg66,1u00000,e3c,1i61s30,1g61s00,0,3m,36cpj3s,6cou00,1o30,1g6otj6,1j6dpg0,0,c1g01o,c1g60o,u00000,1g6,s1g6,30cpj6,u00000,3g60o36,1m7gr36,3j00000,e0o,c1g60o,c1gf00,0,7c,3vddlmm,3300000,0,dopj6,1j6cpg0,0,3s,33cdhm6,1u00000,0,dopj6,1j7oo30,3o00000,3m,36cpj3s,60o7g0,0,dotj6,1g61s00,0,3s,3370766,1u00000,41g,ofoc1g,o3c700,0,6c,36cpj6c,1r00000,0,6cpj6,1j3o600,0,66,33ddlnu,1m00000,0,ccr1o,s6phg0,0,66,33cdhju,30pu00,0,ftj0o,o6dvg0,0,71g60o,1o1g60o,700000,60o,c1g00o,c1g600,0,1o1g60o,71g60o,1o00000,tms,0,0,0,41o,1mcdhnu,0,f36,31c1g62,1j3o306,1u00000,36co06c,36cpj6c,1r00000,o61g,7phnu,30ccv00,g,s6o03o,67pj6c,1r00000,1j6c,7g33s,36cotg0,30,o1g03o,67pj6c,1r00000,3gr1o,7g33s,36cotg0,0,f36,1g6cf0c,33o000,10e3c,7phnu,30ccv00,0,36co03s,33ftg66,1u00000,60c0o,7phnu,30ccv00,0,1j6c01o,c1g60o,u00000,1gf36,3g60o,c1gf00,30,o1g01o,c1g60o,u00000,cdhgg,s6phm6,3vcdhg0,e3c,s00e3c,33cdvm6,3300000,c30o00,3v6co3s,1g6dvg0,0,1j3m,r7tm6o,1n00000,fjc,36cpvmc,36cpjg0,g,s6o03s,33cdhm6,1u00000,1hm6,7phm6,33ccv00,30,o1g03s,33cdhm6,1u00000,30u6c,cpj6c,36cotg0,30,o1g06c,36cpj6c,1r00000,1hm6,cdhm6,337s1gc,1s00066,333gr66,33cdhjc,s00000,cdhg0,33cdhm6,33ccv00,o,c3opj0,1g6cf0o,c00000,3gr34,1gf0o30,1gedv00,0,1j6cf0o,1v1gvgo,c00000,fhj6c,3sc9j6u,36cphg0,e,dhg60o,1v1g60o,cdgs00,1gc30,7g33s,36cotg0,c,c3001o,c1g60o,u00000,1gc30,7phm6,33ccv00,o,o6006c,36cpj6c,1r00000,tms,dopj6,1j6cpg0,tms,cdpnm,3vdtjm6,3300000,3or3c,v00vg0,0,1o,1m6oe00,1u00000,0,c1g,30c30,33ccv00,0,0,3vc1g60,0,0,1vg6,30c000,60,30cdj6o,o61n46,61gfg0,c1g66,36dgc36,379sfg6,300000,c1g00o,c3of1s,c00000,0,r6pm3c,r00000,0,1m3c,r6pm00,0,8k84a4,8k84a4,8k84a4,8k8lda,1aqklda,1aqklda,1aqklda,3enfnbn,3enfnbn,3enfnbn,3ene60o,c1g60o,c1g60o,c1g60o,c1g60o,c1g67o,c1g60o,c1g60o,c1g67o,cfg60o,c1g60o,r3cdhm,r3cdnm,r3cdhm,r3c000,0,fsdhm,r3cdhm,0,fg67o,c1g60o,c1gdhm,r3cdnm,3fcdhm,r3cdhm,r3cdhm,r3cdhm,r3cdhm,r3c000,7u,3fcdhm,r3cdhm,r3cdhm,rfc1nu,0,dhm,r3cdhm,rfs000,0,c1g60o,cfg67o,0,0,0,fg60o,c1g60o,c1g60o,c1g60v,0,60o,c1g60o,cfu000,0,0,7v,c1g60o,c1g60o,c1g60o,c1u60o,c1g60o,0,7v,0,60o,c1g60o,cfu60o,c1g60o,c1g60o,c1u60v,c1g60o,c1gdhm,r3cdhm,r3edhm,r3cdhm,r3cdhm,r3ec1v,0,0,1v,o3edhm,r3cdhm,r3cdhm,rfe07v,0,0,7v,fedhm,r3cdhm,r3cdhm,r3ec1n,r3cdhm,r3c000,7v,fu000,0,r3cdhm,rfe07n,r3cdhm,r3c60o,c1g67v,fu000,0,r3cdhm,r3cdnv,0,0,7v,fu60o,c1g60o,0,7v,r3cdhm,r3cdhm,r3cdhm,r3u000,0,c1g60o,c1u60v,0,0,v,c1u60o,c1g60o,0,1v,r3cdhm,r3cdhm,r3cdhm,rfudhm,r3cdhm,c1g60o,cfu67v,c1g60o,c1g60o,c1g60o,cfg000,0,0,v,c1g60o,c1hvvv,3vvvvvv,3vvvvvv,3vvvvvv,0,7v,3vvvvvv,3vvvs7g,3of1s7g,3of1s7g,3of1s7g,7gu3of,7gu3of,7gu3of,7gvvvv,3vvvvvv,3vg0000,0,0,7dn6o,3cdotg0,0,v66,3ucdhns,30c0g00,1vm6,33c1g60,30c1g00,0,1vjc,1m6or3c,1m00000,1vm6,1g3061g,1gcdvg0,0,3u,3cdhm6o,1o00000,0,1j6cpj6,1u60o60,0,tms,c1g60o,c00000,vgo,u6cpj6,u1gvg0,0,s6phm6,3vcdhjc,s00000,e3c,33cdhjc,1m6prg0,0,f3060c,v6cpj6,u00000,0,7tmur,1v00000,0,1gcvmr,3dv6vj0,3000000,71g,1g60v30,1g30700,0,7phm6,33cdhm6,3300000,7u,1vg0,fs000,0,1g63u,c1g000,3vg0000,c0o,60c30o,o00vg0,0,61gc30,o1g300,1v00000,3gr,dhg60o,c1g60o,c1g60o,c1g60o,c1hm6o,1o00000,o,c00vg0,c1g000,0,tms,7dn00,0,3gr3c,s00000,0,0,0,c1g000,0,0,o,0,f,60o30c,6eor1s,e00000,dgr3c,1m6or00,0,3g,3c30o68,3s00000,0,0,1u7ov3s,1u7o000,0",
8, 14, null, false, true 
] );

qbs._.data.commands.loadFont( [ 
"0,0,0,0,vk1,2io30dt,2co30bu,0,vnv,3dvvvu3,3jvvvru,0,0,1mftvnu,3v7oe0g,0,0,83gv7u,1u3g400,0,o,u3ppv7,3jhg61s,0,o,u7tvvv,1v1g61s,0,0,0,0,0,3vvvvvv,3vvvpu3,31ufvvv,3vvvvvv,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,vr3,1vm6or3,1hmfpv6,3000000,o,cdmf77,udm60o,0,81g70,3ofhvno,3oe1g40,0,41ge,f3tvhu,f0s1g2,0,61s,1v1g60o,1v3o600,0,pj6,1j6cpj6,1j00pj6,0,vur,3dtmuor,dhm6or,0,7phj0,s6phm6,1m3g366,1u00000,0,0,3vftvnu,0,61s,1v1g60o,1v3o63u,0,61s,1v1g60o,c1g60o,0,60o,c1g60o,c7sf0o,0,0,1g37u,61g000,0,0,30o7u,1g30000,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,61s,u3o60o,c0060o,0,6cpj6,i00000,0,0,3c,1mfsr3c,1mfsr3c,0,c1gv66,31c0v06,38dhjs,c1g000,0,31cc30o,o61hk6,0,e3c,1m3gtms,36cpj3m,0,30c1g,1g00000,0,0,30o,o30c1g,o3060c,0,c0o,60o30c,60o61g,0,0,6cf7v,u6c000,0,0,1g63u,c1g000,0,0,0,1g60o,o00000,0,7u,0,0,0,0,60o,0,0,10c30o,o61g40,0,f36,31s7mur,31s6phs,0,61o,1s1g60o,c1g63u,0,v66,30o61g,1gc1hnu,0,v66,30cf06,30dhjs,0,30s,u6pj7u,60o30u,0,1vm0,30c1v06,30dhjs,0,e30,30c1v66,33cdhjs,0,1vm6,30c30o,o30c1g,0,v66,33ccv66,33cdhjs,0,v66,33ccvg6,30c33o,0,0,c1g000,1g600,0,0,c1g000,1g61g,0,6,61gc30,o1g306,0,0,7s000,1v00000,0,30,o1g306,61gc30,0,v66,330o60o,c0060o,0,3s,33cdnmu,3fdpg3s,0,41o,1mcdhnu,33cdhm6,0,1v36,1j6cv36,1j6cpns,0,f36,31c1g60,30c4phs,0,1u3c,1j6cpj6,1j6cr7o,0,1vj6,1h6gu38,1g64pnu,0,1vj6,1h6gu38,1g60o7g,0,f36,31c1g6u,33ccphq,0,1hm6,33cdvm6,33cdhm6,0,f0o,c1g60o,c1g61s,0,7gc,60o30c,36cpj3o,0,1pj6,1j6ou3o,1m6cpn6,0,1s30,1g60o30,1g64pnu,0,1gv7,3vvvmu3,31s7gu3,0,1hn6,3rftnme,33cdhm6,0,v66,33cdhm6,33cdhjs,0,1v36,1j6cv30,1g60o7g,0,v66,33cdhm6,33ddnjs,60s000,1v36,1j6cv3c,1j6cpn6,0,v66,3360e0c,3cdhjs,0,1vur,2chg60o,c1g61s,0,1hm6,33cdhm6,33cdhjs,0,1gu3,31s7gu3,31mcf0o,0,1gu3,31s7gur,3dvupj6,0,1gu3,1j3o60o,u6dgu3,0,1gu3,31mcf0o,c1g61s,0,1vu3,230o61g,1gc3gvv,0,f1g,o30c1g,o30c1s,0,40,30e0s1o,e0s1g2,0,f0c,60o30c,60o31s,0,83gr66,0,0,0,0,0,0,fu000,o30600,0,0,0,0,7g33s,36cpj3m,0,1o30,1g7gr36,1j6cpjs,0,0,7phm0,30c1hjs,0,70c,63or6c,36cpj3m,0,0,7phnu,30c1hjs,0,e3c,1i61s30,1g60o7g,0,0,7dj6c,36cpj3s,6cou00,1o30,1g6otj6,1j6cpn6,0,60o,3g60o,c1g61s,0,1g6,s1g6,30c1g6,1j6cf00,1o30,1g6cr3o,1s6opn6,0,e0o,c1g60o,c1g61s,0,0,edvur,3dtnmur,0,0,dopj6,1j6cpj6,0,0,7phm6,33cdhjs,0,0,dopj6,1j6cpjs,1g61s00,0,7dj6c,36cpj3s,60o7g0,0,dotj6,1g60o7g,0,0,7phj0,s0phjs,0,41g,ofoc1g,o30dgs,0,0,cpj6c,36cpj3m,0,0,c7gu3,31mcf0o,0,0,c7gu3,3dtnvr6,0,0,c6phs,c3opm3,0,0,cdhm6,33cdhju,30pu00,0,ftj0o,o61hnu,0,3go,c1gs0o,c1g60e,0,60o,c1g00o,c1g60o,0,s0o,c1g3go,c1g63g,0,tms,0,0,0,0,83gr66,33cdvg0,0,f36,31c1g60,316cf0c,37o000,1j00,cpj6c,36cpj3m,0,o61g,7phnu,30c1hjs,0,10e3c,7g33s,36cpj3m,0,1j00,7g33s,36cpj3m,0,60c0o,7g33s,36cpj3m,0,3gr1o,7g33s,36cpj3m,0,0,u6co30,1j3o306,u00000,10e3c,7phnu,30c1hjs,0,1hg0,7phnu,30c1hjs,0,60c0o,7phnu,30c1hjs,0,pg0,3g60o,c1g61s,0,1gf36,3g60o,c1g61s,0,60c0o,3g60o,c1g61s,0,cc00g,s6phm6,3vcdhm6,0,s6oe00,s6phm6,3vcdhm6,0,c30o00,3v6co3s,1g60pnu,0,0,6seor,1vdhn3n,0,fjc,36cpvmc,36cpj6e,0,10e3c,7phm6,33cdhjs,0,1hg0,7phm6,33cdhjs,0,60c0o,7phm6,33cdhjs,0,30u6c,cpj6c,36cpj3m,0,60c0o,cpj6c,36cpj3m,0,1hg0,cdhm6,33cdhju,30ou00,cc03s,33cdhm6,33cdhjs,0,cc066,33cdhm6,33cdhjs,0,1g63u,31s1g60,31ns60o,0,3gr34,1gf0o30,1g61pns,0,1gr6,u1hvoo,3vhg60o,0,fopj6,1u64pjf,1j6cpnj,0,s6oo,c1gvgo,c1g60o,3c70000,1gc30,7g33s,36cpj3m,0,o61g,3g60o,c1g61s,0,1gc30,7phm6,33cdhjs,0,1gc30,cpj6c,36cpj3m,0,tms,dopj6,1j6cpj6,0,1rdo066,3jfdvmu,37cdhm6,0,3or3c,v00vg0,0,0,3gr3c,s00v00,0,0,c1g,30c30,30cdhjs,0,0,1vm0,30c1g00,0,0,1vg6,30c1g0,0,c1g62,33co61g,1gct6o6,61u000,c1g62,33co61g,1jct5hu,30c000,60o,1g60o,u3of0o,0,0,3cr6o,1m3c000,0,0,dgr1m,1mdg000,0,8k84a4,8k84a4,8k84a4,8k84a4,1aqklda,1aqklda,1aqklda,1aqklda,3enfnbn,3enfnbn,3enfnbn,3enfnbn,c1g60o,c1g60o,c1g60o,c1g60o,c1g60o,c1g67o,c1g60o,c1g60o,c1g60o,cfg67o,c1g60o,c1g60o,r3cdhm,r3cdnm,r3cdhm,r3cdhm,0,7u,r3cdhm,r3cdhm,0,fg67o,c1g60o,c1g60o,r3cdhm,rfc1nm,r3cdhm,r3cdhm,r3cdhm,r3cdhm,r3cdhm,r3cdhm,0,fs1nm,r3cdhm,r3cdhm,r3cdhm,rfc1nu,0,0,r3cdhm,r3cdnu,0,0,c1g60o,cfg67o,0,0,0,7o,c1g60o,c1g60o,c1g60o,c1g60v,0,0,c1g60o,c1g67v,0,0,0,7v,c1g60o,c1g60o,c1g60o,c1g60v,c1g60o,c1g60o,0,7v,0,0,c1g60o,c1g67v,c1g60o,c1g60o,c1g60o,c1u60v,c1g60o,c1g60o,r3cdhm,r3cdhn,r3cdhm,r3cdhm,r3cdhm,r3ec1v,0,0,0,3uc1n,r3cdhm,r3cdhm,r3cdhm,rfe07v,0,0,0,fu07n,r3cdhm,r3cdhm,r3cdhm,r3ec1n,r3cdhm,r3cdhm,0,fu07v,0,0,r3cdhm,rfe07n,r3cdhm,r3cdhm,c1g60o,cfu07v,0,0,r3cdhm,r3cdnv,0,0,0,fu07v,c1g60o,c1g60o,0,7v,r3cdhm,r3cdhm,r3cdhm,r3cdhv,0,0,c1g60o,c1u60v,0,0,0,1u60v,c1g60o,c1g60o,0,1v,r3cdhm,r3cdhm,r3cdhm,r3cdnv,r3cdhm,r3cdhm,c1g60o,cfu67v,c1g60o,c1g60o,c1g60o,c1g67o,0,0,0,v,c1g60o,c1g60o,3vvvvvv,3vvvvvv,3vvvvvv,3vvvvvv,0,7v,3vvvvvv,3vvvvvv,3of1s7g,3of1s7g,3of1s7g,3of1s7g,7gu3of,7gu3of,7gu3of,7gu3of,3vvvvvv,3vvvvo0,0,0,0,7dn6o,3cdhn3m,0,u6c,36cpm6c,33cdhmc,0,1vm6,33c1g60,30c1g60,0,0,3v6or3c,1m6or3c,0,7u,3360c0o,o61hnu,0,0,7tm6o,3cdhm3g,0,0,1j6cpj6,1j7oo30,3000000,0,1rdo60o,c1g60o,0,3u,c3opj6,1j3o63u,0,1o,1mcdhnu,33ccr1o,0,e3c,33cdhjc,1m6or7e,0,7hg,c0ofj6,1j6cphs,0,0,7tmur,3dns000,0,3,37tmur,3pnso60,0,71g,1g60v30,1g60c0s,0,3s,33cdhm6,33cdhm6,0,0,3v0007u,1vg0,0,0,c1gvgo,c0007v,0,1g,c0o1gc,c3003u,0,c,c30o1g,c0o03u,0,3gr,dhg60o,c1g60o,c1g60o,c1g60o,c1g60o,3cdhm3g,0,0,c1g03u,1g600,0,0,7dn00,1rdo000,0,3gr3c,s00000,0,0,0,o,c00000,0,0,0,c00000,0,u30c,60o37c,1m6of0s,0,dgr3c,1m6or00,0,0,71m1g,1gchu00,0,0,0,1u7ov3s,1u7ov00,0",
8, 16, null, false, true 
] );

qbs._.data.commands.setDefaultFont( [ 1 ] );

} )();

( function () {
"use strict";

qbs._.data.commands.setDefaultPal( [ [
	"#000000","#0000AA","#00AA00","#00AAAA","#AA0000",
	"#AA00AA", "#AA5500","#AAAAAA","#555555","#5555FF","#55FF55","#55FFFF",
	"#FF5555","#FF55FF","#FFFF55","#FFFFFF","#000000","#141414","#202020",
	"#2D2D2D","#393939","#454545","#515151","#616161","#717171","#828282",
	"#929292","#A2A2A2","#B6B6B6","#CACACA","#E3E3E3","#FFFFFF","#0000FF",
	"#4100FF","#7D00FF","#BE00FF","#FF00FF","#FF00BE","#FF007D","#FF0041",
	"#FF0000","#FF4100","#FF7D00","#FFBE00","#FFFF00","#BEFF00","#7DFF00",
	"#41FF00","#00FF00","#00FF41","#00FF7D","#00FFBE","#00FFFF","#00BEFF",
	"#007DFF","#0041FF","#7D7DFF","#9E7DFF","#BE7DFF","#DF7DFF","#FF7DFF",
	"#FF7DDF","#FF7DBE","#FF7D9E","#FF7D7D","#FF9E7D","#FFBE7D","#FFDF7D",
	"#FFFF7D","#DFFF7D","#BEFF7D","#9EFF7D","#7DFF7D","#7DFF9E","#7DFFBE",
	"#7DFFDF","#7DFFFF","#7DDFFF","#7DBEFF","#7D9EFF","#B6B6FF","#C6B6FF",
	"#DBB6FF","#EBB6FF","#FFB6FF","#FFB6EB","#FFB6DB","#FFB6C6","#FFB6B6",
	"#FFC6B6","#FFDBB6","#FFEBB6","#FFFFB6","#EBFFB6","#DBFFB6","#C6FFB6",
	"#B6FFB6","#B6FFC6","#B6FFDB","#B6FFEB","#B6FFFF","#B6EBFF","#B6DBFF",
	"#B6C6FF","#000071","#1C0071","#390071","#550071","#710071","#710055",
	"#710039","#71001C","#710000","#711C00","#713900","#715500","#717100",
	"#557100","#397100","#1C7100","#007100","#00711C","#007139","#007155",
	"#007171","#005571","#003971","#001C71","#393971","#453971","#553971",
	"#613971","#713971","#713961","#713955","#713945","#713939","#714539",
	"#715539","#716139","#717139","#617139","#557139","#457139","#397139",
	"#397145","#397155","#397161","#397171","#396171","#395571","#394571",
	"#515171","#595171","#615171","#695171","#715171","#715169","#715161",
	"#715159","#715151","#715951","#716151","#716951","#717151","#697151",
	"#617151","#597151","#517151","#517159","#517161","#517169","#517171",
	"#516971","#516171","#515971","#000041","#100041","#200041","#310041",
	"#410041","#410031","#410020","#410010","#410000","#411000","#412000",
	"#413100","#414100","#314100","#204100","#104100","#004100","#004110",
	"#004120","#004131","#004141","#003141","#002041","#001041","#202041",
	"#282041","#312041","#392041","#412041","#412039","#412031","#412028",
	"#412020","#412820","#413120","#413920","#414120","#394120","#314120",
	"#284120","#204120","#204128","#204131","#204139","#204141","#203941",
	"#203141","#202841","#2D2D41","#312D41","#352D41","#3D2D41","#412D41",
	"#412D3D","#412D35","#412D31","#412D2D","#41312D","#41352D","#413D2D",
	"#41412D","#3D412D","#35412D","#31412D","#2D412D","#2D4131","#2D4135",
	"#2D413D","#2D4141","#2D3D41","#2D3541","#2D3141","#000000","#000000",
	"#000000","#000000","#000000","#000000","#000000"
] ] );

qbs._.data.commands.setDefaultColor( [ 7 ] );

} )();
/*
* File: qbs-init.js
*/

// Start of File Encapsulation
(function () {

"use strict";

// Create the API
qbs._.processCommands();

if( window.$ === undefined ) {
	window.$ = window.qbs;
}

// Delete reference to internal functions
delete qbs._;

// End of File Encapsulation
} )();
