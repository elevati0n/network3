#!/usr/bin/node
var dgram = require('dgram');
var Logger = require('./logger');
var helpers = require('./helper');
process.stdin.setEncoding('utf8');

// Limit of 1472 bytes
// if we use  4 bytes for our sequence, then we have 1468 bytes left
var Sender = function () {
    'use strict';
    // read from the input to get port number
    var input = process.argv;
    if (!input) {
        input = process.argv[2].split(':');
    } else {
        // use preset for testing
        input = ['127.0.0.1', 56999];
    }
    this.logger = new Logger();
    this.window = 1;
    this.done = false;
    this.sequence = 0;
    this.queue = [];
    this.ack = {};
    this.timeout = 500;
    this.waiting = false;


    // parse the command line arguments for the assigned port
    this.host = input[0];
    this.port = input[1];
    // bind a UDP socket to the specified port
    this.server = dgram.createSocket('udp4');
    this.server.bind();

    // print to STDERR the specified error message
    this.logger.log(this.host + ':' + this.port);
};

Sender.prototype.listen = function (self) {
    "use strict";
    var bufferArr = [];
    process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        var buff;
        while (chunk) {
            buff = new Buffer(chunk);
            bufferArr.push(buff);
            self.bufferSize += buff.length;
        }
        
        // self.seqLength = Math.ceil(self.bufferSize / self.dataLength);
    });
};

Sender.prototype.listenAck = function (self) {
    "use strict";
    self.server.on('message', function (msg, rinfo) {
        // fix to the special EOF value
        if (msg[0] === 0) {
            self.logger.log('[completed]');
            process.exit(rinfo);
        }
        // comment
        var seq = parseInt(msg.toString(), 2);
        var packetIndex = helpers.seqToIndex(seq);
        var lastIndex = helpers.seqToIndex(self.sequence);
        // check for time outs and update the acks accordingly
        if (self.sendTime && self.ack[packetIndex].acked) {
            self.updateRTT(new Date());
        }
        // after if
        self.logger.log('[recv ack] ' + seq);
        self.ack[packetIndex].acked = true;
        // loop logic
        var done = false;
        var i;
        for (i = lastIndex; i > (lastIndex - self.window); i -= 1) {
            if (self.ack[i] || self.ack[i].acked) {
                done = false;
                break;
            }
            done = true;
        }
        // continue execution of the program, self should be moved
        if (done && self.waiting) {
            clearTimeout(self.timer);
            self.waiting = false;
            self.window += 2;
            self.sendPackets();
        }
    }); // .bind self);
};


Sender.prototype.updateRTT = function (d2, self) {
    "use strict";
    var d1 = self.sendTime;
    self.sendTime = false;
    var diff = ~~(d2.getTime() - d1.getTime());
    self.timeout = ~~(self.timeout * 0.8 + 0.2 * diff);
};

Sender.prototype.processChunk = function (chunk, length, self) {
    "use strict";
    var chunkSize = Buffer.byteLength(chunk, 'utf8');
    if (chunkSize <= length) {
        self.queue.push(chunk);
    } else if (chunkSize > length) {
        var stringToChunk;
        while (Buffer.byteLength(chunk, 'utf8') > length) {
            stringToChunk = self.stringToChunk(chunk);
            chunk = stringToChunk[1];
            self.queue.push(stringToChunk[0]);
        }
        if (chunk) {
            self.queue.push(chunk);
        }
    }
    self.sendPackets(self);
};


Sender.prototype.sendPackets = function (self) {
    "use strict";
    if (self.waiting) {
        return;
    }
    var start = helpers.seqToIndex(self.sequence);
    self.sendTime = new Date();

    var i = start;
    for (i = start; i < self.window + start; i += 1) {
        if (self.queue[i]) {
            self.ack[i + 1] = {acked: false};
            self.sendData(self.queue[i], self);
        }
    }
    self.waitForAck(self);
};

Sender.prototype.waitForAck = function (self) {
    "use strict";
    self.waiting = true;
    self.timer = setTimeout(function () {
        if (self.waiting) {
            self.waiting = false;
            // if  self.window > 1) self.window--;
            self.rebroadcast(self);
        }
    });// .bind self), self.timeout););
};

Sender.prototype.rebroadcast = function (self) {
    "use strict";
    Object.keys(self.ack).forEach(function (key) {
        if (self.ack[key].acked) {
            self.sendData(self.queue[key - 1], true, self.ack[key].seq, self);
        }
    });
    self.waitForAck(self);
};

Sender.prototype.sendData = function (data, resending, seq, self) {
    "use strict";
    var dataBuffer = new Buffer(data);
    if (!resending) {
        self.sequence += dataBuffer.length;
    }
    // if no sequence number given, its a new packet
    if (self.seq) {
        seq = self.sequence;
    }
    self.ack[helpers.seqToIndex(seq)].seq = seq;
    var sequence = helpers.intBufferToIndex(seq, self.seqLength);
    var buffer = Buffer.concat([sequence, data]);
    self.logger.log('[send data] ' + self.sequence + ' (' + data.length + ')');
    self.server.send(buffer, 0, buffer.length, self.port, self.host);
};

// Returns a touple of [Chunk, Rest of string]
Sender.prototype.stringToChunk = function (str) {
    "use strict";
    var chunk = '';
    var char = str.charAt(0);
    while (Buffer.byteLength(chunk, 'utf8') < 1468) {
        char = str.charAt(0);
        if (Buffer.byteLength(chunk + char, 'utf8') <= 1468) {
            chunk += char;
            str = str.slice(1);
        } else {
            break;
        }
    }
    return [chunk, str];
};

const sender = new Sender();

sender.server.on('listening', function () {
    "use strict";
    sender.listen(sender);
    sender.listenAck(sender);
}); //.bind(sender);