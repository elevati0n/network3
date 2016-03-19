#!/usr/bin/node

var Logger = function () {
    "use strict";
    this.startTime = this.getMicroseconds();
};

Logger.prototype.getMicroseconds = function () {
    "use strict";
    var hrTime = process.hrtime();
    return Math.floor(hrTime[0] * 1000000 + hrTime[1] / 1000);
};

Logger.prototype.timestamp = function () {
    "use strict";
    var rawTime = this.getMicroseconds() - this.startTime;
    var microseconds = rawTime % 1000;
    microseconds = microseconds.toString();

    while (microseconds.length < 3) {
        microseconds = '0' + microseconds;
    }
    var milliseconds = ~~ (rawTime / 1000) % 1000;
    milliseconds = milliseconds.toString();

    while (milliseconds.length < 3) {
        milliseconds = '0' + milliseconds;
    }

    var seconds = ~~ (rawTime / 1000000) % 60;
    seconds = seconds.toString();
    while (seconds.length < 2) {
        seconds = '0' + seconds;
    }

    var minutes = ~~ (rawTime / (1000000 * 60) % 60);
    var hours = ~~ (rawTime / (1000000 * 60 * 60) % 24);
    return hours + ':' + minutes + ':' + seconds + ':' + milliseconds + '.' +
        microseconds;
};

Logger.prototype.log = function (str) {
    "use strict";
    console.error('<' + this.timestamp() + '> ' + str);
};

module.exports = Logger;