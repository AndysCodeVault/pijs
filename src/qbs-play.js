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
