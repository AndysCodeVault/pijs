"use strict";

// Third Party Libraries
const puppeteer = require('puppeteer');
const { TimeoutError } = require('puppeteer/Errors');
const FS = require( "fs" );
const PNG = require( "pngjs" ).PNG;
const TOML = require( "@iarna/toml" );
const CMD = require( "node-cmd" );

// My Libraries
const userEvents = require( "./user-events-mock.js" );

// CONSTANTS
const BROWSER1 = "\"C:\\Program Files\\Google\\Chrome\\Application\"";
const BROWSER2 = "chromium-browser";
const HOME = "http://localhost:8080/";
const TESTS_FOLDER = "test/tests/";
const INDEX_FILE = "test/index.html";
const TEMPLATE_FILE = "test/index-template.html";
const TEMP_TESTS = "test/temp/";
const LOG_FILE = "test/log.log";
const SCREENSHOTS_FOLDER = "test/tests/screenshots/";
const SCREENSHOTS_FOLDER_WIN = "test\\tests\\screenshots\\";
const TESTS_URL = HOME + TESTS_FOLDER;
const IMG_URL_ROOT = "tests/screenshots/";
const IMG_URL_ROOT_TEMP = "../tests/screenshots/";
const ROOT_DIR = __dirname.substring( 0, __dirname.lastIndexOf( "\\" ) ) + "\\";
const TEST_HTML_ID = "test_";
const LAST_TEST_BATCHFILE = "test/dtest.bat";
const LAST_TEST_BATCHFILE2 = "test/dtest2.bat";
const IMAGE_COMPARE_URL = "image-compare.html";

// Global Variables
let g_ImgHtml = [];
let g_Errors = [];
let g_MismatchCount = 0;
let g_NewTestsCount = 0;
let g_totalTestsCount = 0;
let g_totalTestsParsedCount = 0;
let g_StrHtml = FS.readFileSync( TEMPLATE_FILE ).toString();
let g_Files = FS.readdirSync( TESTS_FOLDER );
let g_StrLog = "";
let g_indexFile = INDEX_FILE;
let g_browser;
let g_page;
let g_BrowserUrl = BROWSER2;
let g_imgUrlRoot = IMG_URL_ROOT;
let g_lastTest = "";
let g_lastTestScreenshotFiles = {};
let g_imagePrefix = "";

startTests();

async function startTests() {
	console.log( "STARTING TESTS" );
	g_browser = await puppeteer.launch();
	g_page = await g_browser.newPage();

	if( process.argv.length > 2 ) {
		g_Files = [ process.argv[ 2 ] ];
		g_indexFile = TEMP_TESTS + "test-" + g_Files[ 0 ];
		g_imgUrlRoot = IMG_URL_ROOT_TEMP;
		g_lastTest = g_Files[ 0 ];
	}

	if( process.platform === "win32" ) {
		g_BrowserUrl = BROWSER1;
	} else {
		g_imagePrefix = "L_";
	}

	// Remove non-html files
	for( let i = g_Files.length - 1; i > 0; i -= 1 ) {
		let file = g_Files[ i ];
	
		if( ! isHtmlFile( file ) ) {
			g_Files.splice( i, 1 );
		}
	}

	g_totalTestsCount = g_Files.length;

	for( let i = 0; i < g_Files.length; i++ ) {
	
		let file = g_Files[ i ];
	
		if( isHtmlFile( file ) ) {
			g_ImgHtml.push( "\n\t" );
			await runTest( file, i );
		}
	}
	await g_browser.close();
}

