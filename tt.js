
// const recv = new Reciever();

const recv = new Reciever();

recv.server.on('listening', function () {
    "use strict";
    recv.logger.log('[bound] ' + recv.server.address().port);
    recv.listen(recv);
});

const sender = new Sender();

sender.server.on('listening', function () {
    "use strict";
    sender.listen(sender);
    sender.listenAck(sender);
}); //.bind(sender);

