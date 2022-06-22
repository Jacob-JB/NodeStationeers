const pty = require('node-pty');
const ansiConvert = new (require('ansi-to-html'))();
const fs = require('fs');
const { addEventSystem } = require(__dirname + '/utils.js');
addEventSystem(module.exports)

module.exports.runState = false;
module.exports.runMode = '';
module.exports.console = '';
module.exports.dontAutoStartNext = false;

function startServer() {
    if (module.exports.runState == true) {
        return false;
    }

    module.exports.dontAutoStartNext = false;
    module.exports.runMode = 'game';

    let command = config.binary + config.launchArgs.reduce((p, e) => {return `${p} ${e}`}, ' ');
    let server = new ProcessInstance(command, config.workingDir);

    module.exports.currentServerInstance = server;

    return server;
}
module.exports.startServer = startServer;
function stopServer(stopForced) {
    if (module.exports.runState == false) {
        return;
    }

    if (stopForced) {
        module.exports.currentServerInstance.stopForced();
    } else {
        module.exports.currentServerInstance.stopPolitely();
    }
}
module.exports.stopServer = stopServer;
function updateGame(beta) {
    if (module.exports.runState == true) {
        return false;
    }

    module.exports.runMode = 'update';

    let server = new ProcessInstance(
        `./steamcmd.sh +force_install_dir +login anonymous ${config.workingDir} +app_update 600760 -beta ${beta} validate +quit`,
        config.steamDir
    );

    module.exports.currentServerInstance = server;

    return server;
}
module.exports.updateGame = updateGame;

class ProcessInstance {
    constructor(command, directory) {
        module.exports.runState = true;

        reloadConfig();
        this.serverProcess = pty.spawn(
            'bash',
            ['-c', command],
            {cwd: directory}
        );

        this.serverProcess.on('data', data => {
            data = data.replace(/</g, "&lt;");
            data = data.replace(/>/g, "&gt;");
            data = data.replace(/\n/g, "<br>");
            data = ansiConvert.toHtml(data);
            this.consoleOut(data);
        });

        this.serverProcess.onExit(() => {
            module.exports.currentServerInstance = undefined
            module.exports.runState = false
            module.exports.runMode = ';'
            module.exports.fireEvent('server stopped')

            console.log('process stopped')

            if (module.exports.runMode == 'game') {
                reloadConfig();
                console.log('auto restarting');
                if (!module.exports.dontAutoStartNext && config.autoRestart) {
                    startServer();
                }
            }
        })

        module.exports.fireEvent('server started', {mode: module.exports.runMode, command: command});
    }

    stopForced() {
        this.serverProcess.kill()
        console.log('process killed');
    }

    stopPolitely() {
        if (module.exports.runMode == 'game') {
            this.writeConsoleLine('quit');
        }
    }

    writeConsoleLine(line) {
        this.serverProcess.write(line);
        setTimeout(() => {
            this.serverProcess.write('\n');
        }, 100)
    }

    consoleOut(text) {
        module.exports.console += text;
        module.exports.fireEvent('console data', text);
    }
}


var config;
function reloadConfig() {
  config  = JSON.parse(fs.readFileSync(__dirname + '/managerSettings.json'));
}
reloadConfig();
if (config.autoStart) {
    startServer();
}
this.port = config.port

module.exports.getSaveList = () => {
    reloadConfig();
    return fs.readdirSync(config.workingDir + 'saves/')
};