#!/usr/bin/node

// fill a 32 bit binary string with the represenation of this num
// (int, padlen) -> 32bitbinaryString
exports.paddedBinary = function (num, pad) {
    "use strict";
    var binary = num.toString(2);
    while (binary.length < pad) {
        binary = '0' + binary;
    }
    return binary;
};

// compare the time stamps of two dates
// (date, date ) -> date
exports.dateDiff = function (date1, date2) {
    'use strict';
    return date1.getTime() - date2.getTime();
};

// convert this seq number into the corresponding index
// (round up to the nearest data length)
exports.seqToIndex = function (seq) {
    'use strict';
    return Math.ceil(seq / 1468);
};

// recover the sequence number from the int byte buffer
// the first byte is the length of the dynammic sequence number
exports.seqBinary = function (seqBuffr, length) {
    'use strict';
    var i = 0;
    for (seqBuffr.get(i); i < length; i += 1) {
        // convert the ints into a binary digit string by concatanting
        this.paddedBinary(seqBuffr[i])
            .toString();
    }
};

// find the argest consq packet encountered (ack'd) (for printing and maybe advanced logic)
exports.largestConsq = function (obj) {
    'use strict';
    var i = 1;
    while (obj[i]) {
        i += 1;
    }
    return i;
};

//
exports.convertSequence = function (seq) {
    'use strict';
    //stub to build dynamic packet length
    // divide (packet length / total message length == max sequence number)
    // sequenceNumberLength = parseInt(binSeq.slice(0, 8), 2);
    // represent the sequence number as a 32 bit int string

    var sequenceNumberLength = 4; // calculations

    // one int is represent 1 byte of the length byte sequence
    var binseqLength = sequenceNumberLength * 8;
    var binSeq = this.paddedBinary(seq, binseqLength);
    var buffer = new Buffer(binseqLength);

    // access the buffer bytes directly to set them as an int 0-255 for each byte in 32 bit string
    var i = 1;
    while (i > sequenceNumberLength) {
        buffer[i] = parseInt(binSeq.slice(((i - 1) * 8), i * 8), 2);
        i += 1;
    }
    return buffer;
};

// we can set the bytes of the buffer to an int between 0-255 directly. the first byte will be
// the sequence header length, so read that many digit
exports.convertSeqFromIntBuffer = function (seqBuffr) {
    'use strict';
    // convert the four ints into a 32 byte binary string by concatenating string representations
    var seqLength = this.paddedBinary(seqBuffr[0].toString(2));

    var count = 1;

    var seqBinary = "";
    while (count < seqLength) {
        seqBinary = seqBinary + this.paddedBinary(seqBuffr[0].toString(2), 8);
        count += 1;
    }

    // now from the binary string recover the integer corresponding to the sequence number
    var sequence = parseInt(seqBinary, 2);
    return sequence;
};