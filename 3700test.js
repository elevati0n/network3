#!/usr/bin/node
var dgram = require('dgram');
var Logger = require('./logger');
var helpers = require('./helper');

// the two test components
var dgram = require('dgram');
var Logger = require('./logger');

process.stdin.setEncoding('utf8');

// Limit of 1472 bytes
// if we use  4 bytes for our sequence, then we have 1468 bytes left
var Tester = function () {
    'use strict';
    // read from the input to get port number
    var input = process.argv;
   if (!input) {
        input = process.argv[2].split(':');
   } else {
       input = ['127.0.0.1', 57000];
   // }
    this.logger = new Logger();
    this.window = 10;
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