import { ipcRenderer } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
// import AudioMeeting from './audioMeeting'
var roomNumber:string;
// var audioMeeting :AudioMeeting;

  function audioRun() {
    // @ts-ignore
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    // 屏幕画面&系统声音
    // @ts-ignore
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(desktopStream=>{
        console.log('desktopStream');
        console.log(desktopStream);
        
    }).catch(desktopError=>{
        console.log('desktopError');
        console.log(desktopError);
    });
    // 麦克风声音
     navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(voiceStream =>{
        console.log('voiceStream');
        console.log(voiceStream);
        
        
    }).catch(voiceError =>{
        console.log('voiceError');
        console.log(voiceError);
    });
    
    
}

ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS,async (event,_roomNumber:string)=>{
    roomNumber = _roomNumber;
    // audioMeeting = new AudioMeeting();

      audioRun() 
 
});
    

export = {}