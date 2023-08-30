const net = require('net');
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let retransmitting = true;
let listenPort;
let retransmitIp = '127.0.0.1'; //default value
let retransmitPort;
let tcpClient;

// Prompt user for the TCP server port to listen to
rl.question('Enter TCP port to listen to: ', (portAnswer) => {
  listenPort = parseInt(portAnswer);
  if (!isNaN(listenPort)) {
    // TCP server to receive and retransmit data
    const tcpServer = net.createServer((client) => {
      client.on('data', (data) => {
        if (retransmitting && tcpClient) {
          tcpClient.write(data);
        }
      });
    });

    tcpServer.on('error', (err) => {
      console.error('TCP server error:', err);
    });

    tcpServer.listen(listenPort, () => {
      console.log(`TCP server listening on port ${listenPort}`);

      // Prompt user for the retransmit IP address and port number
      rl.question('Enter retransmit IP address (default: 127.0.0.1): ', (ipAnswer) => {
        if (ipAnswer.trim() !== '') {
          retransmitIp = ipAnswer.trim();
        }
        rl.question('Enter retransmit port number: ', (portAnswer) => {
          retransmitPort = parseInt(portAnswer);
          if (!isNaN(retransmitPort)) {
            tcpClient = net.connect(retransmitPort, retransmitIp, () => {
              console.log(`TCP client connected to ${retransmitIp}:${retransmitPort}`);
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

    // Handle program termination
    const cleanup = () => {
      if (tcpClient) {
        tcpClient.end();
      }
      process.exit(0);
    };

    process.on('SIGINT', cleanup); // Handle Ctrl+C
    process.on('SIGTERM', cleanup); // Handle termination signal
  } else {
    console.log('Invalid TCP server port number. Exiting.');
    process.exit(1);
  }
});
