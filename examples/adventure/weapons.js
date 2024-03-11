var Weapons = ( function () {
	var g_Weapons = {
		"sword": {
			"color": 7,
			"damage": 2,
			"draw": drawSword,
			"swing": startSwing,
			"update": updateSword,
			"size": 5,
			"swingAngle": 0,
			"swingAngles": [ 0, -$.util.math.deg90 ],
			"startAngle": $.util.math.deg90,
			"startAngles": [ $.util.math.deg90, 0 ],
			"speed": 100,
			"swingStartTime": -1,
			"swingBack": false,
			"swingEnd": 0,
			"isSwinging": false
		}
	};

	function getWeapon( name ) {
		var newWeapon = {};
		$.util.copyProperties( newWeapon, g_Weapons[ name ] );
		return newWeapon;
	}

	function drawSword( player ) {
		$.setColor( player.weapon.color );
		var pos = {
			"x": Math.round( g_Camera.pos.x + player.pos.x + Math.cos( player.angle + player.weapon.startAngle ) * player.size ),
			"y": Math.round( g_Camera.pos.y + player.pos.y + Math.sin( player.angle + player.weapon.startAngle ) * player.size ),
		};
		var pos2 = {
			"x": Math.round( pos.x + Math.cos( player.angle + player.weapon.swingAngle ) * player.weapon.size ),
			"y": Math.round( pos.y + Math.sin( player.angle + player.weapon.swingAngle ) * player.weapon.size )
		}
		$.line( pos.x, pos.y, pos2.x, pos2.y );
	}
	
	function startSwing( sword ) {
		sword.swingStartTime = g_Time;
		sword.swingEndTime = sword.swingStartTime + sword.speed;
		sword.isSwinging = true;
	}
	
	function updateSword( sword ) {
		if( sword.isSwinging ) {
			swingSword( sword );
		}
	}
	
	function swingSword( sword ) {
		if( g_Time >= sword.swingEndTime ) {
			if( sword.swingBack ) {
				sword.swingAngle = sword.swingAngles[ 0 ];
				sword.startAngle = sword.startAngles[ 0 ];
				sword.swingStartTime = -1;
				sword.swingBack = false;
				sword.isSwinging = false;
				return;
			} else {
				sword.swingBack = true;
				sword.swingStartTime = g_Time;
				sword.swingEndTime = sword.swingStartTime + sword.speed;
			}
		}
		var diffTime = ( g_Time - sword.swingStartTime ) / ( sword.swingEndTime - sword.swingStartTime );
		if( sword.swingBack ) {
			var diffAngles = sword.swingAngles[ 0 ] - sword.swingAngles[ 1 ];
			var diffAngles2 = sword.startAngles[ 0 ] - sword.startAngles[ 1 ];
			sword.swingAngle = sword.swingAngles[ 1 ] + diffAngles * diffTime;
			sword.startAngle = sword.startAngles[ 1 ] + diffAngles2 * diffTime;
		} else {
			var diffAngles = sword.swingAngles[ 1 ] - sword.swingAngles[ 0 ];
			var diffAngles2 = sword.startAngles[ 1 ] - sword.startAngles[ 0 ];
			sword.swingAngle = sword.swingAngles[ 0 ] + diffAngles * diffTime;
			sword.startAngle = sword.startAngles[ 0 ] + diffAngles2 * diffTime;
		}
	}

	return {
		"getWeapon": getWeapon
	};
} )();

