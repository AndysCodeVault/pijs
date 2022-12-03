$.screen("300x200");
$.print("\n");
$.input("What is your name?", null, "name");
$.onkey( "Escape", "down", function () {
	$.print("\nInput Canceled");
	$.cancelInput("name");
}, true);