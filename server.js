//Functions to use

/** Simple coin flip
 * 
 * Write a function that accepts no parameters but returns either heads or tails at random.
 * 
 * @param {*}
 * @returns {string} 
 * 
 * example: coinFlip()
 * returns: heads
 * 
 */

 function coinFlip() {
  if(Math.random() < 0.5){
    return "tails";
  }else{
    return "heads";
  }
}

/** Multiple coin flips
 * 
 * Write a function that accepts one parameter (number of flips) and returns an array of 
 * resulting "heads" or "tails".
 * 
 * @param {number} flips 
 * @returns {string[]} results
 * 
 * example: coinFlips(10)
 * returns:
 *  [
      'heads', 'heads',
      'heads', 'tails',
      'heads', 'tails',
      'tails', 'heads',
      'tails', 'heads'
    ]
 */

function coinFlips(flips) {
  var result = [];
  for(let i = 0; i < flips; i++){
    result[i] = coinFlip();
  }
  return result;
}

/** Count multiple flips
 * 
 * Write a function that accepts an array consisting of "heads" or "tails" 
 * (e.g. the results of your `coinFlips()` function) and counts each, returning 
 * an object containing the number of each.
 * 
 * example: conutFlips(['heads', 'heads','heads', 'tails','heads', 'tails','tails', 'heads','tails', 'heads'])
 * { tails: 5, heads: 5 }
 * 
 * @param {string[]} array 
 * @returns {{ heads: number, tails: number }}
 */

function countFlips(array) {
  let numHeads = 0, numTails = 0;
  for(let i = 0; i < array.length; i++){
    if(array[i] === "heads"){
      numHeads = numHeads + 1;
    }else{
      numTails = numTails + 1;
    }
  }
  var result = {tails: numTails, heads: numHeads};
  return result;
}

/** Flip a coin!
 * 
 * Write a function that accepts one input parameter: a string either "heads" or "tails", flips a coin, and then records "win" or "lose". 
 * 
 * @param {string} call 
 * @returns {object} with keys that are the input param (heads or tails), a flip (heads or tails), and the result (win or lose). See below example.
 * 
 * example: flipACoin('tails')
 * returns: { call: 'tails', flip: 'heads', result: 'lose' }
 */

function flipACoin(call) {
  var expected = coinFlip();
  var outcome = "lose";
  if(call === expected){
    outcome = "win";
  }
  var result = {call: call, flip: expected, result: outcome};
  return result;
}

// Require Express.js
const express = require('express');
const app = express();

app.use(express.json());

const args = require("minimist")(process.argv.slice(2));
args["port"];
var port = args.port || process.env.PORT || 5000


// Start an app server
const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});


const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

const fs = require("fs");

const morgan = require("morgan");

// If --log=false then do not create a log file
if (args.log == 'false') {
  console.log("NOTICE: not creating file access.log")
} else {
// Use morgan for logging to files
// Create a write stream to append to an access.log file
  const accessLog = fs.createWriteStream('access.log', { flags: 'a' })
// Set up the access logging middleware
  app.use(morgan('combined', { stream: accessLog }))
}

// Make express use its own built-in body parser
app.use(express.urlencoded({extended: true}));

// Load the database
const db = require('./database.js');
// Add a new record
app.use((req, res, next) => {
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    status: res.statusCode,
    referrer: req.headers['referrer'],
    useragent: req.headers['user-agent']
  };
  const stmt = db.prepare('INSERT into accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent);
  console.log(info);
  next();
})

app.get('/app', (req, res, next) => {
  res.json({"message":"Your API works! (200)"});
	res.status(200);
}); 

app.get('/app/flips/:number', (req, res) => {
  const flips = coinFlips(req.params.number);
  const counts = countFlips(flips);
  res.status(200).json({"raw": flips, "summary": counts});
})

app.get('/app/flip', (req, res) => {
  const flip = coinFlip();
  res.status(200).json({"flip": flip});
})

app.get('/app/flip/call/heads', (req, res) => {
  const flip = flipACoin("heads");
  res.status(200).json(flip);
})

app.get('/app/flip/call/tails', (req, res) => {
  const flip = flipACoin("tails");
  res.status(200).json(flip);
})


if(args.debug || args.d){
  app.get('/app/log/access', (req, res, next) => {
    const stmt = db.prepare('SELECT * from accesslog').all();
    res.status(200).json(stmt);
  });

  app.get('/app/error', (req, res, next) =>{
    throw new Error("Error test successful.");
  });
}

// Default response for any other request
app.use(function(req, res){
  res.type("text/plain");
  res.status(404).send("404 Not Found");
});

// Tell STDOUT that the server is stopped
process.on('SIGINT', () => {
  server.close(() => {
  console.log('\nApp stopped.');
  });
});