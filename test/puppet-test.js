'use strict';

const HOME = "http://localhost:8080/";
const puppeteer = require('puppeteer');
const URL = HOME + "test/tests_input/onmouse_01.html";

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	let canvasSelector = "canvas";

	await page.goto( URL );
	await page.$( "canvas" );
	
	await browser.close();
})();