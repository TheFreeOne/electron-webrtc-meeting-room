import { ipcRenderer, desktopCapturer, clipboard } from 'electron';
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
// 房间号
var roomNumber: string;
// 昵称
var nickname: string;
// 创建会议还是加入会议
var actionType: string;
var audioMeeting: AudioMeeting;
var videoMeeting: VideoMeeting;
var screenMeeting: ScreenMeeting;
var boardMeeting: BoardMeeting;
var streamToWebRTC: StreamToWebRTC;
var disabledTrack: MediaStreamTrack = null;
var config = require('../../config.json');
(window as any).config = config;
var audioStream;
var videoStream;
var streamType: string = 'audio';
var leftVideo = document.getElementById('left-video');
var leftCameraVideo = document.getElementById('left-camera-video');

ipcRenderer.once(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string, _actionType) => {

    nickname = ipcRenderer.sendSync(ChannelConstant.GET_NICKNAME);

    roomNumber = _roomNumber;
    document.title = '会议室--' + roomNumber
    actionType = _actionType;
    audioMeeting = new AudioMeeting();
    audioStream = await audioMeeting.getStream();
    videoMeeting = new VideoMeeting();
    screenMeeting = new ScreenMeeting();
    boardMeeting = new BoardMeeting();

    $(function () {
        streamToWebRTC = new StreamToWebRTC(_roomNumber);
        (window as any).streamToWebRTC = streamToWebRTC;
        if (audioStream) {
            disabledTrack = (audioStream as MediaStream).getVideoTracks()[0].clone();
            streamToWebRTC.run(audioStream);
        }
    });


    $('.maikefeng').off().on('click', async () => {
        streamType = 'audio';
        audioStream = await audioMeeting.getStream();
        let videoTrack = audioStream.getVideoTracks()[0];
        // 此处获取的视频轨道时黑屏的
        var sender = (window as any).rtcPeerConnection.getSenders().find(function (s) {
            return s.track.kind == videoTrack.kind;
        });

        if (sender) {

            try {
                let trackReplacedPromise = await sender.replaceTrack(videoTrack);
                toastr.info('切换成只播放音轨');
            } catch (error) {
                console.error(error);
            }
        }
    });
    // 摄像头
    $('.shexiangtou').off().on('click', async () => {
        streamType = 'video';
        videoStream = await videoMeeting.run() as MediaStream;
        var sender = ((window as any).rtcPeerConnection as RTCPeerConnection).getSenders()[1];
        if($('.shexiangtou').hasClass('layui-btn-disabled')){
           
            if (sender) {
                console.log('sender 替换 视频轨道');
    
                let trackReplacedPromise = await sender.replaceTrack((videoStream as MediaStream).getVideoTracks()[0]);
                // @ts-ignore
                leftCameraVideo.srcObject = videoStream;
    
                $('.shexiangtou').removeClass('layui-btn-disabled');

                if($('.pingmugongxiang').hasClass('layui-btn-disabled')){
                    leftCameraVideo.style.width = '100%';
                    leftCameraVideo.style.height = '100%';
                    leftVideo.style.width = '0%';
                    leftVideo.style.height = '0%';

                }else{
                    leftCameraVideo.style.width = '25%';
                    leftCameraVideo.style.height = '25%';
                    leftVideo.style.width = '100%';
                    leftVideo.style.height = '100%';
                }
                try {
                    // @ts-ignore
                    leftCameraVideo.play();
                } catch (error) {
                    
                }
            } else {
                (window as any).toastr.error('无法获取Sender');
            }
        }else{
            
            console.log('sender 替换 视频轨道');
    
            let trackReplacedPromise = await sender.replaceTrack(disabledTrack.clone());
            let disabledVideoStream = new MediaStream();
            disabledVideoStream.addTrack(disabledTrack.clone());
            //@ts-ignore
            leftCameraVideo.srcObject = disabledVideoStream;
            $('.shexiangtou').addClass('layui-btn-disabled');

            if($('.pingmugongxiang').hasClass('layui-btn-disabled')){
                leftCameraVideo.style.width = '0%';
                leftCameraVideo.style.height = '0%';
                leftVideo.style.width = '0%';
                leftVideo.style.height = '0%';

            }else{
                leftCameraVideo.style.width = '0%';
                leftCameraVideo.style.height = '0%';
                leftVideo.style.width = '100%';
                leftVideo.style.height = '100%';
            }
        }
        
    });

    $('.pingmugongxiang').off().on('click', async () => {
       
        // 没有disabled
        if(!$('.pingmugongxiang').hasClass('layui-btn-disabled')){
            var sender = ((window as any).rtcPeerConnection as RTCPeerConnection).getSenders()[2];
            if (sender) {
                console.log('sender 替换 视频轨道');
    
                let trackReplacedPromise = await sender.replaceTrack(disabledTrack.clone());
    
                $('.pingmugongxiang').addClass('layui-btn-disabled')
    
                if($('.shexiangtou').hasClass('layui-btn-disabled')){
                    leftCameraVideo.style.width = '0%';
                    leftCameraVideo.style.height = '0%';
                    leftVideo.style.width = '0%';
                    leftVideo.style.height = '0%';
    
                }else{
                    leftCameraVideo.style.width = '100%';
                    leftCameraVideo.style.height = '100%';
                    leftVideo.style.width = '0%';
                    leftVideo.style.height = '0%';
                }
            } else {
                (window as any).toastr.error('无法获取Sender');
            }
        }else{
            streamType = 'screen';
            screenMeeting.run();
        }
        
    });

    $('.baibanwhiteboard10').off().on('click', async () => {
        streamType = 'board';
        let boardStream = await boardMeeting.run();
        let rtcPeerConnection = (window as any).rtcPeerConnection as RTCPeerConnection;
        let sender2 = rtcPeerConnection.getSenders()[2];
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
            toastr.info('相机权限' + permissionStatus.state);
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
            toastr.info('麦克风权限' + permissionStatus.state);
        });



    });

    $('.copy-room-number').off().on('click', () => {
        clipboard.writeText(roomNumber, 'clipboard');
        layui.layer.msg('复制房间号成功');
    });

});

export = {}
