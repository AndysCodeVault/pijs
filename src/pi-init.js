/*
* File: pi-init.js
*/

// Start of File Encapsulation
(function () {

"use strict";

var pi;

pi = window.pi;

// Create the API
pi._.processCommands();

if( window.$ === undefined ) {
	window.$ = window.pi;
}

// Delete reference to internal functions
delete pi._;

// End of File Encapsulation
} )();
