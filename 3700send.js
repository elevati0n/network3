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
        input = ['127.0.0.1', 56543];
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

Sender.prototype.listen = function () {
    "use strict";
    var bufferArr = [];
    process.stdin.on('readable', function () {
        var chunk = process.stdin.read();
        var buff;
        while (chunk) {
            buff = new Buffer(chunk);
            bufferArr.push(buff);
            this.bufferSize += buff.length;
        }
        this.seqLength = Math.ceil(this.bufferSize / this.dataLength);
    });
};

Sender.prototype.listenAck = function () {
    "use strict";
    this.server.on ('message', function (msg, rinfo) {
      if (msg.toString() === 'e') {
        this.logger.log ('[completed]');
        process.exit(0);
      }
      // comment
      var seq = parseInt(msg.toString (), 2);
      var packetIndex = helpers.seqToIndex (seq);
      var lastIndex = helpers.seqToIndex (this.sequence);
      // check for time outs and update the acks accordingly
      if (this.sendTime && !this.ack[packetIndex].acked) {
        this.updateRTT(new Date());
      }
      // after if
      this.logger.log('[recv ack] ' + seq);
      this.ack[packetIndex].acked = true;
      // loop logic
      var done = false;
      var i;
      for (i = lastIndex; i > (lastIndex - this.window);  i--) {
          if (!this.ack[i] || !this.ack[i].acked) {
            done = false;
          } else {
            done = done && true;
          }
      }
      if (done && this.waiting) {
          clearTimeout(this.timer);
          this.waiting = false;
          this.window ++;
          this.sendPackets();
      }
    }); // .bind(this);
  };


Sender.prototype.updateRTT = function(d2) {
  "use strict";
  var d1 = this.sendTime;
  this.sendTime = false;
  var diff = ~~(d2.getTime() - d1.getTime());
  this.timeout = ~~(this.timeout * 0.8 + 0.2 * diff);
};

Sender.prototype.processChunk = function (chunk, length) {
  "use strict";
    var chunkSize = Buffer.byteLength(chunk, 'utf8');
    if (chunkSize <= length) {
        this.queue.push(chunk);
    } else if (chunkSize > length) {
        var stringToChunk;
        while(Buffer.byteLength(chunk, 'utf8') > length) {
          stringToChunk = this.stringToChunk(chunk);
          chunk = stringToChunk[1];
          this.queue.push(stringToChunk[0]);
        }
        if (chunk) { this.queue.push(chunk); }
    }
    this.sendPackets();
};


Sender.prototype.sendPackets = function() {
  "use strict";
  if (this.waiting) {
    return;
  }
  var start = helpers.seqToIndex(this.sequence);
  this.sendTime = new Date();

  var i = start;
  for (i = start; i < this.window + start; i+=1) {
    if (this.queue[i]) {
      this.ack[i + 1] = {acked: false};
      this.sendData(this.queue[i]);
    }
  }
  this.waitForAck();
};

Sender.prototype.waitForAck = function() {
    "use strict";
    this.waiting = true;
    this.timer = setTimeout(function() {
      if (this.waiting) {
        this.waiting = false;
        // if (this.window > 1) this.window--;
        this.rebroadcast();
      }
    }// .bind(this), this.timeout);
  );
};

Sender.prototype.rebroadcast = function() {
  "use strict";
  Object.keys(this.ack).forEach(function(key) {
    if (!this.ack[key].acked) {
      this.sendData(this.queue[key - 1], true, this.ack[key].seq);
    }
  });
  this.waitForAck();
};

Sender.prototype.sendData = function(data, resending, seq) {
    "use strict";
    var dataBuffer = new Buffer(data);
    if (!resending) { this.sequence += dataBuffer.length;} 
    // TODO : refactor   
    var seq = seq || this.sequence;
    

    this.ack[helpers.seqToIndex(seq)].seq = seq;
    var sequence = helpers.intBufferToIndex(seq, this.seqLength);
    var buffer = Buffer.concat([sequence, data]);
    this.logger.log('[send data] ' + this.sequence + ' (' + data.length + ')' );
    this.server.send(buffer, 0, buffer.length, this.port, this.host);
};

// Returns a touple of [Chunk, Rest of string]
Sender.prototype.stringToChunk = function(str) {
  "use strict";
  var chunk = '';
  while(Buffer.byteLength(chunk, 'utf8') < 1468) {
    var char = str.charAt(0);
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

sender.server.on('listening', function() {
    "use strict";
    sender.listen();
    sender.listenAck();
}.bind(this));