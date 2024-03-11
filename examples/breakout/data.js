const g_data = {};



g_data.size = {
	"width": 315,
	"height": 200
};



g_data.cracks = [
	"bf4 bd br9 d r5 d r7 d r3",
	"bl8 bu3 bl7 g5 e2 h4",
	"br22 bd3 f3 h3 e3",
	"bl25 l2 e3 g3 h l2 h",
	"br31 bd9 r2 f r2 l u e4 bl8 g4 l g l g2 e2 h3"
];

g_data.bricks = {
	"0": {
		"color": 1,
		"fillColor": 9,
		"health": 0.25
	},
	"1": {
		"color": 3,
		"fillColor": 11,
		"health": 0.25
	},
	"2": {
		"color": 37,
		"fillColor": 36,
		"health": 0.25
	},
	"3": {
		"color": 80,
		"fillColor": 79,
		"health": 0.25
	},
	"4": {
		"color": 35,
		"fillColor": 34,
		"health": 0.25
	},
	"5": {
		"color": 7,
		"fillColor": 8,
		"health": 1
	},
	"T": {
		"color": 12,
		"fillColor": 4,
		"health": 0.2
	}
};

g_data.ball = {
	"x": 155,
	"y": 100,
	"speed": 0.15,
	"radius": 4,
	"color": "orange",
	"fillColor": "red",
	"damage": 0.1,
	"delay": 4000
};

g_data.paddle = {
	"speed": 0.25,
	"x": 142,
	"y": 160,
	"width": 30,
	"height": 10,
	"color": "yellow",
	"fillColor": "green"
};