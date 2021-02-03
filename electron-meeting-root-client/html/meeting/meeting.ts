import { ipcRenderer, desktopCapturer } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
import AudioMeeting from './audioMeeting';
import VideoMeeting from './vidioMeeting';
import ScreenMeeting from './screenMeeting';
import BoardMeeting from './boardMeeting';
import StreamToWebRTC from "./StreamToWebRTC";
import toastr = require('toastr');

console.log(toastr);

toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": true,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
};
(window as any).toastr = toastr;

var roomNumber: string;
var nickname: string;
var actionType: string;
var audioMeeting: AudioMeeting;
var videoMeeting: VideoMeeting;
var screenMeeting: ScreenMeeting;
var boardMeeting: BoardMeeting;
var streamToWebRTC: StreamToWebRTC;
var config = require('../../config.json');
(window as any).config = config;
var audioStream;


ipcRenderer.once(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string, _actionType) => {

  nickname = ipcRenderer.sendSync(ChannelConstant.GET_NICKNAME);

  roomNumber = _roomNumber;
  document.title = '会议室--' + roomNumber
  actionType = _actionType;
  audioMeeting = new AudioMeeting();
  audioStream = await audioMeeting.run();
  videoMeeting = new VideoMeeting();
  screenMeeting = new ScreenMeeting();
  boardMeeting = new BoardMeeting();

  $(function () {
    streamToWebRTC = new StreamToWebRTC(_roomNumber);
    (window as any).streamToWebRTC = streamToWebRTC;
    if(audioStream){
      streamToWebRTC.run(audioStream);
    }
  });


  $('.maikefeng').off().on('click', () => {
    audioMeeting.run();
  });

  $('.shexiangtou').off().on('click', () => {
    videoMeeting.run();
  });

  $('.pingmugongxiang').off().on('click', () => {
    screenMeeting.run();
  });

  $('.baibanwhiteboard10').off().on('click', () => {
    boardMeeting.run();
  });

  $('.permissionQuery').off().on('click', () => {
    // @ts-ignore
    navigator.permissions.query(
      { name: 'camera' }
      //{ name: 'microphone' }
      // { name: 'geolocation' }
      // { name: 'notifications' }
      // { name: 'midi', sysex: false }
      // { name: 'midi', sysex: true }
      // { name: 'push', userVisibleOnly: true }
    ).then(function (permissionStatus) {
      console.log(permissionStatus.state); // granted, denied, prompt
      toastr.info('相机权限'+permissionStatus.state);
    });
    // @ts-ignore
    navigator.permissions.query(
      // { name: 'camera' }
      { name: 'microphone' }
      // { name: 'geolocation' }
      // { name: 'notifications' }
      // { name: 'midi', sysex: false }
      // { name: 'midi', sysex: true }
      // { name: 'push', userVisibleOnly: true }
    ).then(function (permissionStatus) {
      console.log(permissionStatus.state); // granted, denied, prompt
      toastr.info('麦克风权限'+permissionStatus.state);
    });



  });

});

export = {}
