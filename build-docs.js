const toml = require("@iarna/toml");
const fs = require('fs');
const ug = require("uglify-js");
const DOCS_FOLDER = "docs/commands/";
let files = fs.readdirSync( DOCS_FOLDER );

// Build TOML Stubs
// let commands = require( "./docs/commands.js" );
// for( let i in commands ) {
// 	fs.writeFileSync( "./docs/commands/" + commands[ i ].name + ".toml", toml.stringify( commands[ i ] ) );
// }
// process.exit();


// Build new command JSON
let commands = [];
let examples = "var examples = {};\n";
for( let i = 0; i < files.length; i++ ) {
	if( files[ i ].indexOf( "util." ) === 0 ) {
		continue;
	}
	var data = fs.readFileSync( DOCS_FOLDER + files[ i ] ).toString();
	let command = toml.parse( data );
	commands.push( command );
	console.log( command.name );
	let name = command.name.replace( ".", "_" );
	var code, start, end, codeClose;
	code = command.example;
	if( code === undefined ) {
		continue;
	}
	if( typeof code === "string" ) {
		start = code.indexOf( ".screen(" );
		end = code.indexOf( ")", start );
		code = code.substring( 0, end ) + ", 'canvasContainer'" + code.substring( end );
	}
	codeClose = command.onclose;
	if( codeClose === undefined ) {
		codeClose = "onExampleClose = function () {};"
	} else {
		codeClose = "onExampleClose = function () {" + codeClose + "}"
	}
	examples += "examples['" + name + "'] = function() {\n" + code + codeClose + "\n}\n";
	//examples[ name ] = command.example;
}
fs.writeFileSync( "docs/examples.js", examples );
fs.writeFileSync( "docs/commands2.js", "var commands = " + JSON.stringify( commands ) + ";" );
