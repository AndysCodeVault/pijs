const fs = require('fs');
const ug = require("uglify-js");
const toml = require("@iarna/toml");
const buildFile = "build.toml";

// Start the process
readBuilds();

function readBuilds() {
	
	fs.readFile(buildFile, "utf8", function(err, data) {
		let builds = toml.parse(data).builds;
		for(let i = 0; i < builds.length; i++) {
			console.log("---------------------------");
			console.log(builds[i].name);
			readFiles(builds[i]);
		}
	});
}

// Combine and minify all files
function processFiles( build ) {

	console.log( "" );
	console.log( "* Minifying Code *" );

	let fileFull = build.name + ".js";
	let fileOut = build.name + ".min.js";
	let fileMap = build.name + ".min.js.map";

	// Minify the code
	let result = "";

	// Remove NO Build Content
	for( let i = 0; i < build.files.length; i++ ) {
		let start = 0;
		let cnt = 100;
		do {
			let start = result.indexOf( "//[NO_BUILD]" );
			let end = result.indexOf( "//[/NO_BUILD]" );
			if( start !== -1 && end !== -1 ) {
				let result1 = result.substring( 0, start );
				let result2 = result.substring( end + "//[/NO_BUILD]".length );
				result = result1 + result2;
			}
		} while ( start != -1 && cnt-- > 0 );

		result += build.fileData[ build.files[ i ] ];
	}

	// Write output to file
	writeFile( "build/" + fileFull, result );
	//writeFile( "../pi-pixel/pijs/" + fileFull, result );
	//writeFile( "../thief/pijs/" + fileFull, result );
	//writeFile( "../web-os/site/system/libs/" + fileFull, result );

	// Minify the code
	result = ug.minify( build.fileData, {
		"warnings": true, "sourceMap": { "filename": fileOut, "url": fileMap, "root": "../" }
	} );

	// Throw an error if not successful
	if( result.error ) {
		console.log( result.error );
		//throw result.error;
	}

	// Show any warnings
	if(result.warnings) {
		console.log(result.warnings);
	}

	// Log success method
	console.log("Success");

	// Write output to file
	writeFile( "build/" + fileOut, result.code );

	// Write output to file
	writeFile( "build/" + fileMap, result.map );

	function writeFile( fileName, data ) {

		// Write output to file
		fs.writeFile( fileName, data, function (err) {

			// If unable to write to file throw error
			if(err) {
				throw err;
			}

			// Log file created message
			console.log( "Created new file " + fileName );
		} );

	}
}

// Read all the files
function readFiles(build) {

	build.fileData = {};
	let filesLoaded = 0;
	for(let i = 0; i < build.files.length; i++) {
		build.fileData[build.files[i]] = "";
	}
	console.log("");
	console.log("* Reading files *");

	// Loop through all the files
	for(let filename in build.fileData) {

		// Read the file
		fs.readFile(filename, "utf8", function(err, data) {
			
			// If unable to read a file throw an error
			if(err) {
				throw err;
			}

			// Log the file name
			console.log(filename);

			// Save the data to the files array
			build.fileData[filename] = data;

			// Check if all files are loaded
			filesLoaded++;
			if(filesLoaded === Object.keys(build.fileData).length) {
				processFiles(build);
			}
		});
	}
}
