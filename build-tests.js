"use strict";

// Third Party Libraries
const TOML = require( "@iarna/toml" );
const FS = require( "fs" );

// CONSTANTS
const TESTS_FOLDER = "test/tests/";
const TESTS_FOLDER2 = "test/tests_input/";
const buildFile = "build.toml";

// Global Variables
let g_Files = FS.readdirSync( TESTS_FOLDER )
let g_Files2 = FS.readdirSync( TESTS_FOLDER2 );
let g_build = null;

FS.readFile( buildFile, "utf8", function( err, data ) {
	let builds = TOML.parse( data ).builds;
	g_build = builds[ 0 ];
	processTests( g_Files, TESTS_FOLDER );
	processTests( g_Files2, TESTS_FOLDER2 );
} );

function processTests( files, folder ) {
	// Remove non-html files
	for( let i = 0; i < files.length; i++ ) {
		let file = files[ i ];
	
		if( isHtmlFile( file ) ) {
			updateTestVersion( file, folder );
		}
	}
}

function updateTestVersion( file, folder ) {
	FS.readFile( folder + file, "utf8", function ( err, data ) {
		if( err ) {
			console.log( err );
			return;
		}
		let startIndex = data.indexOf( "<!-- [PI-JS Script]-->" );
		let endIndex = data.indexOf( "<!-- [/PI-JS Script]-->" );
		let piVersion = "pi-" + g_build.version + ".js";
		let finalData = data.substring( 0, startIndex ) +
			"<!-- [PI-JS Script]-->\n\t\t" +
			"<script src=\"../../build/" + piVersion + "\"></script>\n\t\t" +
			data.substring( endIndex );
		FS.writeFile( folder + file, finalData, function () {
			console.log( "Updated: " + file + " with source: " + piVersion );
		} );
	} );
}

function isHtmlFile( filename ) {
	//console.log( filename, "3" );
	let parts = filename.split( "." );
	if( parts.length < 2 ) {
		return false;
	}
	//console.log( filename, "4" );
	return parts[ 1 ] === "html";
}