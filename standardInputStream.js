const fs = require('fs');
const spawn = require('child_process').spawn;
// const out = fs.openSync('./out.log', 'a');
// const err = fs.openSync('./out.log', 'a');

const child = spawn('FileReader.js', [], {
 detached: true,
 stdio: [0 , 1, 2 ]
});

// child.unref();


