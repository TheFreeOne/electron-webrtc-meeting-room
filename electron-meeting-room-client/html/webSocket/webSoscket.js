"use strict";
const electron_1 = require("electron");
const ChannelConstant_1 = require("../../util/ChannelConstant");
var token;
const config = require('../../config.json');
var webSocket;
electron_1.ipcRenderer.once('token', (event, _token) => {
    token = _token;
    let wsUrl = config.javaLoginServer.startsWith('http://') ? config.javaLoginServer.replace('http://', 'ws://') : config.javaLoginServer.replace('https://', 'wss://');
    webSocket = new WebSocket(wsUrl + '/imserver/' + token);
    webSocket.onopen = (event) => {
        console.log(event);
    };
    webSocket.onmessage = (event) => {
        let message = JSON.parse(event.data);
        if (message.cmd === 'login in other places') {
            electron_1.ipcRenderer.send(ChannelConstant_1.default.LOGIN_IN_OTHER_PLACES);
        }
    };
    webSocket.onerror = (event) => {
        webSocket = new WebSocket(config.javaLoginServer + '/imserver/' + token);
    };
    webSocket.onclose = () => {
        webSocket = new WebSocket(config.javaLoginServer + '/imserver/' + token);
    };
});
module.exports = {};
//# sourceMappingURL=webSoscket.js.map