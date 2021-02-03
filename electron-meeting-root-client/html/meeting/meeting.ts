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


var roomNumber: string;
var nickname:string;
var actionType: string;
var audioMeeting: AudioMeeting;
var videoMeeting: VideoMeeting;
var screenMeeting: ScreenMeeting;
var boardMeeting: BoardMeeting;
var streamToWebRTC: StreamToWebRTC;
var config = require('../../config.json');
(window as any).config = config;



ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string, _actionType) => {

  nickname = ipcRenderer.sendSync(ChannelConstant.GET_NICKNAME);

  roomNumber = _roomNumber;
  document.title = '会议室--' + roomNumber
  actionType = _actionType;
  audioMeeting = new AudioMeeting();
  audioMeeting.run();
  videoMeeting = new VideoMeeting();
  screenMeeting = new ScreenMeeting();
  boardMeeting = new BoardMeeting();

  $(function () {
    streamToWebRTC = new StreamToWebRTC(_roomNumber);
    (window as any).streamToWebRTC = streamToWebRTC;
  });


  $('.maikefeng').on('click', () => {
    audioMeeting.run();
  });

  $('.shexiangtou').on('click', () => {
    videoMeeting.run();
  });

  $('.pingmugongxiang').on('click', () => {
    screenMeeting.run();
  });

  $('.baibanwhiteboard10').on('click', () => {
    boardMeeting.run();
  });

});

export = {}
