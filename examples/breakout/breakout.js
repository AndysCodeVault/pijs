let g_game = {
	"data": {},
	"fn": {},
	"sounds": {
		"bounce_1": $.createAudioPool( "sounds/bounce_1.wav", 2 ),
		"bounce_2": $.createAudioPool( "sounds/bounce_2.wav", 2 ),
		"explosion_1": $.createAudioPool( "sounds/explosion_1.wav", 3 ),
		"explosion_2": $.createAudioPool( "sounds/explosion_2.wav", 3 ),
		"intro_1": $.createAudioPool( "sounds/intro_1.wav", 1 ),
		"intro_2": $.createAudioPool( "sounds/intro_2.wav", 1 ),
		"hit": $.createAudioPool( "sounds/hit.wav", 9 ),
		"clicks": [
			$.createAudioPool( "sounds/click_4.wav", 1 ),
			$.createAudioPool( "sounds/click_3.wav", 1 ),
			$.createAudioPool( "sounds/click_2.wav", 1 ),
			$.createAudioPool( "sounds/click_1.wav", 1 ),
			$.createAudioPool( "sounds/click_3.wav", 1 )
		],
		"lose": $.createAudioPool( "sounds/lose_2.wav", 1 ),
		"win": $.createAudioPool( "sounds/win.mp3", 1 )
	},
	"countDown": 5,
	"status": "init"
};

$.ready( () => {
	g_menu.fn.init();
} );

g_game.data.cracks = [
	"bf4 bd br9 d r5 d r7 d r3",
	"bl8 bu3 bl7 g5 e2 h4",
	"br22 bd3 f3 h3 e3",
	"bl25 l2 e3 g3 h l2 h",
	"br31 bd9 r2 f r2 l u e4 bl8 g4 l g l g2 e2 h3"
];

g_game.fn.init = function init() {
	$.setVolume( 0.5 );
	$.playAudioPool( g_game.sounds.intro_1 );
	$.screen( "315x200", null, null, true );
	let map = {};
	map.blockWidth = 45;
	map.blockHeight = 15;
	map.data = "" +
			"0000000" +
			"0T000T0" +
			"000T000" +
			"0T000T0" +
			"0T0T0T0";
	g_game.fn.initLevel( map );
	g_game.status = "starting";
	g_game.fn.run();
};

g_game.fn.initLevel = function initLevel( map ) {
	const bricks = {
		"0": {
			"color": 1,
			"fillColor": 9,
			"health": 0.25
		},
		"1": {
			"color": 3,
			"fillColor": 11,
			"health": 0.25
		},
		"2": {
			"color": 37,
			"fillColor": 36,
			"health": 0.25
		},
		"3": {
			"color": 80,
			"fillColor": 79,
			"health": 0.25
		},
		"4": {
			"color": 35,
			"fillColor": 34,
			"health": 0.25
		},
		"5": {
			"color": 7,
			"fillColor": 8,
			"health": 1
		},
		"T": {
			"color": 12,
			"fillColor": 4,
			"health": 0.2
		},
	};
	const paddleWidth = 30;
	const paddleX = Math.round( $.width() / 2 - paddleWidth / 2 );
	
	g_game.data.score = 100;
	g_game.data.bricks = [];
	g_game.data.explosions = [];
	g_game.data.paddle = {
		"speed": 0.25,
		"x": paddleX,
		"y": 160,
		"width": paddleWidth,
		"height": 10,
		"color": "yellow",
		"fillColor": "green"
	};
	g_game.data.frames = 0;
	g_game.data.lastFrameCheck = 0;
	g_game.data.fps = 0;
	g_game.data.lastTime = Date.now();
	g_game.data.ball = g_game.fn.initBall();
	let x = 0;
	let y = 0;
	for( let i = 0; i < map.data.length; i += 1 ) {
		const brick = structuredClone( bricks[ map.data.charAt( i ) ] );
		if( brick !== undefined ) {
			brick.type = map.data.charAt( i );
			brick.x = x;
			brick.y = y;
			brick.width = map.blockWidth;
			brick.height = map.blockHeight;
			brick.damage = 0;
			g_game.data.bricks.push( brick );
		}
		x += map.blockWidth;
		if( x > $.width() - map.blockWidth ) {
			x = 0;
			y += map.blockHeight;
		}
	}
};

g_game.fn.initBall = function initBall() {
	const ball = {
		"x": Math.round( $.width() / 2 ) - 5,
		"y": 100,
		"speed": 0.15,
		"radius": 4,
		"color": "orange",
		"fillColor": "red",
		"damage": 0.1,
		"delay": 4000
	};
	ball.dx = ( Math.random() - 0.5 ) * ball.speed;
	ball.dy = ball.speed * 0.75;

	return ball;
};

