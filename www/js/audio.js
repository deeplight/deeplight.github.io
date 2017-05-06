'use strict';


var g_freq_1 = 12000;
var g_freq_0 = 13000;
var bit_duration = 15;


var context = new AudioContext();
var sample_rate = context.sampleRate;
var COUNT = sample_rate * bit_duration / 1000;
var g_slice_1 = g_freq_1 * 2 * Math.PI / sample_rate;
var g_slice_0 = g_freq_0 * 2 * Math.PI / sample_rate;

var g_samples_1 = new Float32Array(COUNT);
var g_samples_0 = new Float32Array(COUNT);

console.log("SampleRate=", sample_rate);

function calculate_samples() {
    var slice_1 = g_freq_1 * 2 * Math.PI / sample_rate;
    var slice_0 = g_freq_0 * 2 * Math.PI / sample_rate;

    for (var i = 0; i < COUNT; i++) {
        g_samples_1[i] = Math.sin(slice_1 * i);
        g_samples_0[i] = Math.sin(slice_0 * i);
    }

    console.dir(g_samples_1);
    console.dir(g_samples_0);
}

calculate_samples();

function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

if (hasGetUserMedia()) {
    //  alert('getUserMedia ok');
} else {
    alert('getUserMedia() is not supported in your browser');
}

function fillBit_1(cdata, index, frames) {
    var count = COUNT * frames;
    var pos = COUNT * index;

    for (var i = 0; i < count; i++) {
        cdata[pos] = Math.sin(g_slice_1 * i);
        pos++;
    }
}

function fillBit_0(cdata, index, frames) {
    var count = COUNT * frames;
    var pos = COUNT * index;

    for (var i = 0; i < count; i++) {
        cdata[pos] = Math.sin(g_slice_0 * i);
        pos++;
    }
}

function fillBits(cdata, index, bytedata, bits) {
    var p = 1;

    for (var i = 0; i < bits; i++) {
        var b = bytedata & p;
        if (b)
            fillBit_1(cdata, index + i, 1);
        else
            fillBit_0(cdata, index + i, 1);

        p *= 2;
    }
}


function createAudioBuffer(addr, databyte) {
    var FRAMES = 22; // 3-header, 4-address, 8-data, 4-Mac, 3-IDLE
    var cbuf = context.createBuffer(1, COUNT * FRAMES, sample_rate);
    var cdata = cbuf.getChannelData(0);
    console.log('bufferlength = ', cdata.length);

    var pos = 0;
    // set Header bits
    fillBit_1(cdata, 0, 2); // '11'
    fillBit_0(cdata, 2, 1); // '0'

    // fill address
    fillBits(cdata, 3, addr, 4);

    // fill data databyte
    fillBits(cdata, 7, databyte, 8);

    // fill Mac (4 bits)
    fillBit_1(cdata, 15, 4); // '1111' TODO

    // fill IDLE
    fillBit_0(cdata, 19, 3); // '000' 

    console.log('Create AudioBuffer');
    //  console.dir(cdata);

    return cbuf;
}
var canvasCtx;
var canvas;
var bufferLength;
var dataArray;
var analyser;

function playByte(b) {
    // setInterval(function() {
    //     play(b);
    // }, 350);

    play(b);
}

function play(b) {
    console.log('PlayByte-' + b);

    var audioBuffer = createAudioBuffer(0x01, b);

    var source = context.createBufferSource();
    // set the buffer in the AudioBufferSourceNode
    source.buffer = audioBuffer;
    // connect the AudioBufferSourceNode to the
    // destination so we can hear the sound

    analyser = context.createAnalyser();
    source.connect(analyser);

    analyser.connect(context.destination);
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.2;

    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    source.start();
    canvas = document.getElementById("myCanvas");
    canvasCtx = canvas.getContext("2d");

    // draw();
}

var sn = 0;
var WIDTH = 600,
    HEIGHT = 400;

function draw() {

    sn++;


    var did = window.requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);
    var n = 0;
    for (var i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > 1)
            n++;
        //  if (dataArray[i] > 245)
        //     console.log(">> " + i + '=' + dataArray[i]);
    }

    if (n < 5)
        return;
    //console.dir(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {

        var v = dataArray[i];
        var y = v / 256 * HEIGHT;
        var x = i * 600 / bufferLength;

        canvasCtx.moveTo(x, HEIGHT);
        canvasCtx.lineTo(x, HEIGHT - y);
    }


    canvasCtx.stroke();
}


navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);


// MicrophoneSample.prototype.getMicrophoneInput = function() {
//     navigator.getUserMedia({ audio: true },
//         this.onStream.bind(this),
//         this.onStreamError.bind(this));
// };

// MicrophoneSample.prototype.onStream = function(stream) {
//     var input = context.createMediaStreamSource(stream);
//     var filter = context.createBiquadFilter();
//     filter.frequency.value = 60.0;
//     filter.type = filter.NOTCH;
//     //filter.Q = 10.0;

//     var analyser = context.createAnalyser();

//     // Connect graph.
//     input.connect(filter);
//     filter.connect(analyser);

//     this.analyser = analyser;
//     // Setup a timer to visualize some stuff.
//     requestAnimFrame(this.visualize.bind(this));
// };

// MicrophoneSample.prototype.onStreamError = function(e) {
//     console.error('Error getting microphone', e);
// };

// MicrophoneSample.prototype.visualize = function() {
//     this.canvas.width = this.WIDTH;
//     this.canvas.height = this.HEIGHT;
//     var drawContext = this.canvas.getContext('2d');

//     var times = new Uint8Array(this.analyser.frequencyBinCount);
//     this.analyser.getByteTimeDomainData(times);
//     for (var i = 0; i < times.length; i++) {
//         var value = times[i];
//         var percent = value / 256;
//         var height = this.HEIGHT * percent;
//         var offset = this.HEIGHT - height - 1;
//         var barWidth = this.WIDTH / times.length;
//         drawContext.fillStyle = 'black';
//         drawContext.fillRect(i * barWidth, offset, 1, 1);
//     }
//     requestAnimFrame(this.visualize.bind(this));
// };


// // shim layer with setTimeout fallback
// window.requestAnimFrame = (function() {
//     return window.requestAnimationFrame ||
//         window.webkitRequestAnimationFrame ||
//         window.mozRequestAnimationFrame ||
//         window.oRequestAnimationFrame ||
//         window.msRequestAnimationFrame ||
//         function(callback) {
//             window.setTimeout(callback, 1000 / 60);
//         };
// })();

// var sample = new MicrophoneSample();