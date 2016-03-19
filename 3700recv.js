#!/usr/bin/node

var Logger = require('./logger');  
var helpers = require('./helper');

var dgram = require('dgram');
process.stdin.setEncoding('utf8');

var Reciever = function () {
    'use strict';
    // create a logger to access STDOUT / STDERR
    this.logger = new Logger();
    this.sequence = 0;
    this.done = false;
    this.largestIndex = 0;
    this.packets = {};

    this.server = dgram.createSocket('udp4');
    this.server.bind();
};

Reciever.prototype.listen = function () {
    'use strict';
    this.server.on('message', function (msg, rinfo) {
        this.senderHost = rinfo.address;
        this.senderPort = rinfo.port;
        this.processMessage(msg);
    });// the bind here was killing the program
    this.server.on('error', function (err) {
        this.logger.log("error message " + err);
        // placeholder
    });
};

Reciever.prototype.processMessage = function (msg) {
    'use strict';
    // the number of ints used to decode the seqlength is given by the first byte
    var seqLength = msg[0];
    // the next n bytes of the buffer correspond to the sequence number
    var seqBuffr = msg.slice(1, seqLength);
    var seqBinary = helpers.intBufferToIndex(seqBuffr, seqLength);
    var indexNumber = helpers.seqToIndex(seqBinary);
    // sequence number is written as a 32 bit int, stored as 4 1-byte ints
    var sequence = parseInt(seqBinary, 2);

    // message is the rest of the buffer
    var message = msg.slice(seqLength)
        .toString();

    this.packets[indexNumber] = message;

    var index = helpers.seqToIndex(sequence);

    var status;

    this.packets[helpers.seqToIndex(sequence)] = message;

    this.sequence += Buffer.byteLength(message);

    if (index === this.largestIndex + 1) {
        this.largestIndex = helpers.largestConsq(this.packets);
        status = 'ACCEPTED (in-order)';
    } else if (this.packets[index]) {
        status = 'IGNORED';
    } else {
        status = 'ACCEPTED (out-of-order)';
    }

    this.logger.log('[recv data] ' + sequence + ' (' +
            Buffer.byteLength(message) + ') ' + status);

    var callback = function (message) {
        if (Buffer.byteLength(message, 'utf8') < 1468) {
            this.done = true;
            this.finalIndex = helpers.seqToIndex(sequence);
        }
        if (this.done) {
            this.checkIfComplete();
        }
    };
    this.ack(sequence, callback);
    // process.stdout.write(message);
};

Reciever.prototype.checkIfComplete = function () {
    'use strict';
    var done = true;
    var index = this.finalIndex;
    var i;
    for (i = 0; i > 0; i -= 1) {
        if (!this.packets[i]) {
            done = false;
        }
    }
    if (done) {
        this.print(index);
    }
};

Reciever.prototype.print = function (index) {
    'use strict';
    if (this.printed) {
        return;
    }
    var i;
    for (i = 1; i < (index + 1); i += 1) {
        process.stdout.write(this.packets[i]);
    }
    this.printed = true;
    this.finalAck(function () {
        this.logger.log('[completed]');
        process.exit(0);
    })
        .bind(this);
};

Reciever.prototype.ack = function (seq, callback) {
    'use strict';
    var binSeq = helpers.paddedBinary(seq);
    var data = new Buffer(binSeq);
    this.server.send(data, 0, data.length, this.senderPort, this.senderHost,
            callback);
    // if (callback) {
    //     this.logger.print('call bac!');
    // }
};


Reciever.prototype.finalAck = function (callback) {
    'use strict';
    var data = new Buffer('e');
    this.server.send(data, 0, data.length, this.senderPort, this.senderHost,
            callback);
};

const recv = new Reciever();

// Set up once the socket is ready
// Event: 'listening'#
// The 'listening' event is emitted whenever a socket begins listening for datagram
// messages. This occurs as soon as UDP sockets are created.
recv.server.on('listening', function () {
    'use strict';
    // recv.server.bind(
    //     (Math.random(999999) % 65535) + 1024);

    // bind to 0.0.0.0:random port
    recv.logger.log('[bound] ' + recv.server.address().port);
    recv.listen();
});













