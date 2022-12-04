
const fs = require( "fs" );
const mapFile = "Commands.json";
let commands = null;

fs.readFile( mapFile, "utf8", function( err, data ) {
	commands = JSON.parse( data );
	let mapStr = "let g_mapStr = `var $ = {";
	for( let i = 0; i < commands.length; i++ ) {
		mapStr += "\"" + commands[ i ].name + "\"" + ": function(";
		if( commands[ i ].name === "set" ) {
			commands[ i ].parameters = [ "settings" ];
		}
		for( let j = 0; j < commands[ i ].parameters.length; j++ ) {
			if( j > 0 ) {
				mapStr += ",";
			}
			mapStr += " " + commands[ i ].parameters[ j ];
			if( j === commands[ i ].parameters.length - 1 ) {
				mapStr += " ";
			}
		}
		mapStr += ") { /* " + commands[ i ].name + " */ }, "
	}
	mapStr += "}; var pi = $;`;";

	writeFile( "map.txt", mapStr );
} );

function writeFile( fileName, data ) {

	// Write output to file
	fs.writeFile( fileName, data, function ( err ) {

		// If unable to write to file throw error
		if( err ) {
			throw err;
		}

		// Log file created message
		console.log( "Created new file " + fileName );
	} );

}
