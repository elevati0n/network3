#!/usr/bin/node

var Logger = require('./logger');
var helpers = require('./helper');

var dgram = require('dgram');
process.stdin.setEncoding('utf8');


var Reciever = function() {
    this.logger = new Logger();

    this.server = dgram.createSocket('udp4');
    this.server.bind(); // bind to 0.0.0.0:random port

    this.senderPort;
    this.senderHost;
    this.done = false;
    this.largestIndex = 0;
    this.datalength = 1468;

    this.packets = {};
    this.printed = false;

    // Set up once the socket is ready
    this.server.on('listening', function() {
        this.logger.log('[bound] ' + this.server.address().port);
        this.listen();
    }.bind(this));
}


Reciever.prototype.listen = function() {
    // bind to port, process incoming packetized messages
    this.server.on('message', function(msg, rinfo) {
        this.senderHost = rinfo.address;
        this.senderPort = rinfo.port;
        this.processMessage(msg);
    }.bind(this));

    this.server.on('error', function(err) {
        // placeholder
    })
}

Reciever.prototype.processMessage = function(msg) {
    // the first four bytes of the buffer are the sequence number
    var seqBuffr = msg.slice(0, 4);


    var sequence = helpers.convertSeqFromIntBuffer(seqBuffr);

    this.logger.log('Received packet ' + sequence);

    // the rest of the buffer is the message data
    var message = msg.slice(4).toString();
    var index = helpers.seqToIndex(sequence);
    
    // store the packet message in an array that is indexed by its sequence number
    this.packets[index] = message;

    var status;
    // need to check packet order for printing messages 
    if (index === this.largestIndex + 1) {
      // may have received leading packet out of order while waiting, need to calculate  
      this.largestIndex = helpers.largestConsq(this.packets);
      status = 'ACCEPTED (in-order)';
    } else if (this.packets[index]) {
      status = 'IGNORED';
    } else {
      status = 'ACCEPTED (out-of-order)';
    }
    this.logger.log('[recv data] ' + sequence + ' (' + Buffer.byteLength(message) + ') ' + status);

    // after the message is read, check to see if it is the final message.  
    var callback = function() {
      // The final message will be shorter than the normal datalength
      if (Buffer.byteLength(message, 'utf8') < this.datalength) {
        this.done = true;
        // The sequence number of this packet corresponds to the final index 
        this.finalIndex = index;
      }
      // Check to make sure we aren't missing any outstanding packets
      if (this.done) this.checkIfComplete();
    }.bind(this);
    
    this.ack(sequence, callback);
}

Reciever.prototype.checkIfComplete = function() {

  var index = this.finalIndex;
  // iterate through the packet array checking for missing packets
  for (var i = index; i > 0; i--) {
    // if packet is missing, receiving isn't complete, 
    if (!this.packets[i]) {
        done = false;
    } else {
        // verify that loop has run completely
        if (i === 1) {
            done = true;
      }
    }
  }
  // once the entire message has been sent, print it to STDOUT
  if (done) this.print(index);
 }


Reciever.prototype.print = function(index) {
  //  make sure not to print the message twice (fix for potential concurrency issue) 
  if (this.printed) {
    return;
  }

  for (var i = 1; i < (index + 1); i++) {
    process.stdout.write(this.packets[i]);
  }
    // make sure not to print the message twice (fix for potential concurrency issue)
    this.printed = true;
    // send the final ack and wait for callback to prevent exiting early 
    this.finalAck(function() {
      // print to STD ERR Complete message
      this.logger.log('[completed]');
      process.exit(0);
    }.bind(this));
}


Reciever.prototype.ack = function(seq, callback) {
    // use the sequence number as our ack 
    //var binSeq = helpers.paddedBinary(seq);
    var data = helpers.convertSequence(seq);
    this.server.send(data, 0, data.length, this.senderPort, this.senderHost, callback);
}

Reciever.prototype.finalAck = function(callback) {
    // special ack to acknowledge that receiving is complete
    var data = new Buffer(1);
    data[0] = 0;
    //data.write(null);
    this.server.send(data, 0, data.length, this.senderPort, this.senderHost, callback);
}

new Reciever();