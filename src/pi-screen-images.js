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
	[ "src", "width", "height", "margin", "name" ]
);
function loadSpritesheet( args ) {
	var src, spriteWidth, spriteHeight, margin, name;

	src = args[ 0 ];
	spriteWidth = args[ 1 ];
	spriteHeight = args[ 2 ];
	margin = args[ 3 ];
	name = args[ 4 ];

	if( margin == null ) {
		margin = 0;
	}

	// Validate spriteWidth and spriteHeight
	if(
		! pi.util.isInteger( spriteWidth ) ||
		! pi.util.isInteger( spriteHeight )
	) {
		m_piData.log( "loadSpriteSheet: width, and height must be integers." );
		return;
	}

	// size cannot be less than 1
	if( spriteWidth < 1 || spriteHeight < 1 ) {
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
		var imageData, width, height, x1, y1, x2, y2;

		// Update the image data
		imageData = m_piData.images[ name ];
		imageData.type = "spritesheet";
		imageData.spriteWidth = spriteWidth;
		imageData.spriteHeight = spriteHeight;
		imageData.margin = margin;
		imageData.frames = [];

		// Prepare for loops
		width = imageData.image.width;
		height = imageData.image.height;
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
					"height": imageData.spriteHeight
				} );
				x1 += imageData.spriteWidth + imageData.margin;
				x2 = x1 + imageData.spriteWidth;
			}
			x1 = imageData.margin;
			x2 = x1 + imageData.spriteWidth;
			y1 += imageData.spriteHeight + imageData.margin;
			y2 = y1 + imageData.spriteHeight;
		}
	};

	loadImage( [ src, name ] );

	return name;
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
				"drawImage: image source object type. Must be an image" +
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

	if( scaleX === undefined || isNaN( Number( scaleX ) ) ) {
		scaleX = 1;
	}

	if( scaleY === undefined || isNaN( Number( scaleY ) ) ) {
		scaleY = 1;
	}

	if( ! angle ) {
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
}

// End of File Encapsulation
} )();
