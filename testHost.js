#!/usr/bin/node
const dgram = require('dgram');
const child = require('child_process');
// Open up the server object and send the handle.
const server = require('dgram');

var testHarness = function (sender, recv) {
	'use strict';
  // req is an http.IncomingMessage, which is a Readable Stream
  // res is an http.ServerResponse, which is a Writable Stream

  	this.server = dgram.createSocket('udp4'); 

	this.spawn = child.fork('testHelper.js');
	this.server.bind(21344, () => {
		// this.spawn = child.spawn;
		this.spawn.server = dgram.createSocket('udp4');
		this.spawn.server.bind(21345);
	});
};

var test = new testHarness();

// child.fork('child_process.fork');

// test.spawn('message', (m) => {
//   console.log('PARENT got message:', m);
// });


// server.on('message', (socket) => {
//   socket.close('handled by parent');
// });

// server.bind(1337, () => {
//   child.send('server', server);
// });

// process.on('message', (m, server) => {
//   if (m === 'server') {
//     server.on('connection', (socket) => {
//       socket.close('handled by child');
//     });
//   }
// });