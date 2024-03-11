/*
* File: qbs-init.js
*/

// Start of File Encapsulation
(function () {

"use strict";

// Create the API
qbs._.processCommands();

if( window.$ === undefined ) {
	window.$ = window.qbs;
}

// Delete reference to internal functions
delete qbs._;

// End of File Encapsulation
} )();
