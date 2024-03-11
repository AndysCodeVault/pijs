$.screen("300x200");
var monkey = $.loadImage("monkey.png");
$.ready(function () {
	$.drawImage(monkey, 150, 100, 0, 0.5, 0.5);
});