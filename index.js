const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const io = require('socket.io')(server);

const serverManager = require(__dirname + '/serverManager.js');


app.use('/', express.static(__dirname + '/client'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
})

io.on('connection', socket => {
    new Client(socket);
});

let latestStartData = {};
serverManager.onEvent('server started', data => {
    latestStartData = data;
    console.log('process started\n'+data.command)
    io.emit('server started', latestStartData);
});
serverManager.onEvent('server stopped', () => {
    latestStartData = {};
    io.emit('server stopped');
})
serverManager.onEvent('console data', data => {
    io.emit('console data', data)
})

const clients = [];
class Client {
    constructor(socket) {
        this.socket = socket;

        socket.on('disconnect', () => {
            clients.splice(clients.indexOf(this), 1);
        });

        socket.on('request init', () => {
            socket.emit('init data', {
                console: serverManager.console,
                state: serverManager.runState,
                latestStartData: latestStartData
            });
        });

        socket.on('start server', () => {
            serverManager.startServer();
        })
        socket.on('stop server', () => {
            if (serverManager.runMode == 'game') {
                serverManager.dontAutoStartNext = true;
                serverManager.stopServer(false);
            }
        })
        socket.on('kill server', () => {
            serverManager.dontAutoStartNext = true;
            serverManager.stopServer(true)
        });
        socket.on('update game', beta => {
            serverManager.updateGame(beta);
        });
        socket.on('list saves', () => {
            socket.emit('save list', serverManager.getSaveList());
        });

        socket.on('console line', line => {
            if (serverManager.runMode == 'game') {
                serverManager.currentServerInstance.writeConsoleLine(line);
            }
        })

        clients.push(this);
    }
}



const port = serverManager.port;
server.listen(port, () => {
    console.log(`listening on port \x1b[34m${port}\x1b[0m`);
});