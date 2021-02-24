import { ipcRenderer } from "electron"
import ChannelConstant from "../../util/ChannelConstant";
var token: string;
const config = require('../../config.json');
var webSocket: WebSocket;
ipcRenderer.once('token', (event, _token) => {
    token = _token;

    let wsUrl = (config.javaLoginServer as string).startsWith('http://')?(config.javaLoginServer as string).replace('http://','ws://'):(config.javaLoginServer as string).replace('https://','wss://')

    webSocket = new WebSocket(wsUrl + '/imserver/' + token);

    webSocket.onopen = (event) => {
        console.log(event);
    }
    webSocket.onmessage = (event) => {
        let message = JSON.parse(event.data);
        if(message.cmd === 'login in other places'){
            ipcRenderer.send(ChannelConstant.LOGIN_IN_OTHER_PLACES);
        }
    }

    webSocket.onerror = (event) => {
        webSocket = new WebSocket(config.javaLoginServer + '/imserver/' + token);
    }

    webSocket.onclose = () => {
        webSocket = new WebSocket(config.javaLoginServer + '/imserver/' + token);
    }

})

export = {}