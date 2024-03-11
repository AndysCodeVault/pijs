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

	//[NO_BUILD]
	// setTimeout( function () {
	// 	var blob = new Blob(
	// 		[ JSON.stringify( m_commandList ) ],
	// 		{ "type": "application/json" }
	// 	);
	// 	saveData( blob, "Commands" );
	// }, 1000 );

	// function saveData( blob, filename ) {
	// 	var a;

	// 	a = document.createElement( "a" );
	// 	a.href = URL.createObjectURL( blob );
	// 	a.download = filename;
	// 	document.body.appendChild( a );
	// 	a.click();
	// 	a.parentElement.removeChild( a );
	// 	URL.revokeObjectURL( a.href );
	// }
	//[/NO_BUILD]

	return m_api;

} )();
