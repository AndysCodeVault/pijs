$.screen("300x200");
$.print("\n");
$.onkey( "any", "down", function (key) {
	$.print(key.key + " pressed.");
});
$.onkey( "Escape", "down", function (key) {
	$.print(key.key + " pressed.");
	$.clearKeys();
});