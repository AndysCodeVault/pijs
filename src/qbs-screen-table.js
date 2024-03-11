/*
* File: qbs-screen-table.js
*/

// Start of File Encapsulation
( function () {

	"use strict";
	var m_qbData, m_borderStyles;

	m_qbData = qbs._.data;

	m_borderStyles = {
		"single": [
			[ 218, 196, 194, 191 ],
			[ 195, 196, 197, 180 ],
			[ 192, 196, 193, 217 ],
			[ 179, 32, 179 ]
		],
		"double": [
			[ 201, 205, 203, 187 ],
			[ 204, 205, 206, 185 ],
			[ 200, 205, 202, 188 ],
			[ 186, 32, 186 ]
		],
		"singleDouble": [
			[ 213, 205, 209, 184 ],
			[ 198, 205, 216, 181 ],
			[ 212, 205, 207, 190 ],
			[ 179, 32, 179 ]
		],
		"doubleSingle": [
			[ 214, 196, 210, 183 ],
			[ 199, 196, 215, 182 ],
			[ 211, 196, 208, 189 ],
			[ 186, 32, 186 ]
		],
		"thick": [
			[ 219, 223, 219, 219 ],
			[ 219, 223, 219, 219 ],
			[ 223, 223, 223, 223 ],
			[ 219, 32, 219 ]
		]
	};
	qbs._.addCommand( "printTable", printTable, false, true,
		[ "items", "tableFormat", "borderStyle", "isCentered" ]
	);
	function printTable( screenData, args ) {

		var items, width, tableFormat, borderStyle, isCentered, isFormatted, i;

		items = args[ 0 ];
		tableFormat = args[ 1 ];
		borderStyle = args[ 2 ];
		isCentered = !!( args[ 3 ] );
		if( ! qbs.util.isArray( items ) ) {
			m_qbData.log( "printTable: items must be an array" );
			return;
		}

		if( ! borderStyle ) {
			borderStyle = m_borderStyles[ "single" ];
		}

		if( tableFormat == null ) {
			isFormatted = false;
		} else if( qbs.util.isArray( tableFormat ) ) {
			for( i = 0; i < tableFormat.length; i++ ) {
				if( typeof tableFormat[ i ] !== "string" ) {
					m_qbData.log(
						"printTable: tableFormat must be an array of strings"
					);
					return;
				}
			}
			isFormatted = true;
		} else {
			m_qbData.log(
				"printTable: tableFormat must be an array"
			);
			return;
		}

		if( typeof borderStyle === "string" && m_borderStyles[ borderStyle ] ) {
			borderStyle = m_borderStyles[ borderStyle ];
		} else if( ! qbs.util.isArray( borderStyle ) ) {
			m_qbData.log(
				"printTable: borderStyle must be an integer or array"
			);
			return;
		}

		if( isFormatted ) {
			return buildFormatedTable(
				screenData, items, borderStyle, tableFormat, isCentered
			);
		} else {
			width = m_qbData.commands.getCols( screenData );
			return buildStandardTable( screenData, items, width, borderStyle );
		}
	}

	function buildStandardTable( screenData, items, width, borders ) {
		var row, col, msg, msgTop, msgMid, msgBot, cellWidth, cellHeight,
			rowWidth, rowPad, bottomRow, boxes, font, startPos, box;

		msg = "";
		boxes = [];
		font = screenData.printCursor.font;
		startPos = m_qbData.commands.getPos( screenData );
		cellHeight = 2;

		for( row = 0; row < items.length; row += 1 ) {

			// Calculate the cellWidth
			cellWidth = Math.floor( width / items[ row ].length );
			if( cellWidth < 3 ) {
				cellWidth = 3;
			}

			rowWidth = ( cellWidth - 2 ) * items[ row ].length +
				items[ row ].length + 1;
			rowPad = Math.round( ( width - rowWidth ) / 2 );
			msgTop = qbs.util.padL( "", rowPad, " " );
			msgMid = msgTop;
			msgBot = msgTop;

			// Format all the cells
			for( col = 0; col < items[ row ].length; col += 1 ) {

				createBox(
					( col * ( cellWidth - 1 ) ) + rowPad,
					( row * 2 ) + startPos.row, boxes, font
				);
				box = boxes[ boxes.length - 1 ];
				box.pos.width = cellWidth - 1;
				box.pos.height = 2;
				box.pixels.width = box.pos.width * font.width;
				box.pixels.height = box.pos.height * font.height;

				if( col === items[ row ].length - 1 ) {
					box.pixels.width += 1;
				}

				if( row === items.length - 1 ) {
					box.pixels.height += 1;
				}

				// Middle cell
				msgMid += String.fromCharCode( borders[ 3 ][ 0 ] ) +
					qbs.util.pad(
						items[ row ][ col ],
						cellWidth - 2,
						String.fromCharCode( borders[ 3 ][ 1 ] )
					);

				if( col === items[ row ].length - 1 ) {
					msgMid += String.fromCharCode( borders[ 3 ][ 2 ] );
				}

				// Top Row
				if( row === 0 ) {

					// Top left corner
					if( col === 0 ) {
						msgTop += String.fromCharCode( borders[ 0 ][ 0 ] );
					} else {
						msgTop += String.fromCharCode( borders[ 0 ][ 2 ] );
					}

					// Top center line
					msgTop += qbs.util.pad( "", cellWidth - 2,
						String.fromCharCode( borders[ 0 ][ 1 ] )
					);

					// Top Right corner
					if( col === items[ row ].length - 1 ) {
						msgTop += String.fromCharCode( borders[ 0 ][ 3 ] );
					}

				}

				// Bottom Row
				if( row === items.length - 1 ) {
					bottomRow = 2;
				} else {
					bottomRow = 1;
				}

				// Bottom Left Corner
				if( col === 0 ) {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 0 ] );
				} else {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 2 ] );
				}

				// Bottom center line
				msgBot += qbs.util.pad( "", cellWidth - 2, String.fromCharCode(
					borders[ bottomRow ][ 1 ] )
				);

				// Bottom Right corner
				if( col === items[ row ].length - 1 ) {
					msgBot += String.fromCharCode( borders[ bottomRow ][ 3 ] );
				}

			}

			// Move to the next row
			if( row === 0 ) {
				msg += msgTop + "\n";
			}
			msg += msgMid + "\n";
			msg += msgBot + "\n";
		}

		msg = msg.substr( 0, msg.length - 1 );
		m_qbData.commands.print( screenData, [ msg ] );

		return boxes;
	}

	function buildFormatedTable(
		screenData, items, borders, tableFormat, isCentered
	) {
		var row, col, msg, cell, cellDirs, boxes, i, pos, posAfter, padding,
			font;

		msg = "";
		boxes = [];
		pos = m_qbData.commands.getPos( screenData );
		font = screenData.printCursor.font;

		// Set padding for centered table
		if( isCentered ) {
			pos.col = Math.floor( ( m_qbData.commands.getCols( screenData ) -
				tableFormat[ 0 ].length ) / 2
			);
		}

		// Create the padding
		padding = qbs.util.pad( "", pos.col, " " );
		m_qbData.commands.setPos( screenData, [ 0, pos.row ] );

		for( row = 0; row < tableFormat.length; row += 1 ) {
			msg += padding;
			for( col = 0; col < tableFormat[ row ].length; col += 1 ) {
				cell = tableFormat[ row ].charAt( col );

				// Table Intersection
				if( cell === "*" ) {

					cellDirs = "" +
						lookCell( col, row, "left", tableFormat ) +
						lookCell( col, row, "right", tableFormat ) +
						lookCell( col, row, "up", tableFormat ) +
						lookCell( col, row, "down", tableFormat );

					if( cellDirs === " - |" ) {

						// Top Left Section
						msg += String.fromCharCode( borders[ 0 ][ 0 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "-- |" ) {

						// Top Middle Section
						msg += String.fromCharCode( borders[ 0 ][ 2 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "-  |" ) {

						// Top Right Section
						msg += String.fromCharCode( borders[ 0 ][ 3 ] );

					} else if( cellDirs === " -||" ) {

						// Middle Left Section
						msg += String.fromCharCode( borders[ 1 ][ 0 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );
	
					} else if( cellDirs === "--||" ) {

						// Middle Middle
						msg += String.fromCharCode( borders[ 1 ][ 2 ] );
						createBox( pos.col + col, pos.row + row, boxes, font );

					} else if( cellDirs === "- ||" ) {

						// Middle Right
						msg += String.fromCharCode( borders[ 1 ][ 3 ] );

					} else if( cellDirs === " -| " ) {

						// Bottom Left
						msg += String.fromCharCode( borders[ 2 ][ 0 ] );

					} else if( cellDirs === "--| " ) {

						// Bottom Middle
						msg += String.fromCharCode( borders[ 2 ][ 2 ] );

					} else if( cellDirs === "- | " ) {

						// Bottom Right
						msg += String.fromCharCode( borders[ 2 ][ 3 ] );

					}
				} else if( cell === "-" ) {
					msg += String.fromCharCode( borders[ 0 ][ 1 ] );
				} else if( cell === "|" ) {
					msg += String.fromCharCode( borders[ 3 ][ 0 ] );
				} else {
					msg += " ";
				}
			}
			msg += "\n";
		}

		posAfter = m_qbData.commands.getPos( screenData );
		completeBoxes( boxes, tableFormat, font, pos );

		msg = msg.substr( 0, msg.length - 1 );
		m_qbData.commands.print( screenData, [ msg ] );

		i = 0;
		for( row = 0; row < items.length; row += 1 ) {
			if( qbs.util.isArray( items[ row ] ) ) {
				for( col = 0; col < items[ row ].length; col += 1 ) {
					if( i < boxes.length ) {
						printItem(
							screenData, boxes[ i ], items[ row ][ col ],
							pos.col
						);
						i += 1;
					}
				}
			} else {
				printItem( screenData, boxes[ i ], items[ row ], pos.col );
				i += 1;
			}
		}

		m_qbData.commands.setPos( screenData,
			[ 0, posAfter.row + tableFormat.length ]
		);

		return boxes;
	}

	function printItem( screenData, box, msg ) {
		var pos, width, height, isVertical, col, row, startRow, index;

		if( ! box ) {
			return;
		}

		msg = "" + msg;

		// Calculate dimensions
		width = box.pos.width;
		height = box.pos.height;

		if( box.format.toLowerCase() === "v" ) {
			isVertical = true;
		}

		if( isVertical ) {
			if( msg.length > height ) {
				msg = msg.substr( 0, height );
			}
		} else {
			if( msg.length > width ) {
				msg = msg.substr( 0, width );
			}
		}

		pos = m_qbData.commands.getPos( screenData );
		
		if( isVertical ) {
			index = 0;
			col = box.pos.col + Math.round( width / 2 );
			startRow = box.pos.row + 1 +
				Math.floor( ( height - msg.length ) / 2 );
			for( row = startRow; row <= height + startRow; row += 1 ) {
				m_qbData.commands.setPos( screenData, [ col, row ] );
				m_qbData.commands.print( screenData,
					[ msg.charAt( index ), true ]
				);
				index += 1;
			}
		} else {
			col = box.pos.col + 1 + Math.floor( ( width - msg.length ) / 2 );
			row = box.pos.row + Math.round( height / 2 );
			m_qbData.commands.setPos( screenData, [ col, row ] );
			m_qbData.commands.print( screenData, [ msg, true ] );
		}
		m_qbData.commands.setPos( screenData, [ pos.col, pos.row ] );
	}

	function createBox( col, row, boxes, font ) {
		boxes.push( {
			"pos": {
				"col": col,
				"row": row,
				"width": null,
				"height": null
			},
			"pixels": {
				"x": ( col * font.width ) + Math.round( font.width / 2 ) - 1,
				"y": ( row * font.height ) + Math.round( font.height / 2 ),
				"width": null,
				"height": null
			},
			"format": " "
		} );
	}

	function completeBoxes( boxes, tableFormat, font, pos ) {
		var i, box, xt, yt, cell;

		for( i = 0; i < boxes.length; i += 1 ) {
			box = boxes[ i ];

			// Compute table coordiantes for formating character
			xt = box.pos.col + 1 - pos.col;
			yt = box.pos.row + 1 - pos.row;

			// Find the formating character
			if( yt < tableFormat.length && xt < tableFormat[ yt ].length ) {
				box.format = tableFormat[ yt ].charAt( xt );
			}

			// Compute table coordiantes
			xt = box.pos.col - pos.col;
			yt = box.pos.row - pos.row;

			// Find box.width
			while( xt < tableFormat[ yt ].length - 1 ) {
				xt += 1;
				if( tableFormat[ yt ].charAt( xt ) === "*" ) {
					cell = lookCell( xt, yt, "down", tableFormat );
					if( cell === "|" ) {
						box.pos.width = ( pos.col + ( xt - 1 ) ) - box.pos.col;
						box.pixels.width = ( box.pos.width + 1 ) * font.width;
						//box.pixels.width += 1;
						// if( xt === tableFormat[ yt ].length - 1 ) {
						// 	box.pixels.width += 1;
						// }
						break;
					}
				}
			}

			// Box ends at table end
			if( box.pos.width === null ) {
				box.pos.width = ( pos.col + ( xt - 1 ) ) - box.pos.col;
				box.pixels.width = ( box.pos.width + 1 ) * font.width + 1;
			}

			// Find box.height
			while( yt < tableFormat.length - 1 ) {
				yt += 1;
				if( tableFormat[ yt ].charAt( xt ) === "*" ) {
					cell = lookCell( xt, yt, "left", tableFormat );
					if( cell === "-" ) {
						box.pos.height = ( pos.row + ( yt - 1 ) ) -
							box.pos.row;
						box.pixels.height = ( box.pos.height + 1 ) *
							font.height;
						//box.pixels.height += 1;
						// if( yt === tableFormat.length - 1 ) {
						// 	box.pixels.height += 1;
						// }
						break;
					}
				}
			}

			// Box ends at table end
			if( box.pos.height === null ) {
				box.pos.height = ( pos.row + ( yt - 1 ) ) - box.pos.row;
				box.pixels.height = ( box.pos.height + 1 ) * font.height + 1;
			}
		}
	}

	function lookCell( x, y, dir, tableFormat ) {
		if( dir === "left" ) {
			x -= 1;
		} else if( dir === "right" ) {
			x += 1;
		} else if( dir === "up" ) {
			y -= 1;
		} else if( dir === "down" ) {
			y += 1;
		}

		if( y >= tableFormat.length || y < 0 || x < 0 ) {
			return " ";
		}

		if( x >= tableFormat[ y ].length ) {
			return " ";
		}

		if(
			tableFormat[ y ].charAt( x ) === "*" &&
			( dir === "left" || dir === "right" )
		) {
			return "-";
		}

		if(
			tableFormat[ y ].charAt( x ) === "*" &&
			( dir === "up" || dir === "down" )
		) {
			return "|";
		}

		return tableFormat[ y ].charAt( x );
	}

// End of File Encapsulation
} )();
