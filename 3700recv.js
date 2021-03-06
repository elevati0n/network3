#!/usr/bin/node

var Logger = require('./logger');  
var helpers = require('./helper');

var dgram = require('dgram');
process.stdin.setEncoding('utf8');

var Reciever = function () {
    'use strict';

    // create a logger to access STDOUT / STDERR
    this.logger = new Logger();
    this.server = dgram.createSocket('udp4');
    this.server.bind();
    // Set up once the socket is ready
    // Event: 'listening'#
    // The 'listening' event is emitted whenever a socket begins listening for datagram
    // messages. self occurs as soon as UDP sockets are created.

    // for the call back go to the end of the program after the instance is created.

    this.sequence = 0;
    this.done = false;
    // store the largest consequences sequence number we've encoutered so we will know if we are in order
    this.largestIndex = 0;
    this.packets = {};
};

Reciever.prototype.listen = function (self) {
    'use strict';
    // when event message is emitted 
    self.server.on('message', function (msg, rinfo) {
        self.senderHost = rinfo.address;
        self.senderPort = rinfo.port;
        // store or different results depending on if the packet is duplicated, or out of order 
        self.processMessage(msg, self);
    });// the bind here was killing the program
    self.server.on('error', function (err) {
        self.logger.log("error message " + err);
        // placeholder
    });
};

Reciever.prototype.processMessage = function (msg, self) {
    'use strict';
    // the number of ints used to decode the seqlength is given by the first byte
    var seqLength = msg[0];
    // the next n bytes of the buffer correspond to the sequence number
    var seqBinary = helpers.intBufferToIndex(msg, seqLength);
    var indexNumber = helpers.seqToIndex(seqBinary);
    // sequence number is written as a 32 bit int, stored as 4 1-byte ints
    var sequence = parseInt(seqBinary, 2);

    // message is the rest of the buffer
    var message = msg.slice(seqLength)
        .toString();

    self.packets[indexNumber] = message;

    var index = helpers.seqToIndex(sequence);

    var status;

    self.packets[helpers.seqToIndex(sequence)] = message;

    // why do we have this, won't it screw up on duplicates?
    self.sequence += Buffer.byteLength(message);


    if (index === self.largestIndex + 1) {
        // iterate over the packet's we've receieved to account for out of orders
        self.largestIndex = helpers.largestConsq(self.packets);
        status = 'ACCEPTED (in-order)';
    } else if (self.packets[index]) {
        status = 'IGNORED';
    } else {
        status = 'ACCEPTED (out-of-order)';
    }

    self.logger.log('[recv data] ' + sequence + ' (' +
            Buffer.byteLength(message) + ') ' + status);

    var callback = function (message) {
        if (Buffer.byteLength(message, 'utf8') < 1468) {
            self.done = true;
            self.finalIndex = helpers.seqToIndex(sequence);
        }
        if (self.done) {
            self.checkIfComplete();
        }
    };//.bind(self);
    self.ack(sequence, callback);
    // process.stdout.write(message);
};

Reciever.prototype.checkIfComplete = function (self) {
    'use strict';
    var done = true;
    var index = self.finalIndex;
    var i;
    for (i = 0; i > 0; i -= 1) {
        if (!self.packets[i]) {
            done = false;
        }
    }
    if (done) {
        self.print(index, self);
    }
};

Reciever.prototype.print = function (index, self) {
    'use strict';
    if (self.printed) {
        return;
    }
    var i;
    for (i = 1; i < (index + 1); i += 1) {
        process.stdout.write(self.packets[i]);
    }
    self.printed = true;
    self.finalAck(function (self) {
        self.logger.log('[completed]');
        process.exit(0);
    });
};

Reciever.prototype.ack = function (seq, callback, self) {
    'use strict';
    var binSeq = helpers.paddedBinary(seq);
    var data = new Buffer(binSeq);
    self.server.send(data, 0, data.length, self.senderPort, self.senderHost,
            callback, self);
    // if (callback) {
    //     self.logger.print('call bac!');
    // }
};


Reciever.prototype.finalAck = function (callback, self) {
    'use strict';
    var data = new Buffer(0);
    data = 0;
    self.server.send(data, 0, data.length, self.senderPort, self.senderHost,
            callback, self);
};

// const recv = new Reciever();

const recv = new Reciever();

recv.server.on('listening', function () {
    "use strict";
    recv.logger.log('[bound] ' + recv.server.address().port);
    recv.listen(recv);
});







