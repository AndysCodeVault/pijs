var bombPool = $.createAudioPool("bomb.wav", 1);
$.ready(function () {
	$.playAudioPool(bombPool);
});