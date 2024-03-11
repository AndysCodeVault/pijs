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
