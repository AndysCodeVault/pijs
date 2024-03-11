const fs = require( "fs" );
const ug = require( "uglify-js" );
const toml = require( "@iarna/toml" );
const buildFile = "build.toml";
const changeLogFile = "change-log.toml";

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
	fs.readFile(changeLogFile, "utf8", function(err, data) {
		let changeLog = toml.parse(data);
		writeFile( "build/change-log.json", JSON.stringify( changeLog ) );
	});
}

// Combine and minify all files
function processFiles( build ) {

	console.log( "" );
	console.log( "* Minifying Code *" );

	let fileFull = build.name + "-" + build.version + ".js";
	let fileOut = build.name + "-" + build.version + ".min.js";
	let fileMap = build.name + "-" + build.version + ".min.js.map";
	let fileExtra = build.name + "-" + "extra.js";

	// Minify the code
	let result = "";

	// Update version number and build date in first file
	build.fileData[ build.files[ 0 ] ] = build.fileData[ build.files[ 0 ] ]
		.replace( "[VERSION_NUMBER]", build.version )
		.replace( "[BUILD_DATE]", ( new Date() ).toISOString().split( "T" )[ 0 ] );

	// Combine all files
	for( let i = 0; i < build.files.length; i++ ) {
		result += build.fileData[ build.files[ i ] ];
	}

	/*
	if( window.$ === undefined ) {
		window.$ = window.piExtra;
	}
	*/
	console.log( "* Adding extra command *" );
	let resultTemp = result.replaceAll( "window.pi", "window.piExtra");
	resultTemp = resultTemp.replace( "\t//[EXTRA_BUILD_COMMAND]", build.extraCommand );
	resultTemp = resultTemp.replaceAll( "window.$ = window.piExtra;", "//window.$ = window.piExtra;" );
	writeFile( "build/" + fileExtra, resultTemp );

	// Write output to file
	writeFile( "build/" + fileFull, result );
	writeFile( "build/pi-latest.js", result );

	// Minify the code
	result = ug.minify( build.fileData, {
		"output": { "comments": "some" }, "warnings": true,
		"sourceMap": { "filename": fileOut, "url": fileMap, "root": "../" }
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

}

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