g_game.fn.run = function run() {
	g_game.data.frames += 1;
	const t = Date.now();
	let dt = t - g_game.data.lastTime;
	if( dt > 1000 ) {
		dt = 1000;
	}
	g_game.data.lastTime = t;
	g_game.fn.frameCheck( t );
	g_game.fn.handleMovement( dt );
	g_game.fn.handleExplosions( dt );
	g_game.fn.handleCollisions( dt );
	g_game.fn.handleMouseInput( dt );
	$.cls();
	g_game.fn.drawLevel();

	if( g_game.data.bricks.length === 0 ) {
		$.playAudioPool( g_game.sounds.win );
		g_game.status = "level-complete";
	}
	requestAnimationFrame( g_game.fn.run );
};

g_game.fn.handleCollisions = function handleCollisions() {
    g_game.fn.handlePaddleCollision();
	g_game.fn.handleBrickCollision();
	g_game.fn.handleWallCollision();
};

g_game.fn.handlePaddleCollision = function handlePaddleCollision() {
	const ball = g_game.data.ball;
    const paddle = g_game.data.paddle;
	const collision = g_physics.fn.detectCollisionSide( ball, paddle );
    if ( collision && collision === "top" ) {
		const relativePos = ( ( ball.x - paddle.x ) / paddle.width ) - 0.5;
		ball.dx = relativePos * ball.speed;
		ball.dy = ball.dy * -1;
		ball.y = paddle.y - ball.radius;
    } else if( collision ) {
		if( collision === "left" ) {
			ball.x = paddle.x - ball.radius;
		} else if( collision === "right" ) {
			ball.x = paddle.x + paddle.width + ball.radius;
		} else {
			ball.y = paddle.y + paddle.height;
		}
	}
	if( collision ) {
		$.playAudioPool( g_game.sounds.bounce_2 );
		g_game.data.collision = collision;
	}
};

g_game.fn.handleBrickCollision = function handleBrickCollision() {
	const ball = g_game.data.ball;
    const bricks = g_game.data.bricks;
	const bricksToRemove = [];

	let isBallCollided = false;

	// Ball collision with bricks
    for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[ i ];

		// Check for collision with ball
		if( !isBallCollided ) {
			const collision = g_physics.fn.detectCollisionSide( ball, brick );
			if ( collision ) {
				isBallCollided = true;
				brick.damage += ball.damage;

				// If the brick is destroyed
				if (brick.damage >= brick.health) {
					bricksToRemove.push( i );
					if( brick.type === "T" ) {
						g_game.fn.createExplosion(
							brick.x + brick.width / 2, brick.y + brick.height / 2
						);
					} else {
						$.playAudioPool( g_game.sounds.hit );
					}
				} else {
					$.playAudioPool( g_game.sounds.bounce_1 );
				}
				if( collision === "top" || collision === "bottom" ) {
					ball.dy *= -1;
				} else {
					ball.dx *= -1;
				}
			}
		}
		// Check for collision with explosions
		for( let j = 0; j < g_game.data.explosions.length; j += 1 ) {
			if( g_physics.fn.detectCollisionSide( g_game.data.explosions[ j ], brick ) ) {
				brick.damage += 0.01;
				if( brick.damage >= brick.health ) {
					if( bricksToRemove.indexOf( i ) === -1 ) {
						//$.playAudioPool( g_game.sounds.hit );
						bricksToRemove.push( i );
					}
				}
			}
		}
    }

	for( let i = 0; i < bricksToRemove.length; i += 1 ) {
		bricks.splice( bricksToRemove[ i ], 1 );
	}
};

g_game.fn.handleWallCollision = function handleWallCollision() {
	const ball = g_game.data.ball;
	let isBounce = false;

	// Ball collision with walls
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= $.width()) {
		ball.dx *= -1;
		if( ball.x - ball.radius + ball.dx < 0 ) {
			ball.x = ball.radius;
		} else if( ball.x + ball.dx + ball.radius > $.width() ) {
			ball.x = $.width() - ball.radius;
		}
		isBounce = true;
    }

    if (ball.y - ball.radius <= 0) {
		ball.dy *= -1;
		if( ball.y - ball.radius + ball.dx < 0 ) {
			ball.y = ball.radius;
		}
		isBounce = true;
    }

    // Check if the ball missed the paddle and went out of bounds
    if (ball.y + ball.radius >= $.height()) {
        $.playAudioPool( g_game.sounds.lose );
		g_game.data.ball = g_game.fn.initBall();
    } else if( isBounce ) {
		$.playAudioPool( g_game.sounds.bounce_2 );
	}
};

g_game.fn.handleMovement = function handleMovement( dt ) {
	if( g_game.data.ball.delay <= 0 ) {
		g_game.data.ball.x += g_game.data.ball.dx * dt;
		g_game.data.ball.y += g_game.data.ball.dy * dt;
	} else {
		g_game.data.ball.delay -= dt;
	}
};

