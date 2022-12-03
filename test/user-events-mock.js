/*
* File: user-events-mock.js
*/

var m_commandScripts = [];
var m_scriptIndex = 0;
var m_commandScriptsTimeout;
var g_page;
var g_resolve;
var g_startTime;

const test = function ( commandString, page ) {
	var regString, reg, commands, conflicts;

	m_commandScripts = [];
	m_scriptIndex = 0;
	g_page = page;
	g_startTime = ( new Date ).getTime();

	// Remove potential conflicts
	conflicts = removeQuotes( commandString );

	// Remove spaces and convert to upper case
	commandString = conflicts.str.split( /\s+/ ).join( "" ).toUpperCase();

	//console.log( commandString );

	// Regex String
	regString = "(?=" +
		"MD|" +
		"MD\\d+|" +
		"MV\\d+\\,\\d+|" +
		"MV\\d+\\,\\d+,\\d+|" +
		"MU|" +
		"MU\\d+|" +
		"MC|" +
		"MC\\d+|" +
		"TS|" +
		"TM\\d+\\,\\d+|" +
		"TM\\d+\\,\\d+,\\d+|" +
		"TE|" +
		"KD\\d+|" +
		"KU\\d+|" +
		"KP\\d+|" +
		"KT\\d+|" +
		"DL\\d+|" +
		"SL\\d+" +
	")";

	reg = new RegExp( regString );

	// Split the commands
	commands = commandString.split( reg );

	processCommands( commands, conflicts.data );

	//console.log( commands );

	m_commandScripts.push( {
		"commands": commands,
		"delay": 100,
		"index": 0,
		"target": "",
		"mouse": {
			"x": 0,
			"y": 0,
			"buttons": 0
		},
		"touch": {
			"x": 0,
			"y": 0,
			"id": 0
		}
	} );

	if( m_commandScriptsTimeout ) {
		clearTimeout( m_commandScriptsTimeout );
	}
	m_commandScriptsTimeout = setTimeout( runCommandScripts, 100 );

	return new Promise( function( resolve, reject ) {
		g_resolve = resolve;
	} );
};

function processCommands( commands, conflictData ) {
	var i, cmd, data, conflictItems;

	conflictItems = [ "KD", "KU", "KP", "KT", "SL", "MC", "MD", "MU" ];
	for( i = 0; i < commands.length; i++ ) {
		cmd = commands[ i ].substring( 0, 2 );
		data = commands[ i ].substr( 2 ).split( "," );

		if( data.length !== undefined && data.length === 1 ) {
			data = data[ 0 ];
		}

		// Grab the data from the conflictData
		if( conflictItems.indexOf( cmd ) > -1 ) {
			data = conflictData[ parseInt( data ) ];
		}

		// Update the command item
		commands[ i ] = {
			"cmd": cmd,
			"data": data
		};
	}
}

function removeQuotes( commandString ) {
	var quotes, start, end;

	// TODO - allow for escaped quotes
	// TODO - Error handling for uneven quotes

	quotes = [];
	start = commandString.indexOf( "\"" );
	while( start !== -1 ) {
		end = commandString.indexOf( "\"", start + 1 );

		// Sanity check
		if( start >= end || end === -1 ) {
			console.error( "Something wrong here!" );
			return;
		}

		// Add to the quotes array
		quotes.push( commandString.substring( start + 1, end ) );

		// Remove the quoted item from the string
		commandString = commandString.substring( 0, start ) +
			( quotes.length - 1 ) + commandString.substring( end + 1 );

		// Find the next quote
		start = commandString.indexOf( "\"" );
	}

	return {
		"data": quotes,
		"str": commandString
	};
}

// Run the command scripts
async function runCommandScripts() {
	var commandScript;
	//console.log( "Running Script" );
	//console.log( m_scriptIndex );

	if( m_scriptIndex < m_commandScripts.length ) {
		commandScript = m_commandScripts[ m_scriptIndex ];

		// If a delay of 0, loop without setting a timeout
		do {
			await runCommand( commandScript );
		} while(
			commandScript.delay === 0 &&
			commandScript.index < commandScript.commands.length
		);

		//console.log( commandScript.index, commandScript.commands.length );

		// If the script is not completed set a timeout
		if( commandScript.index < commandScript.commands.length ) {

			//console.log( "Running next script" );
			setTimeout( runCommandScripts, commandScript.delay );

		} else {
			//console.log( "Script completed" );
			m_scriptIndex += 1;
			g_resolve( "Completed" );
			//runCommandScripts();
		}
	} else {
		//console.log( "Events Completed" );
		g_resolve( "Completed" );
	}
}

