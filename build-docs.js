const toml = require("@iarna/toml");
const fs = require('fs');
const DOCS_FOLDER = "docs/commands/";
const buildFile = "build.toml";

let files = fs.readdirSync( DOCS_FOLDER );
var data = fs.readFileSync(buildFile).toString();
let builds = toml.parse( data ).builds;
let version = builds[ 0 ].version;

console.log( "Building version: " + version );
// Build TOML Stubs
// let commands = require( "./docs/commands.js" );
// for( let i in commands ) {
// 	fs.writeFileSync( "./docs/commands/" + commands[ i ].name + ".toml", toml.stringify( commands[ i ] ) );
// }
// process.exit();


// Build new command JSON
let commands = [];
let examples = "var examples = {};\n";
let categories = {};
for( let i = 0; i < files.length; i++ ) {
	if( files[ i ].indexOf( "util." ) === 0 ) {
		continue;
	}
	var data = fs.readFileSync( DOCS_FOLDER + files[ i ] ).toString();
	let command = toml.parse( data );
	if(Array.isArray(command.category)) {
		for(let j = 0; j < command.category.length; j++) {
			let category = command.category[j];
			if(!categories[category]) {
				categories[category] = [];
			}
			categories[category].push(command.name);
		}
	} else {
		if(!categories[command.category]) {
			categories[command.category] = [];
		}
		categories[command.category].push(command.name);
	}
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
for(let category in categories) {
	categories[category].sort();
}
//console.log(commands);
for(let i = 0; i < commands.length; i++) {
	let category = commands[i].category;
	if( Array.isArray( category ) ) {
		commands[i].seeAlso = [];
		for(let j = 0; j < category.length; j++ ) {
			commands[i].seeAlso = commands[i].seeAlso.concat(categories[category[j]]);
		}
	} else {
		commands[i].seeAlso = categories[category].slice();
		commands[i].seeAlso.splice(commands[i].seeAlso.indexOf(commands[i].name), 1);
	}
}
fs.writeFileSync( "docs/pi-examples.js", examples );
fs.writeFileSync( "docs/commands2.js", "var commands = " + JSON.stringify( commands ) + ";" );
fs.writeFileSync( "docs/pi-help.json", JSON.stringify( commands ) );
fs.writeFileSync( "build/pi-examples.js", examples );
fs.writeFileSync( "build/pi-help.json", JSON.stringify( commands ) );
