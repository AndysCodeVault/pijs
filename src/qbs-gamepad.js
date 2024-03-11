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
