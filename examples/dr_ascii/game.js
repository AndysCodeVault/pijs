"use strict";

var Game = ( function () {
	var m = {};

	return {
		"start": start
	};

	function start( settings ) {
		$.clearKeys();
		$.clearEvents();
		setup();
		m.game.playerCount = settings.players;
		m.game.level = settings.virusLevel;
		m.game.speed = settings.speedSelected;
		showKeys();
	}

	function setup() {
		m = {
			"time": 0,
			"game": {
				"level": 0,
				"speed": 0,
				"virusAngle": 0,
				"moveDelay": 200,
				"rotateDelay": 200,
				"fastFallSpeed": 25,
				"scores": [ 100, 200, 300 ],
				"win": false,
				"winner": null,
				"bottle": g.bottle,
				"playerCount": 1,
				"statsRect": { "x": 186, "y": 116, "width": 54, "height": 88, "fillColor": 17 },
				"statsL": 24,
				"circleX": 35,
				"circleY": 150
			},
			"player1": {
				"name": "Player 1",
				"moveX": 0,
				"lastMove": 0,
				"rotate": false,
				"lastRotate": 0,
				"fastFall": 0,
				"lastAnimationFrame": 0,
				"lastAnimationFrame2": 0,
				"nextPill": null,
				"finishedThrowing": false,
				"score": 0,
				"activePills": [],
				"pills": {},
				"pillScore": 0,
				"viruses": {},
				"virusCount": 0,
				"cache": {},
				"left": 10,
				"right": 20,
				"floor": 25,
				"top": 7,
				"centerX": 15
			},
			"player2": {
				"name": "Player 2",
				"moveX": 0,
				"lastMove": 0,
				"rotate": false,
				"lastRotate": 0,
				"fastFall": 0,
				"lastAnimationFrame": 0,
				"lastAnimationFrame2": 0,
				"nextPill": null,
				"finishedThrowing": false,
				"score": 0,
				"activePills": [],
				"pills": {},
				"pillScore": 0,
				"viruses": {},
				"virusCount": 0,
				"cache": {},
				"left": 19,
				"right": 29,
				"floor": 25,
				"top": 7,
				"centerX": 24
			},
			"keys1": {
				"left": "ArrowLeft",
				"up": "ArrowUp",
				"right": "ArrowRight",
				"down": "ArrowDown"
			},
			"keys2": {
				"left": "a",
				"up": "w",
				"right": "d",
				"down": "s"
			}
		};
	}

	function showKeys() {
		$.cls();
		$.setColor( 15 );
		$.setPos( 0, 2 );
		$.print( "Game Controls", false, true );

		// Player 2 Controls
		$.setPos( 4, 10 );
		$.print( "Player 2" );
		$.setColor( 7 );
		$.setPos( 7, 12 );
		$.print( "W" );
		$.setPos( 5, 14 );
		$.print( "A S D" );		

		// Player 1 Controls
		$.setColor( 15 );
		$.setPos( 20, 10 );
		$.print( "Player 1" );
		$.setColor( 7 );
		$.pset( 187, 99 );
		$.draw( "l3 e3 f3 l3 d3" );
		$.pset( 170, 115 );
		$.draw( "e3 d3 r3 l3 d3 h3" );
		$.pset( 187, 115 );
		$.draw( "u3 d3 l3 f3 e3 l3" );
		$.pset( 198, 115 );
		$.draw( "r3 u3 f3 g3 u3" );

		// Press any key
		$.setPos( 0, 23 );
		$.print( "Press any key to continue.", true, true );
		$.onkey( "any", "down", beginGame, true );
		$.onmouse( "down", beginGame, true );
	}

	function beginGame() {
		$.cls();
		$.clearKeys();
		$.clearEvents();
		m.time = performance.now();

		if( m.game.playerCount === 2 ) {
			m.game.bottle = g.bottle2;
			m.game.statsL = 14;
			m.game.statsRect.x = 104;
			m.game.statsRect.width = 49;
			m.game.circleX = 128;
			m.game.circleY = 50;
			m.player1.left = 19;
			m.player1.right = 29;
			m.player1.centerX = 24;
			m.player2.left = 2;
			m.player2.right = 12;
			m.player2.centerX = 6;
			initPlayer( m.player2, m.keys2 );
		}
		initPlayer( m.player1, m.keys1 );

		run( m.time );
	}

	function initPlayer( player, keys ) {
		player.virusCount = 5 + m.game.level * 2;
		player.lastAnimationFrame = m.time;
		player.lastAnimationFrame2 = m.time;

		generateViruses( player );
		setupGameInput( player, keys );
		getNextPill( player );
		setupThrowAnimation( player );
	}

	function generateViruses( player ) {
		var i, x, y, id, width, height, looping, c, virusId;
		width = player.right - player.left - 1;
		height = player.floor - player.top - 5;
		for( i = 0; i < player.virusCount; i++ ) {
			looping = true;
			id = "";
			while( looping ) {
				x = Math.floor( Math.random() * width ) + player.left + 1;
				y = player.floor - Math.floor( Math.random() * height );
				virusId = Math.floor( Math.random() * g.viruses.length );
				c = g.colors[ virusId ];				
				id = x + "_" + y;
				if( ! player.viruses[ id ] ) {
					player.viruses[ id ] = {
						"x": x, "y": y, "c": c, "id": virusId, "frame": 0
					};
					looping = false;
				}
			}
		}
	}

	function setupGameInput( player, keys ) {
		$.onkey( keys.left, "down", function () {
			player.moveX = -1;
		} );
		$.onkey( keys.left, "up", function () {
			player.moveX = 0;
			player.lastMove = 0;
		} );
		$.onkey( keys.right, "down", function () {
			player.moveX = 1;
		} );
		$.onkey( keys.right, "up", function () {
			player.moveX = 0;
			player.lastMove = 0;
		} );
		$.onkey( keys.up, "down", function () {
			player.rotate = true;
		} );
		$.onkey( keys.up, "up", function () {
			player.rotate = false;
			player.lastRotate = 0;
		} );
		$.onkey( keys.down, "down", function () {
			player.fastFall = true;
		} );
		$.onkey( keys.down, "up", function () {
			player.fastFall = false;
		} );
	}

	function getNextPill( player ) {
		if( player.virusCount === 0 ) {
			m.game.gameOver = true;
			m.game.win = true;
			m.game.winner = player.name;
			return;
		}
		player.nextPill = {
			"x": player.centerX, "y": player.top,
			"c": g.colors[ Math.floor( Math.random() * g.colors.length ) ],
			"baseX": player.centerX, "baseY": player.top,
			"id": "(", "last": performance.now(),
			"status": "active", "order": 0, "rotation": 0
		};
		player.nextPill.partner = {
			"x": player.centerX + 1, "y": player.top,
			"c": g.colors[ Math.floor( Math.random() * g.colors.length ) ],
			"id": ")", "last": performance.now(),
			"status": "active", "order": 1
		};
		player.nextPill.partner.partner = player.nextPill;
	}

	function setupThrowAnimation( player ) {
		player.animationFrame = g.animations.length - 1;
		player.lastAnimationFrame = performance.now();
		player.throwingPill = true;
		player.finishedThrowing = true;
	}

	function run( timestamp ) {
		var dt, score;
		dt = timestamp - m.time;
		m.time = timestamp;
	
		if( m.game.gameOver ) {
			if( m.game.playerCount === 2 ) {
				score = 0;
			} else {
				score = m.player1.score;
			}
			Menu.GameOver( {
				"win": m.game.win,
				"winner": m.game.winner,
				"score": score
			} );
			return;
		}
		drawGameScreen( dt );
		moveGameObjects( timestamp, m.player1 );
		if( m.game.playerCount === 2 ) {
			moveGameObjects( timestamp, m.player2 );
		}
		requestAnimationFrame( run );
	}

	function drawGameScreen( dt ) {
		var i, virus, virusTypesDrawn, x, y, a, pillData, viruses;
	
		$.cls();
	
		//Draw Bottles
		$.setColor( 7 );
		$.print( m.game.bottle );	
		
		if( m.game.playerCount === 1 ) {
			$.setColor( 8 );
			$.rect( 4, 22, 65, 43, 17 );
			$.setColor( 7 );
			$.setPos( 0, 3 );
			$.print( " TOP" );
			$.print( " " + $.util.padL( g.top, 7, "0" ) );
			$.print();
			$.print( " SCORE" );
			$.print( " " + $.util.padL( m.player1.score, 7, "0" ) );
		
	
			// Draw Dr. Ascii
			$.setColor( 7 );
			$.setPos( 22, 3 );
			$.print( "Dr. Ascii" );
			$.print( g.animations[ m.player1.animationFrame ] );

			// Draw Next Pill
			if( m.player1.finishedThrowing ) {
				pillData = g.animationPills[ m.player1.animationFrame ]; 
				$.setColor( m.player1.nextPill.c );
				$.setPos( pillData[ 0 ][ 0 ], pillData[ 0 ][ 1 ] );
				$.print( pillData[ 0 ][ 2 ] );
				$.setColor( m.player1.nextPill.partner.c );
				$.setPos( pillData[ 1 ][ 0 ], pillData[ 1 ][ 1 ] );
				$.print( pillData[ 1 ][ 2 ] );
			}
		}
	
		// Draw Stats
		$.setColor( 8 );
		$.rect( m.game.statsRect );
	
		// Print Level
		$.setColor( 7 );
		$.setPos( m.game.statsL, 16 );
		$.print( "LEVEL" );
		$.setPos( m.game.statsL + 3, 17 );
		$.print( $.util.padL( m.game.level, 2, "0" ) );
	
		// Print Speed
		$.setPos( m.game.statsL, 19 );
		$.print( "SPEED" );
		$.setPos( m.game.statsL + 2, 20 );
		$.print( g.speedNames[ m.game.speed ] );
	
		// Print Virus Count
		$.setPos( m.game.statsL, 22 );
		$.print( "Virus" );
		$.setPos( m.game.statsL + 3, 23 );
		if( m.game.playerCount === 2 ) {
			$.print( $.util.padL( m.player1.virusCount + m.player2.virusCount, 2, "0" ) );
		} else {
			$.print( $.util.padL( m.player1.virusCount, 2, "0" ) );
		}
	
		// Draw Big Viruses
		$.setColor( 8 );
		$.circle( m.game.circleX, m.game.circleY, 33, 17 );
		virusTypesDrawn = {};
		a = m.game.virusAngle;
		viruses = getAllVirses();
		for( i in viruses ) {
			virus = viruses[ i ];
			if( ! virusTypesDrawn[ virus.id ] ) {
				g.screens[ 1 ].cls();
				g.screens[ 1 ].setColor( virus.c );
				g.screens[ 1 ].print(  g.viruses[ virus.id ].charAt( virus.frame ) );
				g.screens[ 1 ].render();
				x = Math.cos( a ) * 17 + ( m.game.circleX + 2 );
				y = Math.sin( a ) * 17 + ( m.game.circleY + 2 );
				$.drawImage( g.screens[ 1 ], x, y, null, 0.5, 0.5, null, 2, 2 );
				virusTypesDrawn[ virus.id ] = true;
				a += $.util.math.deg120;
			}
		}
		m.game.virusAngle -= 0.0005 * dt;

		drawplayer( m.player1 );

		if( m.game.playerCount === 2 ) {
			drawplayer( m.player2 );
		}
	}

	function getAllVirses() {
		var viruses, i;
		if( m.game.playerCount === 1 ) {
			return m.player1.viruses;
		}
		viruses = {};
		for( i in m.player1.viruses ) {
			viruses[ i ] = m.player1.viruses[ i ];
		}
		for( i in m.player2.viruses ) {
			viruses[ i ] = m.player2.viruses[ i ];
		}
		return viruses;
	}

	function drawplayer( player ) {
		var i, virus, pill;

		if( m.game.playerCount === 2 ) {
		
			// Draw Next Pill
			if( player.finishedThrowing ) {
				$.setColor( player.nextPill.c );
				$.setPos( player.centerX, player.top - 1 );
				$.print( player.nextPill.id );
				$.setColor( player.nextPill.partner.c );
				$.setPos( player.centerX + 1, player.top - 1 );
				$.print( player.nextPill.partner.id );
				$.setPixelMode( false );
				$.setPen( "pixel", 2, 200 );
				$.setColor( "rgba(0, 0, 0, 0.5)" );
				$.rect( player.centerX * 8, ( player.top - 1 ) * 8, 16, 8, "rgba(0, 0, 0, 0.5)" );
				$.setPen( "pixel", 1 );
				$.setPixelMode( true );
			}

		}

		// Draw Viruses
		for( i in player.viruses ) {
			virus = player.viruses[ i ];
			$.setColor( virus.c );
			$.setPos( virus.x, virus.y );
			$.print( g.viruses[ virus.id ].charAt( virus.frame ) );
			if( m.time > player.lastAnimationFrame2 + 60 ) {
				if( Math.random() * 3 < 1 ) {
					virus.frame = Math.floor( Math.random() * 2 );
				}
			}
		}
	
		if( m.time > player.lastAnimationFrame2 + 60 ) {
			player.lastAnimationFrame2 = m.time;
		}
	
		// Draw Pills
		for( i in player.pills ) {
			pill = player.pills[ i ];
			$.setColor( pill.c );
			$.setPos( pill.x, pill.y );
			$.print( pill.id, true );
		}
	
		// Draw Active Pills
		for( i = 0; i < player.activePills.length; i++ ) {
			pill = player.activePills[ i ];
			$.setColor( pill.c );
			$.setPos( pill.x, pill.y );
			$.print( pill.id, true );
		}	
	}

	function moveGameObjects( timestamp, player ) {
		var i, pill, cacheIndex, pillDropped, speed, pillDroppedWithoutMoving;
	
		pillDropped = false;
		pillDroppedWithoutMoving = false;

		// Move Active Pills
		for( i = player.activePills.length - 1; i >= 0; i-- ) {
			pill = player.activePills[ i ];
	
			if(
				player.fastFall && player.movePill &&
				( pill === player.movePill || pill === player.movePill.partner ) ||
				pill.fastFall
			) {
				speed = m.game.fastFallSpeed;
			} else {
				speed = g.speeds[ m.game.speed ];
			}
			// Check if ready to drop
			if( m.time > pill.last + speed ) {
				pill.last = m.time;
				pill.y += 1;
				if( pill.baseY ) {
					pill.baseY += 1;
				}
				cacheIndex = pill.x + "_" + pill.y;
				if( 
					player.pills[ cacheIndex ] ||
					player.viruses[ cacheIndex ] ||
					pill.status === "stopped" ||
					pill.y > player.floor
				) {
					pill.status = "stopped";
					pill.y -= 1;
					if( pill.baseY ) {
						pill.baseY -= 1;
					}
					player.pills[ pill.x + "_" + pill.y ] = pill;
					player.activePills.splice( i, 1 );
	
					if( pill === player.movePill || pill.partner === player.movePill ) {
						player.movePill = null;
					}
	
					// If partner is active flag it to be stopped
					if( pill.partner ) {
						if( pill.partner.status === "active" ) {
							pill.partner.status = "stopped";
						}
	
						// If partner has already moved - then move it back up
						if( pill.order === 0 ) {
							pill.partner.y -= 1;
							player.pills[ pill.partner.x + "_" + pill.partner.y ] = pill.partner;
							player.activePills.splice( i, 1 );
						}
	
						// Decouple Pills
						pill.partner.partner = null;
						pill.partner = null;
					}
	
					pillDropped = true;
				}

				if( pillDropped && pill.moved === false ) {
					pillDroppedWithoutMoving = true;
				}
				pill.moved = true;
			}
		}
	
		if( pillDropped ) {
			findMatches( player );

			if( ! freefall( player ) && pillDroppedWithoutMoving ) {
				m.game.gameOver = true;
				m.game.win = false;
				if( m.game.playerCount === 2 ) {
					m.game.win = true;
					if( player.name === m.player1.name ) {
						m.game.winner = m.player2.name;
					} else {
						m.game.winner = m.player1.name;
					}
				}
			}
		}
	
		if( player.activePills.length === 0 && ! player.throwingPill  ) {
			player.score += player.pillScore;
			player.pillScore = 0;
			setupThrowAnimation( player );
		}
	
		if( timestamp > player.lastAnimationFrame + g.animationDelay ) {
			if( player.throwingPill ) {
				player.animationFrame = 0;
				throwPill( player );
				getNextPill( player );
				player.finishedThrowing = false;
			} else {
				player.animationFrame = Math.floor( Math.random() * ( g.animations.length - 1 ) );
				player.finishedThrowing = true;
			}
			player.lastAnimationFrame = timestamp;
		}
	
		handleInput( player, timestamp );
	}

	function handleInput( player, timestamp ) {
		var cacheIndex, cacheIndex2;
	
		if( ! player.movePill ) {
			return;
		}
		if( player.rotate && timestamp > player.lastRotate + m.game.rotateDelay ) {
			player.movePill.rotation = ( player.movePill.rotation + 1 ) % 4;
			updateRotation( player, timestamp );
	
			// If up against right wall make sure to bounce back
			if( player.movePill.x >= player.right || player.movePill.partner.x >= player.right ) {
				player.movePill.x -= 1;
				player.movePill.baseX -= 1;
				player.movePill.partner.x -= 1;
	
				if( isPillCollision( player ) ) {
					player.movePill.x += 1;
					player.movePill.baseX += 1;
					player.movePill.partner.x += 1;
					player.movePill.rotation -= 1;
					if( player.movePill.rotation < 0 ) {
						player.movePill.rotation = 3;
					}
					updateRotation( player, timestamp );
				}
			} else if( isPillCollision( player ) ) {
				player.movePill.rotation -= 1;
				if( player.movePill.rotation < 0 ) {
					player.movePill.rotation = 3;
				}
				updateRotation( player, timestamp );
			}
		}
	
		if( player.moveX !== 0 && timestamp > player.lastMove + m.game.moveDelay ) {
			player.movePill.baseX += player.moveX;
			player.movePill.x += player.moveX;
			player.movePill.partner.x += player.moveX;
	
			if( isPillCollision( player ) ) {
				player.movePill.baseX -= player.moveX;
				player.movePill.x -= player.moveX;
				player.movePill.partner.x -= player.moveX;
			} else {
				player.lastMove = timestamp;
			}
		}
	}

	function updateRotation( player, timestamp ) {
		player.movePill.x = player.movePill.baseX + g.rotations[ player.movePill.rotation ][ 0 ];
		player.movePill.y = player.movePill.baseY + g.rotations[ player.movePill.rotation ][ 1 ];
		player.movePill.partner.x = player.movePill.baseX + g.rotations[ player.movePill.rotation ][ 2 ];
		player.movePill.partner.y = player.movePill.baseY + g.rotations[ player.movePill.rotation ][ 3 ];
		player.movePill.id = g.rotations[ player.movePill.rotation ][ 4 ];
		player.movePill.partner.id = g.rotations[ player.movePill.rotation ][ 5 ];
		player.lastRotate = timestamp;
	}

	function isPillCollision( player ) {
		var cacheIndex, cacheIndex2;
	
		cacheIndex = player.movePill.x + "_" + player.movePill.y;
		cacheIndex2 = player.movePill.partner.x + "_" + player.movePill.partner.y;
	
		return (
			player.pills[ cacheIndex ] || player.pills[ cacheIndex2 ] ||
			player.viruses[ cacheIndex ] || player.viruses[ cacheIndex2 ] ||
			player.movePill.x <= player.left ||
			player.movePill.x >= player.right ||
			player.movePill.partner.x <= player.left ||
			player.movePill.partner.x >= player.right
		);
	}

	function throwPill( player ) {
		player.animationFrame = 0;
		player.lastAnimationFrame = performance.now();
		player.throwingPill = false;
		addActivePill( player, player.nextPill );
		addActivePill( player, player.nextPill.partner );
		player.movePill = player.nextPill;
	}

	function addActivePill( player, pill ) {
		pill.moved = false;
		player.activePills.push( pill );
		player.activePills.sort( function ( a, b ) {
			return a.y - b.y;
		} );
	}

	function findMatches( player ) {
		var i, pill, matches, j;
	
		for( i in player.pills ) {
			pill = player.pills[ i ];
			matches = getMatches( player, pill.x, pill.y, pill.c );
			if( matches.length >= 4 ) {
				for( j = 0; j < matches.length; j++ ) {
					if( player.pills[ matches[ j ] ] ) {
						delete player.pills[ matches[ j ] ];
					} else if( player.viruses[ matches[ j ] ] ) {
						if( player.pillScore === 0 ) {
							player.pillScore = m.game.scores[ m.game.speed ];
						} else {
							player.pillScore = Math.round( player.pillScore * 2.5 );
						}
						delete player.viruses[ matches[ j ] ];
						player.virusCount -= 1;
					}
				}
			}
		}
	}

	function freefall( player ) {
		var i, pill, fallers, j, isFreeFall, hasFreeFaller;
	
		// Move Active Pills
		player.cache = {};
		for( i in player.pills ) {
			if( player.cache[ i ] ) {
				continue;
			}
			pill = player.pills[ i ];
			fallers = [];
			isFreeFall = getFreeFallers( player, pill.x, pill.y, fallers );
			if( isFreeFall ) {
				hasFreeFaller = true;
				for( j = 0; j < fallers.length; j++ ) {
					pill = player.pills[ fallers[ j ] ];
					pill.last = performance.now();
					pill.status = "active";
					pill.id = "&";
					pill.fastFall = true;
					addActivePill( player, pill );
	
					delete player.pills[ fallers[ j ] ];
				}
			}
		}

		return hasFreeFaller;
	}
	
	function getFreeFallers( player, x, y, fallers ) {
		var index, isFreeFall, checks, i, x2, y2;
	
		checks = [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ];
		isFreeFall = true;
		index = x + "_" + y;
		fallers.push( index );
		player.cache[ index ] = true;
	
		// Loop through all directions
		for( i = 0; i < checks.length; i++ ) {
			x2 = x + checks[ i ][ 0 ];
			y2 = y + checks[ i ][ 1 ];
			index = x2 + "_" + y2;
			if( ! player.cache[ index ] && player.pills[ index ] ) {
				isFreeFall &= getFreeFallers( player, x2, y2, fallers );
			} else if( player.viruses[ index ] || y2 > player.floor ) {
				isFreeFall = false;
			}
		}
	
		return isFreeFall;
	}

	function getMatches( player, x, y, c ) {
		var x2, y2, matches, found;
	
		// Count Horizontal
		matches = [];
		found = true;
		x2 = x;
		while( found ) {
			x2 -= 1;
			found = checkMatch( player, x2 + "_" + y, c );
		}
		found = true;
		while( found ) {
			x2 += 1;
			found = checkMatch( player, x2 + "_" + y, c );
			if( found ) {
				matches.push( x2 + "_" + y );
			}
		}
	
		if( matches.length > 3 ) {
			return matches;
		}
		
		// Count Vertical
		matches = [];
		found = true;
		y2 = y;
		while( found ) {
			y2 -= 1;
			found = checkMatch( player, x + "_" + y2, c );
		}
		found = true;
		while( found ) {
			y2 += 1;
			found = checkMatch( player, x + "_" + y2, c );
			if( found ) {
				matches.push( x + "_" + y2 );
			}
		}
	
		return matches;
	}

	function checkMatch( player, index, c ) {
		return (
			( player.pills[ index ] && player.pills[ index ].c === c ) ||
			( player.viruses[ index ] && player.viruses[ index ].c === c )
		);
	}

} )();