import { ipcRenderer, desktopCapturer, clipboard } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../util/ChannelConstant';
import AudioMeeting from './audioMeeting';
import VideoMeeting from './videoMeeting';
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

var rtcPeerConnection: RTCPeerConnection;

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
var audioStream: MediaStream;
var videoStream: MediaStream;
var localStream: MediaStream;
var streamType: string = 'audio';
var leftVideo = document.getElementById('left-video');
var leftCameraVideo = document.getElementById('left-camera-video');
// @ts-ignore
leftCameraVideo.onloadedmetadata = (e) => leftCameraVideo.play();
ipcRenderer.once(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber: string, _actionType) => {

    nickname = ipcRenderer.sendSync(ChannelConstant.GET_NICKNAME);

    roomNumber = _roomNumber;
    document.title = '会议室--' + roomNumber
    actionType = _actionType;
    audioMeeting = new AudioMeeting();

    videoMeeting = new VideoMeeting();
    screenMeeting = new ScreenMeeting();
    boardMeeting = new BoardMeeting();

    $(async function () {

        // 获取所有设备
        await renderInputDevice();

        layui.form.render();
        try {
            audioStream = await audioMeeting.getMicrophoneStream();

            disabledTrack = audioStream.getVideoTracks()[0].clone();
        } catch (error) {
            toastr.info('无法获取麦克风，切换为系统声音');
            audioStream = await audioMeeting.getSystemStream();
        }
        localStream = audioStream.clone();
        streamToWebRTC = new StreamToWebRTC(_roomNumber);
        (window as any).streamToWebRTC = streamToWebRTC;
        if (audioStream) {
            streamToWebRTC.run(audioStream);
        }
    });
    // 监听音频切换
    layui.form.on('select(voice-select)', async (data) => {
        if (data.value == 'default') {
            audioStream = await audioMeeting.getSystemStream() as MediaStream;
        } else {
            audioStream = await audioMeeting.getMicrophoneStream();

        }
        localStream.getAudioTracks()[0] = audioStream.getAudioTracks()[0];
        if (rtcPeerConnection) {
            let sender = rtcPeerConnection.getSenders().find(s => {
                return s.track.kind == 'audio';
            });
            if (sender) {
                sender.replaceTrack(audioStream.getAudioTracks()[0]);
            }
        }

    });
    // 监听摄像头
    layui.form.on('select(video-select)', async (data) => {
        // 关闭
        if (data.value == 'close') {
            if (rtcPeerConnection) {
                let sender = rtcPeerConnection.getSenders().find(s => {
                    return s.track.kind == disabledTrack.kind;
                });
                if (sender) {
                    sender.replaceTrack(disabledTrack.clone());
                }
            }

            // @ts-ignore
            leftCameraVideo.scrObject = new MediaStream([disabledTrack]);
            localStream.getVideoTracks()[0] = disabledTrack;
        } else {
            videoStream = await videoMeeting.getStream();
            if (rtcPeerConnection) {
                let sender = rtcPeerConnection.getSenders()[1];
                if (sender) {
                    sender.replaceTrack(videoStream.getVideoTracks()[0]);
                }
            }
            console.log(videoStream);

            // @ts-ignore
            leftCameraVideo.scrObject = videoStream;
            // @ts-ignore
            leftCameraVideo.play();
            // @ts-ignore
            cameraVideo.scrObject = videoStream;
            localStream.getVideoTracks()[0] = videoStream.getVideoTracks()[0];

        }
        renderLocalVideoElement();
    });


    // 屏幕共享
    layui.form.on('select(screen-select)', async (data) => {
        if (data.value == 'close') {
            if (rtcPeerConnection) {
                let sender = ((window as any).rtcPeerConnection as RTCPeerConnection).getSenders()[2];
                if (sender) {
                    await sender.replaceTrack(disabledTrack.clone());
                }
            }

        } else {


            screenMeeting.run();
        }
        renderLocalVideoElement();
    });



    $('.baibanwhiteboard10').off().on('click', async () => {
        streamType = 'board';
        let boardStream = await boardMeeting.run();
        let rtcPeerConnection = (window as any).rtcPeerConnection as RTCPeerConnection;
        if(rtcPeerConnection){
            let sender2 = rtcPeerConnection.getSenders()[2];
            sender2.replaceTrack(boardStream.getVideoTracks()[0]);
        }


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

function renderLocalVideoElement() {
    let screenValid = $('#screen-select').val() != 'close';
    let videoValid = $('#video-select').val() != 'close';
    if (!screenValid && !videoValid) {
        leftVideo.style.width = '0%';
        leftVideo.style.height = '0%';
        leftCameraVideo.style.width = '0%';
        leftCameraVideo.style.height = '0%';
    } else if (screenValid && videoValid) {
        leftVideo.style.width = '100%';
        leftVideo.style.height = '100%';
        leftCameraVideo.style.width = '25%';
        leftCameraVideo.style.height = '25%';
        // @ts-ignore
        leftVideo.play();
        // @ts-ignore
        leftCameraVideo.play();
    } else if (screenValid && !videoValid) {
        leftVideo.style.width = '100%';
        leftVideo.style.height = '100%';
        leftCameraVideo.style.width = '0%';
        leftCameraVideo.style.height = '0%';
        // @ts-ignore
        leftVideo.play();
    } else if (!screenValid && videoValid) {
        leftVideo.style.width = '0%';
        leftVideo.style.height = '0%';
        leftCameraVideo.style.width = '100%';
        leftCameraVideo.style.height = '100%';
        // @ts-ignore
        leftCameraVideo.play();
    }
}


async function renderInputDevice() {
    let deviceArray = await navigator.mediaDevices.enumerateDevices();
    let videoInputDeviceArray: MediaDeviceInfo[] = [];
    deviceArray.forEach(item => {
        if (item.kind == 'audioinput' && item.deviceId != 'default' && item.deviceId != 'communications') {

            $('#voice-select').append(`<option value="${item.groupId}" groupid="${item.groupId}" deviceid="${item.deviceId}" selected="selected">${item.label}</option>`);
        } else if (item.kind == 'videoinput') {
            videoInputDeviceArray.push(item);
        }
    });

    if (videoInputDeviceArray.length > 0) {
        $('select[id=video-select]').empty();
        $('select[id=video-select]').append(`<option value="close">关闭</option>`);
        videoInputDeviceArray.forEach((videoInputDeviceItem) => {
            $('select[id=video-select]').append(`<option value="${videoInputDeviceItem.deviceId}" groupid="${videoInputDeviceItem.groupId}" deviceid="${videoInputDeviceItem.deviceId}"  >${videoInputDeviceItem.label}</option>`);
        });
    }


    layui.form.render();
}

export = {}
