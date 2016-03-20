#!/usr/bin/node

var split = require("split"); // dominictarr’s helpful line-splitting module

process.stdin
    .pipe(split()) // split input into lines
    .pipe(process.stdout); // write solution to stdout