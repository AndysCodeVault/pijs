/*
* File: pi-screen-touch.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, pi;

pi = window.pi;
m_piData = pi._.data;

pi._.addCommand( "startTouch", startTouch, false, true, [] );
function startTouch( screenData ) {
	if( ! screenData.touchStarted ) {
		screenData.canvas.addEventListener( "touchstart", touchStart );
		screenData.canvas.addEventListener( "touchmove", touchMove );
		screenData.canvas.addEventListener( "touchend", touchEnd );
		screenData.canvas.addEventListener( "touchcancel", touchEnd );
		screenData.touchStarted = true;
	}
}

pi._.addCommand( "stopTouch", stopTouch, false, true, [] );
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

	m_piData.isTouchScreen = true;

	screenData = m_piData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "start" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "start",
			getTouch( screenData ), screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "down",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);

		// This will prevent mouse down event start event from firing
		e.preventDefault();
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "click",
			getTouchPress( screenData ),
			screenData.onClickEventListeners, "down"
		);
	}
}

function touchMove( e ) {
	var screenData;
	screenData = m_piData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "move" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "move",
			getTouch( screenData ), screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "move",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);
	}
}

function touchEnd( e ) {
	var screenData;
	screenData = m_piData.screens[ e.target.dataset.screenId ];

	if( screenData == null ) {
		return;
	}

	updateTouch( screenData, e, "end" );

	if( screenData.touchEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "end", getTouch( screenData ),
			screenData.onTouchEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "up",
			getTouchPress( screenData ), screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "click",
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

pi._.addCommand( "getTouchPress", getTouchPress, true, true, [] );
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

pi._.addCommand( "intouch", intouch, false, true, [] );
function intouch( screenData ) {

	startTouch( screenData );

	return getTouch( screenData );
}

// Adds an event trigger for a mouse event
pi._.addCommand( "ontouch", ontouch, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function ontouch( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_piData.commands.onevent(
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
pi._.addCommand( "offtouch", offtouch, false, true, [ "mode", "fn" ] );
function offtouch( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];


	isValid = m_piData.commands.offevent( mode, fn, [ "start", "end", "move" ],
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

pi._.addCommand( "setPinchZoom", setPinchZoom, false, false,
	[ "isEnabled" ]
);
pi._.addSetting( "pinchZoom", setPinchZoom, false, [ "isEnabled" ] );
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
