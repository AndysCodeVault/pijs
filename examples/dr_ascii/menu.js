"use strict";

var Menu = ( function () {

	var m = {
		"interval": 0,
		"cnt": 0,
		"cnt2": 0,
		"rects": [
            { "x": 25, "y": 30, "width": 190, "height": 40 },
            { "x": 25, "y": 82, "width": 190, "height": 40 },
            { "x": 25, "y": 135, "width": 190, "height": 32 },
            { "x": 45, "y": 102, "width": 30, "height": 12 },
            { "x": 100, "y": 102, "width": 30, "height": 12 },
            { "x": 156, "y": 102, "width": 37, "height": 12 }
        ],
		"settings": {
			"players": 0,
			"selected": 0,
			"virusLevel": 0,
			"speedSelected": 0
		}
	};

	$.ready( initGame );

	return {
		"GameOver": gameOver
	};

	function initGame() {
		var i;

		g.screens.push( $.screen( "256x224" ) );
		g.screens.push( $.screen( "10x10", null, true ) );

		// Viruses
		for( i = 0; i < g.screens.length; i++ ) {
			$.setScreen( g.screens[ i ] );
			$.setFont( 2 );
			$.setChar( "~", "00c33c4299663c42" );   // A0
			$.setChar( "!", "81423c425ae73c24" );   // A1
			$.setChar( "#", "005a3c5aff663c42" );   // B0
			$.setChar( "$", "00187e5a7ee73c24" );   // B1
			$.setChar( "%", "c3ff425a7ec35a66" );   // C0
			$.setChar( "^", "00ffc35aff427ee7" );   // C1
		}

		$.setScreen( g.screens[ 0 ] );

		// Pills
		$.setChar( "(", "3f7fffffffff7f3f" );   // Left
		$.setChar( ")", "fcfefffffffffefc" );   // Right
		$.setChar( "{", "3c7effffffffffff" );   // Top
		$.setChar( "}", "ffffffffffff7e3c" );   // Bottom
		$.setChar( "&", "3c7effffffff7e3c" );   // Circle

		showPlayerSelect();
	}

	function showPlayerSelect() {
		$.clearKeys();
		$.clearEvents();
		$.onkey( "1", "up", stopAnimationIntro );
		$.onkey( "2", "up", stopAnimationIntro );
		animatePlayerSelect();
		m.interval = setInterval( animatePlayerSelect, 60 );
	}
	
	function animatePlayerSelect() {
		var cols, rows, x, y, centerX, centerY, step, steps;

		// Calculate positions
		cols = $.getCols();
		rows = $.getRows();
		centerX = Math.round( cols / 2 );
		centerY = Math.round( rows / 2 ) - 1;

		// Draw player select
		$.cls();
		$.setColor( 15 );
		$.setPos( 0, centerY - 1 );
		$.print( "Dr. Ascii", true, true );
		$.print( "\n" );
		$.print( "1 or 2 players?", true, true );
		if( m.cnt2 < 5 ) {
			$.print( "_", true );
		}

		// Draw borders
		$.setColor( 4 );
		x = centerX - 15;
		y = centerY - 5;
		step = 0;
		steps = 74;
		while( step < steps ) {
			if( step < 27 ) {
				x += 1;
			} else if( step < 37 ) {
				y += 1;
			} else if( step < 64 ) {
				x -= 1;
			} else {
				y -= 1;
			}
			$.setPos( x, y );
			if( step % 3 === m.cnt ) {
				$.print( "*", true );
			}
			step += 1;
		}
		m.cnt = ( m.cnt + 1 ) % 3;
		m.cnt2 = ( m.cnt2 + 1 ) % 10;
	}

	function stopAnimationIntro( key ) {
		$.clearKeys();
		clearInterval( m.interval );
		m.settings.players = parseInt( key.key );

		$.onpress( "down", function( e ) {
			
			// Click virusl level
			if( e.y >= 52 && e.y <= 64 && e.x >= 29 && e.x <= 209 ) {
				m.settings.virusLevel = Math.floor( ( e.x - 30 ) / 180 * 20 ) + 1;
				if( e.x < 31 ) {
					m.settings.virusLevel = 0;
				} else if( m.settings.virusLevel > 20 ) {
					m.settings.virusLevel = 20;
				}
				setupGame();
			}

			// Click low button
			if( e.y >= 102 && e.x >= 45 && e.y <= 113 && e.x <= 74 ) {
				m.settings.speedSelected = 0;
				setupGame();
			}

			// Click Med button
			if( e.y >= 102 && e.x >= 100 && e.y <= 113 && e.x <= 129 ) {
				m.settings.speedSelected = 1;
				setupGame();
			}

			// Click High button
			if( e.y >= 102 && e.x >= 156 && e.y <= 113 && e.x <= 192 ) {
				m.settings.speedSelected = 2;
				setupGame();
			}

			// Click begin button
			if( e.y >= 135 && e.x >= 25 && e.y <= 166 && e.x <= 214 ) {
				$.rect( m.rects[ 2 ] );
				setTimeout( function () {
					Game.start( m.settings );
				}, 500 );
			}
		} );

		$.onkey( "ArrowUp", "down", function () {
			m.settings.selected -= 1;
			if( m.settings.selected < 0 ) {
				m.settings.selected = 2;
			}
			setupGame();
		} );
		$.onkey( "ArrowDown", "down", function () {
			m.settings.selected += 1;
			if( m.settings.selected > 2 ) {
				m.settings.selected = 0;
			}
			setupGame();
		} );
		$.onkey( "ArrowLeft", "down", function () {
			if( m.settings.selected === 0 ) {
				m.settings.virusLevel -= 1;
				if( m.settings.virusLevel < 0 ) {
					m.settings.virusLevel = 0;
				}
			} else if( m.settings.selected === 1 ) {
				m.settings.speedSelected -= 1;
				if( m.settings.speedSelected < 0 ) {
					m.settings.speedSelected = 0;
				}
			}
			setupGame();
		} );
		$.onkey( "ArrowRight", "down", function () {
			if( m.settings.selected === 0 ) {
				m.settings.virusLevel += 1;
				if( m.settings.virusLevel >= g.maxVirusLevel ) {
					m.settings.virusLevel = g.maxVirusLevel;
				}
			} else if( m.settings.selected === 1 ) {
				m.settings.speedSelected += 1;
				if( m.settings.speedSelected >= g.speeds.length - 1 ) {
					m.settings.speedSelected = g.speeds.length - 1;
				}
			}
			setupGame();
		} );

		$.onkey( "Enter", "down", function () {
			$.rect( m.rects[ 2 ] );
			setTimeout( function () {
				Game.start( m.settings );
			}, 500 );
		} );
		setupGame();
	}

	function setupGame() {
		var i;
	
		$.cls();
		$.setColor( 7 );
		$.print();
		$.print( m.settings.players + " Player Game", false, true );
		$.print( "\n\n" );
		$.print( "\tVirus Level\n" );
	
		// Virus Level Settings
		$.setColor( 15 );
		if( m.settings.selected === 0 ) {
			$.rect( m.rects[ 0 ] );
		}
		$.setColor( 8 );
		$.rect( 30, 53, g.maxVirusLevel * 9, 12, 8 );
		$.setColor( 7 );
		$.rect( 30, 53, m.settings.virusLevel * 9, 12, 7 );
		$.setColor( 15 );
		$.setPos( 14, 7 );
		$.print( $.util.padL( m.settings.virusLevel, 2, "0" ) );
		
		// Speed Settings
		$.setColor( 15 );
		if( m.settings.selected === 1 ) {
			$.rect( m.rects[ 1 ] );
		}
		$.setColor( 7 );
		$.setPos( 0, 11 );
		$.print( "\tSpeed\n" );
		$.setColor( 8 );
		$.rect( m.rects[ 3 ] );
		$.rect( m.rects[ 4 ] );
		$.rect( m.rects[ 5 ] );
		$.setColor( 15 );
		$.print( "\t  ", true );
		for( i = 0; i < g.speedNames.length; i++ ) {
			$.print( g.speedNames[ i ] + "\t", true );
		}
		$.rect( m.rects[ 3 + m.settings.speedSelected ] );
	
		// Begin Game
		$.setColor( 15 );
		if( m.settings.selected === 2 ) {
			$.rect( m.rects[ 2 ] );
		}
		$.setPosPx( 0, 148 );
		$.print( "Begin Game", false, true );
	
		// Settings Help
		$.setColor( 7 );
		$.setPos( 0, 23 );
		$.print( "Use arrow keys/enter or mouse to select settings." );
	}

	function gameOver( status ) {
		$.clearKeys();
		$.clearEvents();
		$.cls();
		$.setColor( 15 );

		$.setPos( 0, 8 );
		$.print( "Game Over", false, true );
		$.print( "\n" );
		if( status.win ) {
			$.print( status.winner + " wins.", false, true );
			$.print( "\n" );
		} else {
			$.print( "You lose.", false, true );
			$.print( "\n" );
		}
		if( status.score ) {
			$.print( "Final score: " + status.score, false, true );
			$.print( "\n" );
		}

		if( status.score > g.top ) {
			g.top = status.score;
			localStorage.setItem( "top", g.top );
			$.print( "You got a highscore.", false, true );
		}

		$.setPos( 0, 23 );
		$.print( "Press any key to continue.", true, true );
		$.onkey( "any", "down", showPlayerSelect, true );
		$.onmouse( "down", showPlayerSelect, true );
	}

} )();