async function runCommand( commandScript ) {
	var command, time, button;

	//console.log( "Running Command" );
	//console.log( commandScript.index );

	// Stop if completed script
	if( commandScript.index >= commandScript.commands.length ) {
		commandScript.delay = 0;
		return;
	}

	time = ( new Date ).getTime();

	command = commandScript.commands[ commandScript.index ];
	commandScript.index += 1;

	//console.log( command );
	//console.log( time - g_startTime );
	//console.log( command.cmd, commandScript.index, command.data );

	switch( command.cmd ) {
		case "DL":
			commandScript.delay = parseInt( command.data );
			break;
		case "SL":
			commandScript.target = command.data;
			if( commandScript.target !== "" ) {
				g_page.focus( commandScript.target );
			} else {
				g_page.focus( "*" );
			}
			break;
		case "MV":
			if( command.data.length === 3 ) {
				addSteps(
					commandScript, command,
					commandScript.mouse.x, commandScript.mouse.y
				);
			} else {
				commandScript.mouse.x = parseInt( command.data[ 0 ] );
				commandScript.mouse.y = parseInt( command.data[ 1 ] );
				await g_page.mouse.move(
					commandScript.mouse.x,
					commandScript.mouse.y
				);
			}
			break;
		case "MD":
			if( command.data ) {
				button = command.data;
			} else {
				button = "left";
			}
			commandScript.mouse.buttons = 1;
			await g_page.mouse.down( { "button": button } );
			break;
		case "MU":
			if( command.data ) {
				button = command.data;
			} else {
				button = "left";
			}
			commandScript.mouse.buttons = 0;
			await g_page.mouse.up( { "button": button } );
			break;
		case "MC":
			if( command.data ) {
				button = command.data;
			} else {
				button = "left";
			}
			if( commandScript.target ) {
				await g_page.click(
					commandScript.target, { "button": button }
				);
			} else {
				await g_page.mouse.click(
					commandScript.mouse.x, commandScript.mouse.y,
					{ "button": button }
				);
			}
			break;
		case "KT":
			//console.log( "Typing: " + command.data );
			if( commandScript.target ) {
				await g_page.type(
					commandScript.target, command.data
				);
			} else {
				await g_page.keyboard.type( command.data );
			}
			break;
		case "KD":
			//console.log( "KeyDown", command.data );
			await g_page.keyboard.down( command.data );
			break;
		case "KU":
			await g_page.keyboard.up( command.data );
			break;
		case "KP":
			//console.log( "KeyPress: " + command.data );
			await g_page.keyboard.press( command.data );
			break;
		case "TS":
			commandScript.touch.x = parseInt( command.data[ 0 ] );
			commandScript.touch.y = parseInt( command.data[ 1 ] );
			await dispatchTouch(
				commandScript.target, "touchstart", command.data,
				commandScript.touch.id
			);
			break;
		case "TM":
			if( command.data.length === 3 ) {
				addSteps(
					commandScript,
					command,
					commandScript.touch.x,
					commandScript.touch.y
				);
			} else {
				commandScript.touch.x = parseInt( command.data[ 0 ] );
				commandScript.touch.y = parseInt( command.data[ 1 ] );
				await dispatchTouch(
					commandScript.target, "touchmove", command.data,
					commandScript.touch.id
				);
			}
			break;
		case "TE":
			await dispatchTouch(
				commandScript.target, "touchend", [], commandScript.touch.id
			);
			commandScript.touch.id += 1;
			break;
	}

	//console.log( "step completed" );
}

async function dispatchTouch( target, name, data, id ) {
	if( data.length > 1 ) {
		data[ 0 ] = parseInt( data[ 0 ] );
		data[ 1 ] = parseInt( data[ 1 ] );
	}
	//console.log( target, name, data );
	return await g_page.evaluate(
		function ( selector, name, data, id ) {
			var target, touch, touchConfig;
			if( selector ) {
				target = document.querySelector( selector );
			} else {
				target = document.body;
			}
			touchConfig = {
				"cancelable": true,
				"bubbles": true,
				"touches": [],
				"targetTouches": [],
				"changedTouches": [],
				"shiftKey": true
			};
			if( data.length > 1 ) {
				touch = new Touch( {
					"identifier": id,
					"target": target,
					"clientX": data[ 0 ],
					"clientY": data[ 1 ],
					"pageX": data[ 0 ],
					"pageY": data[ 1 ],
					"radiusX": 2.5,
					"radiusY": 2.5,
					"rotationAngle": 10,
					"force": 0.5
				} );
				touchConfig.touches.push( touch );
				touchConfig.changedTouches.push( touch );
			}
			event = new TouchEvent( name, touchConfig );
			target.dispatchEvent( event );
		}, target, name, data, id
	);

}

function addSteps( commandScript, command, x1, y1 ) {
	var i, steps, x2, y2, dx, dy;

	x2 = parseInt( command.data[ 0 ] );
	y2 = parseInt( command.data[ 1 ] );
	steps = parseInt( command.data[ 2 ] );
	dx = ( x2 - x1 ) / steps;
	dy = ( y2 - y1 ) / steps;

	for( i = 0; i < steps - 1; i++ ) {
		x1 += dx;
		y1 += dy;
		commandScript.commands.splice( commandScript.index + i, 0, {
			"cmd": command.cmd,
			"data": [ Math.round( x1 ), Math.round( y1 ) ]
		} );
	}

	commandScript.commands.splice( commandScript.index + i, 0, {
		"cmd": command.cmd,
		"data": [ Math.round( x2 ), Math.round( y2 ) ]
	} );

	// console.log( commandScript.index );
	// for( i = 0; i < commandScript.commands.length; i++ ) {
	// 	console.log( i, commandScript.commands[ i ] );
	// }
}

module.exports = test;