g_game.fn.handleExplosions = function handleExplosions( dt ) {
	for( let i = 0; i < g_game.data.explosions.length; i++ ) {
		g_game.data.explosions[ i ].radius += dt * 0.2;
		if( g_game.data.explosions[ i ].radius > 80 ) {
			g_game.data.explosions.splice( i, 1 );
			break;
		}
	}
};

g_game.fn.handleMouseInput = function handleMouseInput( dt ) {
	let mouse = $.inmouse();
	const paddle = g_game.data.paddle;
	if( mouse.x - 1 > paddle.x + paddle.width / 2 && paddle.x + paddle.width <= $.width() ) {
		paddle.x += ( paddle.speed * dt );
	} else if( mouse.x + 1 < paddle.x + paddle.width / 2 && paddle.x >= 0 ) {
		paddle.x -= ( paddle.speed * dt );
	}
};

g_game.fn.createExplosion = function createExplosion( x, y ) {
	$.playAudioPool( g_game.sounds.explosion_1 );
	g_game.data.explosions.push( {
		"x": x,
		"y": y,
		"radius": 1
	} );
};

g_game.fn.frameCheck = function frameCheck( t ) {
	if( t > g_game.data.lastFrameCheck + 1000 ) {
		g_game.data.fps = Math.round(
			g_game.data.frames / ( ( t - g_game.data.lastFrameCheck ) / 1000 )
		);
		g_game.data.frames = 0;
		g_game.data.lastFrameCheck = t;
	}
};

g_game.fn.drawLevel = function drawLevel() {
	if( g_game.status === "starting" ) {
		g_game.fn.drawCountDown();
	}
	g_game.fn.drawStatusBar();
	for( let i = 0; i < g_game.data.bricks.length; i += 1 ) {
		g_game.fn.drawBrick( g_game.data.bricks[ i ] );
	}
	g_game.fn.drawPaddle( g_game.data.paddle );
	g_game.fn.drawBall( g_game.data.ball );
	for( let i = 0; i < g_game.data.explosions.length; i += 1 ) {
		g_game.fn.drawExplosion( g_game.data.explosions[ i ] );
	}
};

g_game.fn.drawBrick = function drawBrick( brick ) {
	$.setColor( 0 );
	$.rect( brick );
	$.setPosPx( brick.x + 3, brick.y + 2 );
	if( brick.damage > 0 ) {
		$.pset( brick.x, brick.y );
		const healthPct = brick.damage / brick.health;
		const step = 1 / g_game.data.cracks.length;
		let i = 0;
		for( let d = 0; d < healthPct; d += step ) {
			if( i < g_game.data.cracks.length ) {
				$.draw( g_game.data.cracks[ i ] );
			}
			i += 1;
		}
	}
};

g_game.fn.drawPaddle = function drawPaddle( paddle ) {
	$.setColor( paddle.color );
	$.rect(
		Math.round( paddle.x ),
		Math.round( paddle.y ),
		Math.round( paddle.width ),
		Math.round( paddle.height ),
		paddle.fillColor
	);
};

g_game.fn.drawBall = function drawBall( ball ) {
	$.setColor( ball.color );
	$.circle( Math.round( ball.x ), Math.round( ball.y ), ball.radius, ball.fillColor );
};

g_game.fn.drawExplosion = function drawExplosion( explosion ) {
	let color = {
		"r": 255,
		"g": 255,
		"b": 0
	};
	for( let r = 1; r <= explosion.radius; r += 1 ) {
		$.setColor( color );
		$.circle( explosion.x, explosion.y, r );
		if( color.g > 0 ) {
			color.g -= 20;
			if( color.g < 0 ) {
				color.g = 0;
			}
		} else {
			color.r -= 5;
			if( color.r < 0 ) {
				color.r = 0;
			}
		}
	}
};

g_game.fn.drawStatusBar = function drawStatusBar() {
	$.setPos( 3, 23 );
	$.setColor( "orange" );
	$.print( "3", true );
	g_game.fn.drawBall( {
		"x": 12,
		"y": 187,
		"radius": 4,
		"color": "orange",
		"fillColor": "red"
	} );
	const scoreText = g_game.data.score + "";
	$.setPos( $.getCols() - scoreText.length - 1, 23 );
	$.print( scoreText, true );
	
	if( g_game.data.collision ) {
		//$.print( g_game.data.collision, true, true );
	} else {
		//$.print( g_game.data.fps, true, true );
	}
	$.print( g_game.status, true, true );
};

g_game.fn.drawCountDown = function drawCountDown() {
	if( g_game.data.ball.delay > 0 ) {
		const texts = [
			"1",
			"2",
			"3",
			"READY"
		];
		$.setPos( 0, 10 );
		const index = Math.floor( g_game.data.ball.delay / 1000 );
		$.print( texts[ index ], true, true );
		if( g_game.countDown !== index ) {
			$.playAudioPool( g_game.sounds.clicks[ index ] );
			g_game.countDown = index;
		}
	} else {
		$.playAudioPool( g_game.sounds.clicks[ 0 ] );
		g_game.status = "playing";
	}
}
