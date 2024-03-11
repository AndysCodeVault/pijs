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
