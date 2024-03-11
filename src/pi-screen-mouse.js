/*
* File: pi-screen-mouse.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, pi;

pi = window.pi;
m_piData = pi._.data;

pi._.addCommand( "startMouse", startMouse, false, true, [] );
function startMouse( screenData ) {
	if( ! screenData.mouseStarted ) {
		screenData.canvas.addEventListener( "mousemove", mouseMove );
		screenData.canvas.addEventListener( "mousedown", mouseDown );
		screenData.canvas.addEventListener( "mouseup", mouseUp );
		screenData.canvas.addEventListener( "contextmenu", onContextMenu );
		screenData.mouseStarted = true;
	}
}

pi._.addCommand( "stopMouse", stopMouse, false, true, [] );
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

	screenData = m_piData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "move" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "move", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "move", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}
}

function mouseDown( e ) {
	var screenData;

	screenData = m_piData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "down" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "down", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "down", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "click", getMouse( screenData ),
			screenData.onClickEventListeners, "down"
		);
	}
}

function mouseUp( e ) {
	var screenData;

	screenData = m_piData.screens[ e.target.dataset.screenId ];

	updateMouse( screenData, e, "up" );

	if( screenData.mouseEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "up", getMouse( screenData ),
			screenData.onMouseEventListeners
		);
	}

	if( screenData.pressEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "up", getMouse( screenData ),
			screenData.onPressEventListeners
		);
	}

	if( screenData.clickEventListenersActive > 0 ) {
		m_piData.commands.triggerEventListeners( "click", getMouse( screenData ),
			screenData.onClickEventListeners, "up"
		);
	}
}

function onContextMenu( e ) {
	var screenData;

	screenData = m_piData.screens[ e.target.dataset.screenId ];

	if( ! screenData.isContextMenuEnabled ) {
		e.preventDefault();
		return false;
	}
}

function updateMouse( screenData, e, action ) {
	var rect, x, y, lastX, lastY;

	rect = screenData.clientRect;
	x = Math.floor(
		e.offsetX / rect.width * screenData.width
	);
	y = Math.floor(
		e.offsetY / rect.height * screenData.height
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

pi._.addCommand( "getMouse", getMouse, true, true, [] );
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

pi._.addCommand( "inmouse", inmouse, false, true, [] );
function inmouse( screenData ) {
	
	// Activate the mouse event listeners
	startMouse( screenData );

	return getMouse( screenData );
}

// Adds an event trigger for a mouse event
pi._.addCommand( "onmouse", onmouse, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function onmouse( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_piData.commands.onevent(
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
pi._.addCommand( "offmouse", offmouse, false, true, [ "mode", "fn" ] );
function offmouse( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];

	isValid = m_piData.commands.offevent(
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

pi._.addCommand( "setEnableContextMenu", setEnableContextMenu, false, true,
	[ "isEnabled" ]
);
pi._.addSetting( "enableContextMenu", setEnableContextMenu, true,
	[ "isEnabled" ]
);
function setEnableContextMenu( screenData, args ) {
	screenData.isContextMenuEnabled = !!( args[ 0 ] );

	// Activate the mouse event listeners
	startMouse( screenData );
}

pi._.addCommand( "onpress", onpress, false, true,
	[ "mode", "fn", "once", "hitBox", "customData" ]
);
function onpress( screenData, args ) {
	var mode, fn, once, hitBox, isValid, customData;

	mode = args[ 0 ];
	fn = args[ 1 ];
	once = args[ 2 ];
	hitBox = args[ 3 ];
	customData = args[ 4 ];

	isValid = m_piData.commands.onevent(
		mode, fn, once, hitBox, [ "down", "up", "move" ], "onpress",
		screenData.onPressEventListeners, null, null, customData
	);

	// Activate the mouse event listeners
	if( isValid ) {
		m_piData.commands.startMouse( screenData );
		m_piData.commands.startTouch( screenData );
		screenData.pressEventListenersActive += 1;
	}
}

pi._.addCommand( "offpress", offpress, false, true,
	[ "mode", "fn" ]
);
function offpress( screenData, args ) {
	var mode, fn, isValid;

	mode = args[ 0 ];
	fn = args[ 1 ];

	isValid = m_piData.commands.offevent(
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

pi._.addCommand( "inpress", inpress, false, true, [] );
function inpress( screenData ) {
	
	// Activate the mouse event listeners
	m_piData.commands.startMouse( screenData );
	m_piData.commands.startTouch( screenData );

	if( screenData.lastEvent === "touch" ) {
		return m_piData.commands.getTouchPress( screenData );
	} else {
		return m_piData.commands.getMouse( screenData );
	}
}

pi._.addCommand( "onclick", onclick, false, true,
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
			width: m_piData.commands.width( screenData ),
			height: m_piData.commands.height( screenData )
		};
	}
	
	isValid = m_piData.commands.onevent(
		"click", fn, once, hitBox, [ "click" ], "onclick",
		screenData.onClickEventListeners, null, null, customData
	);

	// Activate the mouse event listeners
	if( isValid ) {
		m_piData.commands.startMouse( screenData );
		m_piData.commands.startTouch( screenData );
		screenData.clickEventListenersActive += 1;
	}
}

pi._.addCommand( "offclick", offclick, false, true,
	[ "fn" ]
);
function offclick( screenData, args ) {
	var fn, isValid;

	fn = args[ 0 ];

	isValid = m_piData.commands.offevent(
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
