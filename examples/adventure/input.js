var Input = ( function () {

	var keyNames = [ {
		"attack": "ControlRight",
		"up": "ArrowUp",
		"left": "ArrowLeft",
		"right": "ArrowRight",
		"down": "ArrowDown",
		"gamepad": 0
	}, {
		"attack": "Space",
		"up": "KeyW",
		"left": "KeyA",
		"right": "KeyD",
		"down": "KeyS",
		"gamepad": 1
	} ];

	function processInput( index, player ) {
		var keys = $.inkey();
		var keyData = keyNames[ index ];

		// Use Weapon
		if( keys[ keyData[ "attack" ] ] && ! player.weapon.isSwinging ) {
			player.weapon.swing( player.weapon );
		}

		// Direction keys
		if( keys[ keyData[ "up" ] ] && keys[ keyData[ "left" ] ] ) {
			// player.pos.x -= player.speed * g_Dt * 0.667;
			// player.pos.y -= player.speed * g_Dt * 0.667;
			Map.moveObject( player, -player.speed * g_Dt * 0.667, -player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg225;
		} else if( keys[ keyData[ "up" ] ] && keys[ keyData[ "right" ] ] ) {
			// player.pos.x += player.speed * g_Dt * 0.667;
			// player.pos.y -= player.speed * g_Dt * 0.667;
			Map.moveObject( player, player.speed * g_Dt * 0.667, -player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg315;
		} else if( keys[ keyData[ "down" ] ] && keys[ keyData[ "left" ] ] ) {
			// player.pos.x -= player.speed * g_Dt * 0.667;
			// player.pos.y += player.speed * g_Dt * 0.667;
			Map.moveObject( player, -player.speed * g_Dt * 0.667, player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg135;
		} else if( keys[ keyData[ "down" ] ] && keys[ keyData[ "right" ] ] ) {
			// player.pos.x += player.speed * g_Dt * 0.667;
			// player.pos.y += player.speed * g_Dt * 0.667;
			Map.moveObject( player, player.speed * g_Dt * 0.667, player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg45;
		} else if( keys[ keyData[ "left" ] ] ) {
			//player.pos.x -= player.speed * g_Dt;
			Map.moveObject( player, -player.speed * g_Dt * 0.667, 0 );
			player.angle = $.util.math.deg180;
		} else if( keys[ keyData[ "right" ] ] ) {
			//player.pos.x += player.speed * g_Dt;
			Map.moveObject( player, player.speed * g_Dt * 0.667, 0 );
			player.angle = 0;
		} else if( keys[ keyData[ "up" ] ] ) {
			//player.pos.y -= player.speed * g_Dt;
			Map.moveObject( player, 0, -player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg270;
		} else if( keys[ keyData[ "down" ] ] ) {
			//player.pos.y += player.speed * g_Dt;
			Map.moveObject( player, 0, player.speed * g_Dt * 0.667 );
			player.angle = $.util.math.deg90;
		}

		var gamepads = $.ingamepads();
		if( gamepads[ keyData[ "gamepad" ] ] ) {
			var dx = gamepads[ keyData[ "gamepad" ] ].axes2[ 0 ];
			var dy = gamepads[ keyData[ "gamepad" ] ].axes2[ 1 ];
			if( Math.abs( dx ) > player.gamepadTolerance || Math.abs( dy ) > player.gamepadTolerance ) {
				//player.pos.x = player.pos.x + dx * player.speed * g_Dt;
				//player.pos.y = player.pos.y + dy * player.speed * g_Dt;
				Map.moveObject( player, dx * player.speed * g_Dt, dy * player.speed * g_Dt );
				player.angle = Math.atan2( dy, dx );
			}
			if( gamepads[ keyData[ "gamepad" ] ].buttons[ 0 ].pressed && ! player.weapon.isSwinging ) {
				player.weapon.swing( player.weapon );
			}
		}
	}

	return {
		"processInput": processInput,
	};

} )();