async function runTest( file, i ) {
	let test = getTestInfo( file );

	//Set the name of the image file
	test.img_file = SCREENSHOTS_FOLDER + g_imagePrefix + test.file + ".png";

	let saveFile = "";
	if( FS.existsSync( test.img_file ) ) {
		saveFile = SCREENSHOTS_FOLDER + g_imagePrefix + test.file + "_new.png";
		test.new_img_file = saveFile;
	} else {
		saveFile = SCREENSHOTS_FOLDER + g_imagePrefix + test.file + ".png";
		test.new_img_file = false;
	}

	if( g_lastTest !== "" ) {
		g_lastTestScreenshotFiles = {
			"new": SCREENSHOTS_FOLDER_WIN + g_imagePrefix + test.file + "_new.png",
			"old": SCREENSHOTS_FOLDER_WIN + g_imagePrefix + test.file + ".png"
		};
	}

	//Set the test url
	test.url = TESTS_URL + test.file + ".html";
	test.id = i;

	console.log( "***********************" );
	console.log( test.name );

	//Update the image html
	g_ImgHtml[ i ] += "\n\t\t<div id='" + TEST_HTML_ID + i + "'></div>";
	g_ImgHtml[ i ] += "\n\t\t<h2>" + test.name + "</h2>";
	g_ImgHtml[ i ] += "\n\t\t<div class='link'><a href='" + test.url + 
		"' target='_blank'>" + test.url +
		"</a>&nbsp;&nbsp;-&nbsp;&nbsp;<a href='#stats'>Go back</a></div>";
	g_ImgHtml[ i ] += "\n\t\t[" + test.file + "]<br />";
	//g_ImgHtml[ i ] += "\n\t\t<img src='" + g_imgUrlRoot + test.file + 
	//	".png' />";
	//g_ImgHtml[ i ] += "\n\t\t<img src='" + g_imgUrlRoot + test.file + 
	//	"_new.png' />";

	let fileNameOld = g_imgUrlRoot + test.file + ".png";
	let fileNameNew = g_imgUrlRoot + test.file + "_new.png";
	let f1 = encodeURIComponent( fileNameOld );
	let f2 = encodeURIComponent( fileNameNew );
	let imageCompareUrl = IMAGE_COMPARE_URL + "?file1=" + f1 +
		"&file2=" + f2;
	g_ImgHtml[ i ] += "\n\t\t<a href='" + imageCompareUrl + "' target='_blank'>" +
		"<img src='" + fileNameOld + "' /></a>";
	g_ImgHtml[ i ] += "\n\t\t<a href='" + imageCompareUrl + "' target='_blank'>" + 
		"<img src='" + fileNameNew + "' /></a>";
	
	// let cmdStr = g_BrowserUrl + " --headless --screenshot=" + ROOT_DIR +
	// 	saveFile + " --window-size=" + test.width + "," + test.height + " " + test.url;

	await g_page.setViewport( {
		"width": test.width,
		"height": test.height,
		"deviceScaleFactor": 1,
		"hasTouch": true
	} );

	await g_page.goto( test.url );
	//console.log( test.commands );
	if( test.commands ) {
		await userEvents( test.commands, g_page );
		console.log( "Events Completed" );
	}
	await g_page.screenshot( { path: saveFile } );
	await readImageFiles( test );
}

async function readImageFiles( test ) {
	var img1, img2, filesLoaded, diffRounded, imgsResolved;

	if( test.new_img_file ) {
		filesLoaded = 0;
		img1 = FS.createReadStream( test.img_file )
			.pipe( new PNG() ).on( "parsed", parsed );
		img2 = FS.createReadStream( test.new_img_file )
			.pipe( new PNG() ).on( "parsed", parsed );
	} else {
		console.log( "IMAGE NOT VERIFIED" );
		g_ImgHtml[ test.id ] = g_ImgHtml[ test.id ]
			.replace( "[" + test.file + "]",
			"<span class='neutral'>Not Verified</span>"
		);
		g_Errors.push( {
			"test": test,
			"type": "Not Verified"
		} );
		g_NewTestsCount += 1;
		updateCounts();
		setTimeout( function () {
			imgsResolved( "Not Verified" );
		}, 1 );
	}

	return new Promise( function( resolve, reject ) {
		imgsResolved = resolve;
	} );

	function parsed() {
		var diff, i;
	
		filesLoaded += 1;
		if( filesLoaded < 2 ) {
			return;
		}
	
		setTimeout( function () {
			diff = compare_images( img1, img2 );
			diffRounded = Math.round( diff * 100 ) / 100;
			console.log( "Difference: " + diff );
			if( diff > 0 ) {
				console.log( "NOT MATCHED" );
				g_ImgHtml[ test.id ] = g_ImgHtml[ test.id ]
					.replace( "[" + test.file + "]",
					"<span class='error'>NOT MATCHED - Difference: " +
					diffRounded + "</span>"
				);
				g_Errors.push( {
					"test": test,
					"type": "Not Matched"
				} );
				g_MismatchCount += 1;
			} else {
				g_ImgHtml[ test.id ] = g_ImgHtml[ test.id ].replace( "[" + test.file + "]",
					"<span class='good'>MATCHED</span>" );
			}
			updateCounts();
			imgsResolved( "Parsed" );
		}, 100 );
		
		//run_test( i + 1 );
	}
}

function updateCounts() {
	g_totalTestsParsedCount += 1;
	console.log( g_totalTestsParsedCount, g_totalTestsCount );
	if( g_totalTestsParsedCount === g_totalTestsCount ) {
		setTimeout( function () {
			writeFinalHtml();
		}, 500 );
	}
}

