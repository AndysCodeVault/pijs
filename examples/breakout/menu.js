const g_menu = {
    "fn": {},
    "data": {}
};

g_menu.fn.init = function init() {
    g_menu.data.fontColors = [ 2, 9, 10, 4, 44, 36, 100, 3, 41, 81, 72 ];
    g_menu.data.fontColors2 = [ 
        18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18 
    ];
    g_menu.data.lastTime = Date.now();
    $.screen( "315x200", null, null, true );
    $.setFont( 3 );
    
    $.setPos( 0, 6 );
    g_menu.fn.runMenu();
    $.onclick( g_menu.fn.start );
    $.onkey( "any", "down", g_menu.fn.keyDown );
};

g_menu.fn.keyDown = function ( key ) {
    cancelAnimationFrame( g_menu.data.anim );
    if( key.code === "KeyH" ) {
        g_menu.fn.showHighscores();
    } else {
        g_menu.fn.start();
    }
};

g_menu.fn.start = function start() {
    cancelAnimationFrame( g_menu.data.anim );
    $.offclick( g_menu.fn.start );
    $.offkey( "any", "down", g_menu.fn.keyDown );
    g_game.fn.init();
};

g_menu.fn.showHighscores = function () {
    const titles = [
        "H                  ",
        "  I                ",
        "    G              ",
        "      H            ",
        "        S          ",
        "          C        ",
        "            O      ",
        "              R    ",
        "                E  ",
        "                  S"
    ];
    $.cls();
    $.setPos( 0, 1 );
    for( let i = 0; i < g_menu.data.fontColors.length; i += 1 ) {
        if( i < titles.length ) {
            $.setColor( g_menu.data.fontColors[ i ] );
            $.print( titles[ i ], true, true );
        }
    }
};

g_menu.fn.runMenu = function runMenu() {
    const titles = [
        "B              ",
        "  R            ",
        "    E          ",
        "      A        ",
        "        K      ",
        "          O    ",
        "            U  ",
        "              T"
    ];
    $.cls();
    $.setPos( 0, 6 );
    for( let i = 0; i < g_menu.data.fontColors.length; i += 1 ) {
        if( i < titles.length ) {
            $.setColor( g_menu.data.fontColors[ i ] );
            $.print( titles[ i ], true, true );
        }
    }

    $.setColor( g_menu.data.fontColors2[ 0 ] );
    $.setPos( 0, 10 );
    $.print( "Press any key or click to continue", true, true );

    $.setColor( 45 );
    $.setPos( 0, 12 );
    $.print( "Press H to view highscores", true, true );
    const t = Date.now();
    if( t - g_menu.data.lastTime > 100 ) {
        g_menu.data.fontColors.unshift( g_menu.data.fontColors[ g_menu.data.fontColors.length - 1 ] );
        g_menu.data.fontColors.pop();
        g_menu.data.fontColors2.unshift( g_menu.data.fontColors2[ g_menu.data.fontColors2.length - 1 ] );
        g_menu.data.fontColors2.pop();
        g_menu.data.lastTime = t;
    }
    g_menu.data.anim = requestAnimationFrame( g_menu.fn.runMenu );
};
