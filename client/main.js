const socket = io();

socket.on('disconnect', () => {
    location.reload();
});


var serverState = false
socket.on('server started', data => {
    console.log('server started');
    setRunning(data);
})
socket.on('server stopped', () => {
    console.log('server stopped');
    setStopped();
})
function setRunning(startData) {
    document.querySelector('#consoleOutput').innerHTML = '';
    writeToConsole(`<p style="background-color: green;">${startData.command}</p>`);
    document.querySelector('#startStopButton').innerHTML = 'Stop';
    document.querySelector('#status').innerHTML = 'Status: Running, ' + startData.mode;
}
function setStopped() {
    document.querySelector('#startStopButton').innerHTML = 'Start';
    document.querySelector('#status').innerHTML = 'Status: Stopped';
    writeToConsole('<p style="background-color: red;">Process Stopped</p>');
}


function startStopGame() {
    const button = document.querySelector('#startStopButton');

    if (button.innerHTML == 'Start') {
        console.log('starting')

        socket.emit('start server')
    } else {
        console.log('stopping')

        socket.emit('stop server')
    }
}
function killServer() {
    socket.emit('kill server');
}
function updateGame(beta) {
    socket.emit('update game', beta);
}
function listSaves() {
    socket.emit('list saves');
}
socket.on('save list', saveNames => {
    writeToConsole(`<p style="background-color: blue;">Saves:${
        saveNames.reduce((p, e) => {
            return `${p}<br/>${e}`
        }, '')
    }</p>`)
});

const consoleInput = document.querySelector('#consoleInput')
consoleInput.onkeypress = (e) => {
    if (!e) {e = window.event;}
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter') {
        console.log(consoleInput.value);

        socket.emit('console line', consoleInput.value)

        consoleInput.value = '';
    }
};

function writeToConsole(text) {
    div = document.querySelector('#consoleOutput');
    let autoScroll = (div.scrollHeight - div.offsetHeight) == div.scrollTop;
    document.querySelector('#consoleOutput').innerHTML += text;
    if (autoScroll) {
        scrollConsoleToBottom();
    }
}
function scrollConsoleToBottom() {
    div = document.querySelector('#consoleOutput');
    div.scrollTop = div.scrollHeight;
}

socket.on('console data', data => {
    writeToConsole(data);
})


socket.on('init data', data => {
    if (data.state) {
        setRunning(data.latestStartData);
    } else {
        setStopped();
    }

    writeToConsole(data.console);
    scrollConsoleToBottom()
})
socket.emit('request init')