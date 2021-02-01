import { ipcRenderer } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
let roomNumber:string;
ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS,(event,_roomNumber:string)=>{
    roomNumber = _roomNumber;

    


});


export = {}