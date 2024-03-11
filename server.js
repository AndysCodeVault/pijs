var connect = require( "connect" );
var serveStatic = require( "serve-static" );
connect().use( serveStatic( __dirname ) ).listen( 8080, 
function () {
	"use strict";
	console.log( "Server running on 8080..." );
} );

