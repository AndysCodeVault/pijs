/*
* File: pi-screen-images.js
*/

// Start of File Encapsulation
( function () {

"use strict";

var m_piData, m_piWait, m_piResume, m_callback, pi;

pi = window.pi;
m_piData = pi._.data;
m_piWait = pi._.wait;
m_piResume = pi._.resume;
m_callback = null;

pi._.addCommand( "loadImage", loadImage, false, false, [ "src", "name" ] );
function loadImage( args ) {
	var src, name, image, callback, tempOnload;

	src = args[ 0 ];
	name = args[ 1 ];

	if( typeof src === "string" ) {

		// Create a new image
		image = new Image();

		// Set the source
		image.src = src;

	} else {
		if(
			! src || ( src.tagName !== "IMG" && src.tagName !== "CANVAS" )
		) {
			m_piData.log(
				"loadImage: src must be a string, image element, or canvas."
			);
			return;
		}
		image = src;
	}

	if( typeof name !== "string" ) {
		name = "" + m_piData.imageCount;
		m_piData.imageCount += 1;
	}

	m_piData.images[ name ] = {
		"image": null,
		"type": "image"
	};

	// Store callback locally
	callback = m_callback;
	m_callback = null;

	if( ! image.complete ) {
		m_piWait();
		if( pi.util.isFunction( image.onload ) ) {
			tempOnload = image.onload;
		}
		image.onload = function () {
			if( tempOnload ) {
				tempOnload();
			}
			m_piData.images[ name ].image = image;
			if( pi.util.isFunction( callback ) ) {
				callback();
			}
			m_piResume();
		};
	} else {
		m_piData.images[ name ].image = image;
		if( pi.util.isFunction( callback ) ) {
			callback();
		}
	}

	return name;
}

pi._.addCommand(
	"loadSpritesheet", loadSpritesheet, false, false,
	[ "src", "name", "width", "height", "margin" ]
);
function loadSpritesheet( args ) {
	var src, spriteWidth, spriteHeight, margin, name, isAuto;

	src = args[ 0 ];
	name = args[ 1 ];
	spriteWidth = args[ 2 ];
	spriteHeight = args[ 3 ];
	margin = args[ 4 ];

	if( margin == null ) {
		margin = 0;
	}

	if( spriteWidth == null && spriteHeight == null ) {
		isAuto = true;
		spriteWidth = 0;
		spriteHeight = 0;
		margin = 0;
	} else {
		isAuto = false;
	}

	spriteWidth = Math.round( spriteWidth );
	spriteHeight = Math.round( spriteHeight );
	margin = Math.round( margin );

	// Validate spriteWidth and spriteHeight
	if(
		! isAuto && (
			! pi.util.isInteger( spriteWidth ) ||
			! pi.util.isInteger( spriteHeight )
		)
	) {
		m_piData.log( "loadSpriteSheet: width, and height must be integers." );
		return;
	}

	// size cannot be less than 1
	if( ! isAuto && ( spriteWidth < 1 || spriteHeight < 1 ) ) {
		m_piData.log(
			"loadSpriteSheet: width, and height must be greater " +
			"than 0."
		);
		return;
	}

	// Validate margin
	if( ! pi.util.isInteger( margin ) ) {
		m_piData.log( "loadSpriteSheet: margin must be an integer." );
		return;
	}

	// Validate name
	if( typeof name !== "string" ) {
		name = "" + m_piData.imageCount;
		m_piData.imageCount += 1;
	}

	// Load the frames when the image gets loaded
	m_callback = function () {

		function getCluster( x, y, frameData ) {
			var name, i, index, clusters, cluster, x2, y2, name2;

			name = x + "_" + y;
			if( searched[ name ] || x < 0 || x >= width || y < 0 || y >= height ) {
				return;
			}
			clusters = [];
			clusters.push( [ x, y, name ] );
			while( clusters.length > 0 ) {
				cluster = clusters.pop();
				x = cluster[ 0 ];
				y = cluster[ 1 ];
				name = cluster[ 2 ];
				searched[ name ] = true;
				index = ( x + y * width ) * 4;
				if( data[ index + 3 ] > 0 ) {
					frameData.x = Math.min( frameData.x, x );
					frameData.y = Math.min( frameData.y, y );
					frameData.right = Math.max( frameData.right, x );
					frameData.bottom = Math.max( frameData.bottom, y );
					frameData.width = frameData.right - frameData.x + 1;
					frameData.height = frameData.bottom - frameData.y + 1;
					for( i = 0; i < dirs.length; i++ ) {
						x2 = x + dirs[ i ][ 0 ];
						y2 = y + dirs[ i ][ 1 ];
						name2 = x2 + "_" + y2;
						if( !( searched[ name2 ] || x2 < 0 || x2 >= width || y2 < 0 || y2 >= height ) ) {
							clusters.push( [ x2, y2, name2 ] );
						}
					}
				}
			}
		}

		var imageData, width, height, x1, y1, x2, y2, searched, canvas, context, data, i, index, dirs,
			frameData;

		// Update the image data
		imageData = m_piData.images[ name ];
		imageData.type = "spritesheet";
		imageData.spriteWidth = spriteWidth;
		imageData.spriteHeight = spriteHeight;
		imageData.margin = margin;
		imageData.frames = [];
		imageData.isAuto = isAuto;

		// Prepare for loops
		width = imageData.image.width;
		height = imageData.image.height;

		if( imageData.isAuto ) {

			// Find all clusters of pixels
			searched = {};
			canvas = document.createElement( "canvas" );
			canvas.width = width;
			canvas.height = height;
			context = canvas.getContext( "2d", { "willReadFrequently": true } );
			context.drawImage( imageData.image, 0, 0 );
			dirs = [
				[ -1, -1 ], [ 0, -1 ], [ 1, -1 ],
				[ -1,  0 ], 		   [ 1,  0 ],
				[ -1,  1 ], [ 0,  1 ], [ 1,  1 ],
			];
			data = context.getImageData( 0, 0, width, height ).data;

			// Read the alpha component of each pixel
			for( i = 3; i < data.length; i += 4 ) {
				if( data[ i ] > 0 ) {
					index = ( i - 3 ) / 4;
					x1 = index % width;
					y1 = Math.floor( index / width );
					frameData = {
						"x": width, "y": height, "width": 0, "height": 0, "right": 0, "bottom": 0
					};
					getCluster( x1, y1, frameData );
					if( ( frameData.width + frameData.height ) > 4 ) {
						imageData.frames.push( frameData );
					}
				}
			}

		} else {
			x1 = imageData.margin;
			y1 = imageData.margin;
			x2 = x1 + imageData.spriteWidth;
			y2 = y1 + imageData.spriteHeight;

			// Loop through all the frames
			while( y2 <= height - imageData.margin ) {
				while( x2 <= width - imageData.margin ) {
					imageData.frames.push( {
						"x": x1,
						"y": y1,
						"width": imageData.spriteWidth,
						"height": imageData.spriteHeight,
						"right": x1 + imageData.spriteWidth - 1,
						"bottom": y2 + imageData.spriteHeight - 1
					} );
					x1 += imageData.spriteWidth + imageData.margin;
					x2 = x1 + imageData.spriteWidth;
				}
				x1 = imageData.margin;
				x2 = x1 + imageData.spriteWidth;
				y1 += imageData.spriteHeight + imageData.margin;
				y2 = y1 + imageData.spriteHeight;
			}
		}
	};

	loadImage( [ src, name ] );

	return name;
}

pi._.addCommand( "getSpritesheetData", getSpritesheetData, false, true,
	[ "name" ]
);
function getSpritesheetData( screenData, args ) {
	var name, sprite, i, spriteData;

	name = args[ 0 ];

	// Validate name
	if( ! m_piData.images[ name ] ) {
		m_piData.log( "getSpritesheetData: invalid sprite name" );
		return;
	}

	sprite = m_piData.images[ name ];

	if( sprite.type !== "spritesheet" ) {
		m_piData.log( "getSpritesheetData: image is not a sprite" );
		return;
	}

	spriteData = {
		"frameCount": sprite.frames.length,
		"frames": []
	};

	for( i = 0; i < sprite.frames.length; i++ ) {
		spriteData.frames.push( {
			"index": i,
			"x": sprite.frames[ i ].x,
			"y": sprite.frames[ i ].y,
			"width": sprite.frames[ i ].width,
			"height": sprite.frames[ i ].height,
			"left": sprite.frames[ i ].x,
			"top": sprite.frames[ i ].y,
			"right": sprite.frames[ i ].right,
			"bottom": sprite.frames[ i ].bottom
		} );
	}
	return spriteData;
}

pi._.addCommand( "getImage", getImage, false, true,
	[ "name", "x1", "y1", "x2", "y2" ]
);
function getImage( screenData, args ) {
	var name, x1, y1, x2, y2, canvas, context, width, height;

	name = args[ 0 ];
	x1 = Math.round( args[ 1 ] );
	y1 = Math.round( args[ 2 ] );
	x2 = Math.round( args[ 3 ] );
	y2 = Math.round( args[ 4 ] );

	if( isNaN( x1 ) || isNaN( y1 ) || isNaN( y2 ) || isNaN( y2 ) ) {
		m_piData.log( "getImage: parameters x1, x2, y1, y2 must be integers." );
		return;
	}

	if( typeof name !== "string" ) {
		name = "" + m_piData.imageCount;
		m_piData.imageCount += 1;
	} else if( m_piData.images[ name ] ) {
		m_piData.log(
			"getImage: name " + name + " is already used; name must be unique."
		);
		return;
	}

	canvas = document.createElement( "canvas" );
	context = canvas.getContext( "2d" );
	width = Math.abs( x1 - x2 );
	height = Math.abs( y1 - y2 );
	canvas.width = width;
	canvas.height = height;
	screenData.screenObj.render();
	context.drawImage( screenData.screenObj.canvas(), x1, y1, width, height, 0, 0, width, height );

	m_piData.images[ name ] = {
		"image": canvas,
		"type": "image"
	};

	return name;
}

pi._.addCommand( "removeImage", removeImage, false, false,
	[ "name" ]
);
function removeImage( args ) {
	var name;

	name = args[ 0 ];

	if( typeof name !== "string" ) {
		m_piData.log( "removeImage: name must be a string." );
		return;
	}

	delete m_piData.images[ name ];
}

pi._.addCommand( "drawImage", drawImage, false, true,
	[ "name", "x", "y", "angle", "anchorX", "anchorY", "alpha", "scaleX", "scaleY" ]
);
function drawImage( screenData, args ) {
	var name, x, y, angle, anchorX, anchorY, alpha, img, scaleX, scaleY;

	name = args[ 0 ];
	x = args[ 1 ];
	y = args[ 2 ];
	angle = args[ 3 ];
	anchorX = args[ 4 ];
	anchorY = args[ 5 ];
	alpha = args[ 6 ];
	scaleX = args[ 7 ];
	scaleY = args[ 8 ];

	if( typeof name === "string" ) {
		if( ! m_piData.images[ name ] ) {
			m_piData.log( "drawImage: invalid image name" );
			return;
		}
		img = m_piData.images[ name ].image;
	} else {
		if( ! name && ! name.canvas && ! name.getContext ) {
			m_piData.log(
				"drawImage: image source object type must be an image" +
				" already loaded by the loadImage command or a screen."
			);
			return;
		}
		if( pi.util.isFunction( name.canvas ) ) {
			img = name.canvas();
		} else {
			img = name;
		}
	}

	if( isNaN( x ) || isNaN( y ) ) {
		m_piData.log( "drawImage: parameters x and y must be numbers" );
		return;
	}

	drawItem( screenData, img, x, y, angle, anchorX, anchorY, alpha, null, scaleX, scaleY );
}

pi._.addCommand( "drawSprite", drawSprite, false, true,
	[
		"name", "frame", "x", "y", "angle", "anchorX", "anchorY", "img",
		"alpha", "scaleX", "scaleY"
	]
);
function drawSprite( screenData, args ) {
	var name, frame, x, y, angle, anchorX, anchorY, alpha, img, scaleX, scaleY;

	name = args[ 0 ];
	frame = args[ 1 ];
	x = args[ 2 ];
	y = args[ 3 ];
	angle = args[ 4 ];
	anchorX = args[ 5 ];
	anchorY = args[ 6 ];
	alpha = args[ 7 ];
	scaleX = args[ 8 ];
	scaleY = args[ 9 ];

	// Validate name
	if( ! m_piData.images[ name ] ) {
		m_piData.log( "drawSprite: invalid sprite name" );
		return;
	}

	// Validate frame
	if(
		! pi.util.isInteger( frame ) ||
		frame >= m_piData.images[ name ].frames.length ||
		frame < 0
	) {
		m_piData.log( "drawSprite: frame number is not valid" );
		return;
	}

	if( isNaN( x ) || isNaN( y ) ) {
		m_piData.log( "drawSprite: parameters x and y must be numbers" );
		return;
	}


	img = m_piData.images[ name ].image;

	drawItem(
		screenData, img, x, y, angle, anchorX, anchorY, alpha,
		m_piData.images[ name ].frames[ frame ], scaleX, scaleY
	);
}

function drawItem(
	screenData, img, x, y, angle, anchorX, anchorY, alpha, spriteData, scaleX, scaleY
) {
	var context, oldAlpha;

	if( scaleX == null || isNaN( Number( scaleX ) ) ) {
		scaleX = 1;
	}

	if( scaleY == null || isNaN( Number( scaleY ) ) ) {
		scaleY = 1;
	}

	if( angle == null ) {
		angle = 0;
	}

	// Convert the angle from degrees to radian
	angle = pi.util.degreesToRadian( angle );

	if( ! anchorX ) {
		anchorX = 0;
	}
	if( ! anchorY ) {
		anchorY = 0;
	}

	if( ! alpha && alpha !== 0 ) {
		alpha = 255;
	}

	if( spriteData ) {
		anchorX = Math.round( spriteData.width * anchorX );
		anchorY = Math.round( spriteData.height * anchorY );
	} else {
		anchorX = Math.round( img.width * anchorX );
		anchorY = Math.round( img.height * anchorY );
	}

	context = screenData.context;

	oldAlpha = context.globalAlpha;
	context.globalAlpha = ( alpha / 255 );

	screenData.screenObj.render();

	context.translate( x, y );
	context.rotate( angle );
	context.scale( scaleX, scaleY );
	if( spriteData == null ) {
		context.drawImage( img, -anchorX, -anchorY );
	} else {
		context.drawImage(
			img, 
			spriteData.x, spriteData.y, spriteData.width, spriteData.height,
			-anchorX, -anchorY, spriteData.width, spriteData.height
		);
	}
	context.scale( 1 / scaleX, 1 / scaleY );
	context.rotate( -angle );
	context.translate( -x, -y );
	context.globalAlpha = oldAlpha;

	m_piData.commands.resetImageData( screenData );
}

// End of File Encapsulation
} )();
