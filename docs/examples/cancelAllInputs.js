$.screen("300x200");
$.print("\n");
$.input("What is your name?", null);
$.onkey( "Escape", "down", function () {  
	$.print("\nInput Canceled");
	$.cancelInput();
}, true );