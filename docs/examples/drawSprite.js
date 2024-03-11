$.screen("300x200");
var monkey = $.loadSpritesheet("monkey.png", 32, 32, 1);
$.ready(function () {
	var frame = 0;
	var interval = setInterval(run, 500);
	function run() {
		frame += 1;
		$.cls();
		$.drawSprite(monkey, frame % 2, 150, 100, 0, 0.5, 0.5);
	}
	run();
	setTimeout(function () {
		clearInterval(interval);
	}, 2000);
});