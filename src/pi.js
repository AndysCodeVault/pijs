/*
* https://www.pijs.org/
* Pi.js
* Version: [VERSION_NUMBER]
* Copyright Andy Stubbs
* Released under the Apache License 2.0
* https://www.apache.org/licenses/LICENSE-2.0
* Date: [BUILD_DATE]
* @preserve
*/

window.pi = ( function () {
	"use strict";

	var m_piData, m_api, m_waiting, m_waitCount, m_readyList, m_commandList, m_startReadyListTimeout, pi;

	m_waitCount = 0;
	m_waiting = false;
	m_readyList = [];
	m_commandList = [];
	m_startReadyListTimeout = 0;

	// Initilize data
	m_piData = {
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
		"isTouchScreen": false,
		"defaultInputFocus": window
	};

	// PI api
	m_api = {
		"_": {
			"addCommand": addCommand,
			"addCommands": addCommands,
			"addSetting": addSetting,
			"processCommands": processCommands,
			"addPen": addPen,
			"addBlendCommand": addBlendCommand,
			"data": m_piData,
			"resume": resume,
			"wait": wait
		}
	};

	// Pi alias
	pi = m_api;

	// Add a command to the internal list
	function addCommand( name, fn, isInternal, isScreen, parameters, isSet ) {
		m_piData.commands[ name ] = fn;

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
		m_piData.settings[ name ] = {
			"name": name,
			"fn": fn,
			"isScreen": isScreen,
			"parameters": parameters
		};
		m_piData.settingsList.push( name );
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
			m_piData.screenCommands[ cmd.name ] = cmd;
			m_api[ cmd.name ] = function () {
				var args;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				return m_piData.commands[ cmd.name ]( null, args );
			};
			return;
		}

		if( cmd.isScreen ) {
			m_piData.screenCommands[ cmd.name ] = cmd
			m_api[ cmd.name ] = function () {
				var args, screenData;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				screenData = getScreenData( undefined, cmd.name );
				if( screenData !== false ) {
					return m_piData.commands[ cmd.name ]( screenData, args );
				}
			};
		} else {
			m_api[ cmd.name ] = function () {
				var args;
				args = parseOptions( cmd, [].slice.call( arguments ) );
				return m_piData.commands[ cmd.name ]( args );
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
			! pi.util.isArray( args[ 0 ] ) &&
			! pi.util.isDomElement( args[ 0 ] ) 
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
		m_piData.penList.push( name );
		m_piData.pens[ name ] = {
			"cmd": fn,
			"cap": cap
		};
	}

	function addBlendCommand( name, fn ) {
		m_piData.blendCommandsList.push( name );
		m_piData.blendCommands[ name ] = fn;
	}

	// Gets the screen data
	addCommand( "getScreenData", getScreenData, true, false, [] );
	function getScreenData( screenId, commandName ) {
		if( m_piData.activeScreen === null ) {
			if( commandName === "set" ) {
				return false;
			}
			m_piData.log( commandName + ": No screens available for command." );
			return false;
		}
		if( screenId === undefined || screenId === null ) {
			screenId = m_piData.activeScreen.id;
		}
		if( pi.util.isInteger( screenId ) && ! m_piData.screens[ screenId ] ) {
			m_piData.log( commandName + ": Invalid screen id." );
			return false;
		}
		return m_piData.screens[ screenId ];
	}

	function resume() {
		m_waitCount--;
		if( m_waitCount === 0 ) {
			startReadyList();
		}
	}

	function startReadyList() {
		var i, temp;

		if( document.readyState !== "loading" && m_waitCount === 0 ) {
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

	// This trigger a function once PI is completely loaded
	addCommand( "ready", ready, false, false, [ "fn" ] );
	function ready( args ) {
		var fn;

		fn = args[ 0 ];

		if( pi.util.isFunction( fn ) ) {
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

	// Set the active screen on pi
	addCommand( "setScreen", setScreen, false, false, [ "screen" ] );
	addSetting( "screen", setScreen, false, [ "screen" ] );
	function setScreen( args ) {
		var screenObj, screenId;

		screenObj = args[ 0 ];

		if( pi.util.isInteger( screenObj ) ) {
			screenId = screenObj;
		} else if( screenObj && pi.util.isInteger( screenObj.id ) ) {
			screenId = screenObj.id;
		}
		if( ! m_piData.screens[ screenId ] ) {
			m_piData.log( "screen: Invalid screen." );
			return;
		}
		m_piData.activeScreen = m_piData.screens[ screenId ];
	}

	// Remove all screens from the page and memory
	addCommand( "removeAllScreens", removeAllScreens, false, false, [] );
	function removeAllScreens() {
		var i, screenData;
		for( i in m_piData.screens ) {
			screenData = m_piData.screens[ i ];
			screenData.screenObj.removeScreen();
		}
		m_piData.nextScreenId = 0;
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
		if( !isNaN( Number( c ) ) && m_piData.defaultPalette.length > c ) {
			m_piData.defaultColor = c;
		} else {
			c = pi.util.convertToColor( c );
			if( c === null ) {
				m_piData.log(
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
		if( ! pi.util.isArray( pal ) ) {
			m_piData.log( "setDefaultPal: parameter pal is not an array." );
			return;
		}

		if( pal.length < 1 ) {
			m_piData.log( "setDefaultPal: parameter pal must have at least one color value." );
		}

		m_piData.defaultPalette = [];
		
		if( pal.length > 1 ) {
			m_piData.defaultColor = 1;
		} else {
			m_piData.defaultColor = 0;
		}

		for( i = 0; i < pal.length; i++ ) {
			c = pi.util.convertToColor( pal[ i ] );
			if( c === null ) {
				m_piData.log(
					"setDefaultPal: invalid color value inside array pal."
				);
				m_piData.defaultPalette.push(
					pi.util.convertToColor( "#000000" )
				);
			} else {
				m_piData.defaultPalette.push(
					pi.util.convertToColor( pal[ i ] )
				);
			}
		}

		// Set color 0 to transparent
		m_piData.defaultPalette[ 0 ] = pi.util.convertToColor( [
			m_piData.defaultPalette[ 0 ].r,
			m_piData.defaultPalette[ 0 ].g,
			m_piData.defaultPalette[ 0 ].b,
			0
		] );
	}

	// Get default pal command
	addCommand( "getDefaultPal", getDefaultPal, false, false, [] );
	function getDefaultPal( args ) {
		var i, color, colors;
		colors = [];
		for( i = 0; i < m_piData.defaultPalette.length; i++ ) {
			color = {
				"r": m_piData.defaultPalette[ i ].r,
				"g": m_piData.defaultPalette[ i ].g,
				"b": m_piData.defaultPalette[ i ].b,
				"a": m_piData.defaultPalette[ i ].a,
				"s": m_piData.defaultPalette[ i ].s
			};
			colors.push( m_piData.defaultPalette[ i ] );
		}
		return colors;
	}

	// Set the default input focus element
	addCommand( "setDefaultInputFocus", setDefaultInputFocus, false, false, [ "element" ] );
	addSetting( "defaultInputFocus", setDefaultInputFocus, false, [ "element" ] );
	function setDefaultInputFocus( args ) {
		var element = args[ 0 ];
		if( typeof element === "string" ) {
			element = document.getElementById( element );
		}
		if( !element || !pi.util.canAddEventListeners( element ) ) {
			m_piData.log( "setDefaultInputFocus: Invalid argument element. Element must be a" +
				" DOM element or a string id of a DOM element."
			);
			return;
		}
		if( !( element.tabIndex >= 0 ) ) {
			element.tabIndex = 0;
		}
		m_piData.defaultInputFocus = element;
		m_piData.commands[ "reinitKeyboard" ]();
	}

	// Global settings command
	addCommand( "set", set, false, true, m_piData.settingsList, true );
	function set( screenData, args ) {
		var options, optionName, setting, optionValues;

		options = args[ 0 ];

		// Loop through all the options
		for( optionName in options ) {

			// If the option is a valid setting
			if( m_piData.settings[ optionName ] ) {

				// Get the setting data
				setting = m_piData.settings[ optionName ];

				// Parse the options from the setting
				optionValues = options[ optionName ];
				if( 
					! pi.util.isArray( optionValues ) && 
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
			m_piData.log = logError;
		} else if( mode === "throw" ) {
			m_piData.log = throwError;
		} else if( mode === "none" ) {
			m_piData.log = noError;
		} else {
			m_piData.log(
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

	//[EXTRA_BUILD_COMMAND]

	return m_api;

} )();
