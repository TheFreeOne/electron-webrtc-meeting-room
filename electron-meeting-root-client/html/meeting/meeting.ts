import { ipcRenderer, desktopCapturer } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
import AudioMeeting from './audioMeeting'
var roomNumber: string;
var audioMeeting :AudioMeeting;



ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string) => {
  roomNumber = _roomNumber;
  audioMeeting = new AudioMeeting();
  audioMeeting.run();
 

});



// function audioRun() {
//   // @ts-ignore
  // navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  // // 屏幕画面&系统声音
  // // @ts-ignore
  // navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }).then(desktopStream => {
  //   console.log('desktopStream');
  //   console.log(desktopStream);

  // }).catch(desktopError => {
  //   console.log('desktopError');
  //   console.log(desktopError);
  // });
  // // 麦克风声音
  // navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(voiceStream => {
  //   console.log('voiceStream');
  //   console.log(voiceStream);


  // }).catch(voiceError => {
  //   console.log('voiceError');
  //   console.log(voiceError);
  // });

//   desktopCapturer.getSources({ types: [  'screen'] }).then(async sources => {
//     console.log(sources);

     
//     (window as any).desktopCapturer = desktopCapturer 

//     //screen:0:0
//     for (const source of sources) {
//       if (source.id === 'screen:0:0') {
//         try {
//           const desktopStream = await navigator.mediaDevices.getUserMedia({
//             audio: true,
//             video: {
//               //@ts-ignore
//               mandatory: {
//                 chromeMediaSource: 'desktop',
//                 chromeMediaSourceId: 'screen:0:0',
//                 minWidth: 1280,
//                 maxWidth: 1280,
//                 minHeight: 720,
//                 maxHeight: 720
//               }
//             }
//           }).catch(deskTopError =>{
//             console.error(deskTopError);
//           });

//           (window as any).desktopStream = desktopStream;
           
//         } catch (e) {
           
//         }
//         return
//       }
//     }

//   });


// }

export = {}