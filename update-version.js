"use strict";

// Third Party Libraries
const TOML = require( "@iarna/toml" );
const FS = require( "fs" );

// CONSTANTS
const BUILD_FILE = "build.toml";
const VERSION_FILE = "update-version.toml";

// Global Variables
let g_build = null;

FS.readFile( BUILD_FILE, "utf8", function( err, data ) {
	let builds = TOML.parse( data ).builds;
	g_build = builds[ 0 ];
	FS.readFile( VERSION_FILE, "utf8", function( err, data ) {
		let g_versions = TOML.parse( data );
		g_versions.folders.forEach( function ( folder ) {
			FS.readdir( folder.src, function ( err, data ) {
				processTests( data, folder.src, folder.localRef );
			} );
		} );
	} );
} );

function processTests( files, folder, localRef ) {
	// Remove non-html files
	for( let i = 0; i < files.length; i++ ) {
		let file = files[ i ];
	
		if( isHtmlFile( file ) ) {
			updateTestVersion( file, folder, localRef );
		}
	}
}

function updateTestVersion( file, folder, localRef ) {
	FS.readFile( folder + file, "utf8", function ( err, data ) {
		if( err ) {
			console.log( err );
			return;
		}
		let startIndex = data.indexOf( "<!-- [Pi.js Script]-->" );
		let endIndex = data.indexOf( "<!-- [/Pi.js Script]-->" );
		//let piVersion = "pi-" + g_build.version + ".js";
		let piVersion = "pi-latest.js";
		let finalData = data.substring( 0, startIndex ) +
			"<!-- [Pi.js Script]-->\n\t\t" +
			"<script src=\"" + localRef + piVersion + "\"></script>\n\t\t" +
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