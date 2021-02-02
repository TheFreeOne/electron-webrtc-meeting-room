import { ipcRenderer, desktopCapturer } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
import AudioMeeting from './audioMeeting';
import VideoMeeting from './vidioMeeting';
import ScreenMeeting from './screenMeeting';
import BoardMeeting from './boardMeeting';
import StreamToWebRTC from "./StreamToWebRTC";

var roomNumber: string;
var audioMeeting :AudioMeeting;
var videoMeeting: VideoMeeting;
var screenMeeting: ScreenMeeting;
var boardMeeting: BoardMeeting;
var streamToWebRTC: StreamToWebRTC;
let config = require('../../config.json');
(window as any).config = config;

let script = `<script src="${config.nodeRoomServer}/socket.io/socket.io.js"></script>`
$(document.body).append(script);

ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string) => {
  roomNumber = _roomNumber;
  audioMeeting = new AudioMeeting();
  audioMeeting.run();
  videoMeeting = new VideoMeeting();
  screenMeeting = new ScreenMeeting();
  boardMeeting = new BoardMeeting();
  streamToWebRTC = new StreamToWebRTC(_roomNumber);
  (window as any).streamToWebRTC = streamToWebRTC;

  $('.maikefeng').on('click',()=>{
    audioMeeting.run();
  });

  $('.shexiangtou').on('click',()=>{
    videoMeeting.run();
  });

  $('.pingmugongxiang').on('click',()=>{
    screenMeeting.run();
  });

  $('.baibanwhiteboard10').on('click',()=>{
    boardMeeting.run();
  });

});

export = {}
