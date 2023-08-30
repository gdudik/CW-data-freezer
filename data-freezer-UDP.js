const dgram = require('dgram');
const http = require('http');
const readline = require('readline');
const udpServer = dgram.createSocket('udp4');
const udpClient = dgram.createSocket('udp4');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let retransmitting = true;
let listenPort;
let retransmitIp = '127.0.0.1'; //default value
let retransmitPort;

// UDP server to receive and retransmit data
udpServer.on('message', (msg, rinfo) => {
  if (retransmitting) {
    udpClient.send(msg, 0, msg.length, retransmitPort, retransmitIp, (err) => {
      if (err) {
        console.error('Error retransmitting data:', err);
      }
    });
  }
});

udpServer.on('error', (err) => {
  console.error('UDP server error:', err);
});

// HTTP server to handle stop and resume requests
const httpServer = http.createServer((req, res) => {
  if (req.url === '/stop') {
    console.log('Data retransmission stopped.');
    retransmitting = false;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Data retransmission stopped.');
  } else if (req.url === '/resume') {
    console.log('Data retransmission resumed.');
    retransmitting = true;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Data retransmission resumed.');
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Prompt user for the UDP port to listen to
rl.question('Enter UDP port to listen to: ', (answer) => {
  listenPort = parseInt(answer);
  if (!isNaN(listenPort)) {
    rl.question('Enter retransmit IP address (default: 127.0.0.1): ', (ipAnswer) => {
      if (ipAnswer.trim() !== '') {
        retransmitIp = ipAnswer.trim();
      }
      rl.question('Enter retransmit port number: ', (portAnswer) => {
        retransmitPort = parseInt(portAnswer);
        if (!isNaN(retransmitPort)) {
          udpServer.bind(listenPort, () => {
            console.log(`UDP server listening on port ${listenPort}`);

            httpServer.listen(8080, () => {
              console.log('HTTP server listening on port 8080');
            });
          });
        } else {
          console.log('Invalid retransmit port number. Exiting.');
          process.exit(1);
        }
      });
    });
  } else {
    console.log('Invalid listen port number. Exiting.');
    process.exit(1);
  }
});
