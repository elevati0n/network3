

// Sender.prototype.listenAck = function() {
//     this.server.on('message', function(msg, rinfo) {
//         if (msg.toString() === 'e') {
//           this.logger.log('[completed]');
//           process.exit(0);
//         }
//         var seq = parseInt(msg.toString(), 2)
//         var packetIndex = helpers.seqToIndex(seq);
//         var lastIndex = helpers.seqToIndex(this.sequence);
//         if (this.sendTime && !this.ack[packetIndex].acked) this.updateRTT(new Date());
//         this.logger.log('[recv ack] ' + seq);
//         this.ack[packetIndex].acked = true;
//         var done = true;
//         for (var i = lastIndex; i > (lastIndex - this.window);  i--) {
//           if (!this.ack[i] || !this.ack[i].acked) done = false;
//         }
//         if (done && this.waiting) {
//           clearTimeout(this.timer);
//           this.waiting = false;
//           this.window ++;
//           this.sendPackets();
//         }
//     }.bind(this));
// }





// Sender.prototype.listenAck = function() {
//     this.server.on('message', function(msg, rinfo) {
//         if (msg.toString() === 'e') {
//           this.logger.log('[completed]');
//           process.exit(0);
//         }
//         var seq = parseInt(msg.toString(), 2)
//         var packetIndex = helpers.seqToIndex(seq);
//         var lastIndex = helpers.seqToIndex(this.sequence);
//         if (this.sendTime && !this.ack[packetIndex].acked) this.updateRTT(new Date());
//         this.logger.log('[recv ack] ' + seq);
//         this.ack[packetIndex].acked = true;
//         var done = true;
//         for (var i = lastIndex; i > (lastIndex - this.window);  i--) {
//           if (!this.ack[i] || !this.ack[i].acked) done = false;
//         }
//         if (done && this.waiting) {
//           clearTimeout(this.timer);
//           this.waiting = false;
//           this.window ++;
//           this.sendPackets();
//         }
//     }.bind(this));
// }