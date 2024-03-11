var Map = ( function () {

	var m_Map;

	function initLevel() {
		var minX = -1000;
		var maxX = 1000;
		var minY = -1000;
		var maxY = 1000;
	
		// Get random spots
		for( var i = 0; i < 1000; i++ ) {
			var x = Math.round( $.util.rndRange( minX, maxX ) );
			var y = Math.round( $.util.rndRange( minY, maxY ) );
			g_Level.points.push( {
				"x": x,
				"y": y,
				"color": 8
			} );
		}
	
		var x = g_Level.gridSize / 2;
		var y = g_Level.gridSize / 2;
		m_Map = g_Level.map.split( "\n" );
		for( var i = 0; i < m_Map.length; i++ ) {
			for( j = 0; j < m_Map[ i ].length; j++ ) {
				var part = m_Map[ i ][ j ];
				if( part === "S" ) {
					g_Player1.pos.x = x;
					g_Player1.pos.y = y - 5;
					g_Player2.pos.x = x;
					g_Player2.pos.y = y + 5;
				}
				if( part === "+" ) {
					g_Level.walls.push( { "x": x, "y": y, "i": i, "j": j } );
				}
				x += g_Level.gridSize;
			}
			x = g_Level.gridSize / 2;
			y += g_Level.gridSize;
		}

		for( var i = 0; i < g_Level.walls.length; i++ ) {
			var wall = g_Level.walls[ i ];

			// Find right vertex
			var i2 = wall.i;
			var j2 = wall.j + 1;
			var check = "";
			if( i2 < m_Map.length && j2 < m_Map[ i2 ].length && m_Map[ i2 ][ j2 ] === "-" ) {
				x = wall.x + g_Level.gridSize;
				y = wall.y;
				do {
					j2 += 1;
					check = m_Map[ i2 ][ j2 ];
					x += g_Level.gridSize;
				} while ( j2 < m_Map[ i2 ].length && check !== "+" );
				if( check === "+" ) {
					wall.right = { "x": x, "y": y };
				}
			}

			// Find down vertex
			i2 = wall.i + 1;
			j2 = wall.j;
			if( i2 < m_Map.length && j2 < m_Map[ i2 ].length && m_Map[ i2 ][ j2 ] === "|" ) {
				x = wall.x;
				y = wall.y + g_Level.gridSize;
				do {
					i2 += 1;
					check = m_Map[ i2 ][ j2 ];
					y += g_Level.gridSize;
				} while ( i2 < m_Map.length && check !== "+" );
				if( check === "+" ) {
					wall.down = { "x": x, "y": y };
				}
			}
		}
	}

	function moveObject( player, dx, dy ) {
		var x2 = player.pos.x + dx;
		var y2 = player.pos.y + dy;
		var i = Math.floor( y2 / g_Level.gridSize );
		var j = Math.floor( x2 / g_Level.gridSize );
		var block = m_Map[ i ][ j ];
		if( block === "-" ) {
			var by = i * g_Level.gridSize + g_Level.gridSize / 2;
			if (
				( player.pos.y <= by - player.size && y2 >= by - player.size ) ||
				( player.pos.y >= by + player.size && y2 <= by + player.size )
			) {
				dy = 0;
			}
		}
		if( block === "|" ) {
			var bx = j * g_Level.gridSize + g_Level.gridSize / 2;
			if (
				( player.pos.x <= bx - player.size && x2 >= bx - player.size ) ||
				( player.pos.x >= bx + player.size && x2 <= bx + player.size )
			) {
				dx = 0;
			}
		}
		player.pos.x += dx;
		player.pos.y += dy;
	}

	function drawLevel() {
		for( var i = 0; i < g_Level.points.length; i++ ) {
			$.setColor( g_Level.points[ i ].color );
			$.pset( g_Camera.pos.x + g_Level.points[ i ].x, g_Camera.pos.y + g_Level.points[ i ].y );
		}
		for( var i = 0; i < g_Level.walls.length; i++ ) {
			var wall =  g_Level.walls[ i ];
			$.setColor( 5 );

			if( wall.right ) {

				// Top Wall
				// $.setColor( 8 );
				// $.line(
				// 	g_Camera.pos.x + wall.x,
				// 	g_Camera.pos.y + wall.y,
				// 	g_Camera.pos.x + wall.right.x + g_Level.gridSize,
				// 	g_Camera.pos.y + wall.right.y
				// );
				if( wall.down ) {
					$.setColor( 5 );
					// Bottom Wall
					$.line(
						g_Camera.pos.x + wall.x + g_Level.gridSize,
						g_Camera.pos.y + wall.y + g_Level.gridSize,
						g_Camera.pos.x + wall.right.x + g_Level.gridSize,
						g_Camera.pos.y + wall.right.y + g_Level.gridSize
					);
				} else {
					// Top Wall
					$.setColor( 6 );
					$.line(
						g_Camera.pos.x + wall.x + g_Level.gridSize,
						g_Camera.pos.y + wall.y,
						g_Camera.pos.x + wall.right.x + g_Level.gridSize,
						g_Camera.pos.y + wall.right.y
					);
					//$.setColor( 8 );
					// Right Wall
					// $.line(
					// 	g_Camera.pos.x + wall.right.x + g_Level.gridSize,
					// 	g_Camera.pos.y + wall.right.y,
					// 	g_Camera.pos.x + wall.right.x + g_Level.gridSize,
					// 	g_Camera.pos.y + wall.right.y + g_Level.gridSize
					// );
				}
				// // Left Wall
				// $.setColor( 8 );
				// $.line(
				// 	g_Camera.pos.x + wall.x,
				// 	g_Camera.pos.y + wall.y,
				// 	g_Camera.pos.x + wall.x,
				// 	g_Camera.pos.y + wall.y + g_Level.gridSize
				// );
			}
			if( wall.down ) {
				if( wall.right ) {
					$.setColor( 7 );
					$.line(
						g_Camera.pos.x + wall.x + g_Level.gridSize,
						g_Camera.pos.y + wall.y + g_Level.gridSize,
						g_Camera.pos.x + wall.down.x + g_Level.gridSize,
						g_Camera.pos.y + wall.down.y
					);
				} else {
					// Wall Left
					$.setColor( 8 );
					$.line(
						g_Camera.pos.x + wall.x,
						g_Camera.pos.y + wall.y + g_Level.gridSize,
						g_Camera.pos.x + wall.down.x,
						g_Camera.pos.y + wall.down.y + g_Level.gridSize
					);
				}
				// $.setColor( 5 );
				// $.line(
				// 	g_Camera.pos.x + wall.x + g_Level.gridSize,
				// 	g_Camera.pos.y + wall.y,
				// 	g_Camera.pos.x + wall.down.x + g_Level.gridSize,
				// 	g_Camera.pos.y + wall.down.y
				// );
			}
		}
	}

	function drawLevel2() {
		for( var i = 0; i < g_Level.points.length; i++ ) {
			$.setColor( g_Level.points[ i ].color );
			$.pset( g_Camera.pos.x + g_Level.points[ i ].x, g_Camera.pos.y + g_Level.points[ i ].y );
		}
		for( var i = 0; i < g_Level.walls.length; i++ ) {
			var wall =  g_Level.walls[ i ];
			$.setColor( 5 );

			if( wall.right ) {
				$.line(
					g_Camera.pos.x + wall.x,
					g_Camera.pos.y + wall.y,
					g_Camera.pos.x + wall.right.x,
					g_Camera.pos.y + wall.right.y
				);
			}
			if( wall.down ) {
				$.line(
					g_Camera.pos.x + wall.x,
					g_Camera.pos.y + wall.y,
					g_Camera.pos.x + wall.down.x,
					g_Camera.pos.y + wall.down.y
				);
			}
		}
		for( var i = 0; i < m_Map.length; i += 1 ) {
			for( var j = 0; j < m_Map [ i ].length; j += 1 ) {
				var x = g_Camera.pos.x + j * g_Level.gridSize;
				var y =  g_Camera.pos.y + i * g_Level.gridSize;
				if( x < $.width() && y < $.height() - 12 && x > 0 && y > 0 ) {
					$.setPosPx( x, y );
					//$.print( m_Map[ i ][ j ] );
					if( m_Map[ i ][ j ] === " " ) {
						$.print( "." );
					} else {
						$.print( m_Map[ i ][ j ] );
					}
				}
			}
		}
		$.setPosPx( 2, 2 );
		var i = Math.floor( g_Player1.pos.y / g_Level.gridSize );
		var j = Math.floor( g_Player1.pos.x / g_Level.gridSize );
		if( m_Map[ i ][ j ] === " " ) {
			$.print( "." );
		} else {
			$.print( m_Map[ i ][ j ] );
		}
		
	}

	return {
		"initLevel": initLevel,
		"moveObject": moveObject,
		"drawLevel": drawLevel2
	};
} )();