function writeFinalHtml() {
	//Update the stats
	let statsHtml = "<div id='stats'></div>";
	if( g_MismatchCount === 0 && g_NewTestsCount === 0 ) {
		statsHtml = "\n\t\t\t<span class='good'>All images match!</span>\n\t\t";
	} else {
		statsHtml += "\n\t\t\t<span class='error'>Discrepancies Found</span>";
		if( g_MismatchCount ) {
			statsHtml += "\n\t\t\t<span class='error'>" + g_MismatchCount +
				" mismatched images.</span>";
			if( ! g_NewTestsCount ) {
				statsHtml += "\n\t\t";
			}
		}
		if( g_NewTestsCount ) {
			statsHtml += "\n\t\t\t<span class='neutral'>" + g_NewTestsCount +
				" new images not verified.</span>\n\t\t";
		}
		if( g_Errors.length > 0 ) {
			statsHtml += "\n\t\t\t<ol>";
		}
		for( let i = 0; i < g_Errors.length; i++ ) {
			statsHtml += "\n\t\t\t\t<li><a href='#" + TEST_HTML_ID +
				g_Errors[ i ].test.id + "'>" +
				g_Errors[ i ].test.name + " - " + g_Errors[ i ].type +
				"</a></li>";
		}
		if( g_Errors.length > 0 ) {
			statsHtml += "\n\t\t\t</ol>";
		}
	}
	g_StrHtml = g_StrHtml.replace( "[TEST-STATS]", statsHtml );

	//Update the index_html
	g_StrHtml = g_StrHtml.replace( "[WEB-TESTS]", g_ImgHtml.join( "" ) );

	//Write the index.html file
	FS.writeFile( LOG_FILE, g_StrLog, function () {} );

	FS.writeFile( g_indexFile, g_StrHtml, function () {
		console.log( "Tests completed" );
	} );

	if( g_lastTest ) {
		let script, script2;
		script = "" +
			"@echo off\n" +
			"echo Deleting " + g_lastTestScreenshotFiles.old + "\n" +
			"del " + ROOT_DIR + g_lastTestScreenshotFiles.old + "\n" +
			"echo Renaming " + ROOT_DIR + g_lastTestScreenshotFiles.new + "\n" +
			"move " + ROOT_DIR + g_lastTestScreenshotFiles.new + " " +
				ROOT_DIR + g_lastTestScreenshotFiles.old;

		script2 = "" +
			"@echo off\n" +
			"echo Deleting " + ROOT_DIR + g_lastTestScreenshotFiles.old + "\n" +
			"del " + ROOT_DIR + g_lastTestScreenshotFiles.new + "\n" +
			"echo Deleting " + ROOT_DIR + g_lastTestScreenshotFiles.new + "\n" +
			"del " + ROOT_DIR + g_lastTestScreenshotFiles.old + "\n";
		
		FS.writeFile( LAST_TEST_BATCHFILE, script, function () {} );
		FS.writeFile( LAST_TEST_BATCHFILE2, script2, function () {} );
	}

	//Set the command to startup chrome and point to the home page
	let cmdStr = g_BrowserUrl + " " + HOME + g_indexFile;

	//Launch Chrome with link to test file
	CMD.get( cmdStr, function ( err, data, stderr ) {
		if( err ) {
			g_StrLog += "Error: " + err + "\n";
		}
		if( data ) {
			console.log( data );
		}
		if( stderr ) {
			g_StrLog += "Error: " + stderr + "\n";
		}
	} );
}

function getTestInfo( filename ) {
	let text = FS.readFileSync( TESTS_FOLDER + "/" + filename ).toString();
	let tomlText = text.substring(
		text.indexOf( "[[TOML_START]]" ) + 14,
		text.indexOf( "[[TOML_END]]" )
	).replace( /\t/g, "" );

	let data = TOML.parse( tomlText );

	return data;
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

function compare_images( img1, img2 ) {

	var x, y, i, diff, p_diff, width, height;

	diff = 0;
	width = img1.width;
	height = img1.height;

	for ( y = 0; y < height; y++ ) {
		for ( x = 0; x < width; x++ ) {
			i = ( width * y + x ) << 2;
			p_diff = 0;
			p_diff += Math.abs( img1.data[ i ] - img2.data[ i ] );
			p_diff += Math.abs( img1.data[ i + 1 ] - img2.data[ i + 1 ] );
			p_diff += Math.abs( img1.data[ i + 2 ] - img2.data[ i + 2 ] );
			diff += ( p_diff / 765 );
		}
	}

	return diff;
}