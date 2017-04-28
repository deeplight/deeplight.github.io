'use strict';

var audioCtx = new AudioContext();

function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

if (hasGetUserMedia()) {
    alert('getUserMedia ok');
} else {
    alert('getUserMedia() is not supported in your browser');
}


function playByte(b) {
    console.log('PlayByte-' + b);

    var oscillator = audioCtx.createOscillator();

    oscillator.type = 'sine';
    oscillator.frequency.value = 440 * b; // value in hertz
    oscillator.connect(audioCtx.destination);
    oscillator.start();
    setTimeout(function() {
        oscillator.stop(0);
    }, 1000);
}