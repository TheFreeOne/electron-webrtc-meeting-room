import { ipcRenderer, desktopCapturer, clipboard, ipcMain } from 'electron';
import $ = require('jquery');
import ChannelConstant from '../../../util/ChannelConstant';
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
var disabledVideoTrack: MediaStreamTrack = null;
var config = require('../../../config.json');
(window as any).config = config;
var audioStream: MediaStream;
var videoStream: MediaStream;
var localStream: MediaStream;
var streamType: string = 'audio';

var myScreenVideo = $('#persion-me .screen-video')[0];
var myCameraVideo = $('#persion-me .camera-video')[0];
var socketId: string;
var personInRoom: Array<string>;
var windowId;
var rtcPcMap = new Map<string,RTCPeerConnection>();
// @ts-ignore

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
            disabledVideoTrack = audioStream.getVideoTracks()[0].clone();
        } catch (error) {
            toastr.info('无法获取麦克风，切换为系统声音');
            audioStream = await audioMeeting.getSystemStream();
            (document.getElementById('voice-select') as any).value = 'default';
            layui.form.render();
        }

        localStream = audioStream.clone();
        streamToWebRTC = new StreamToWebRTC(_roomNumber);
        (window as any).streamToWebRTC = streamToWebRTC;
        if (audioStream) {
            streamToWebRTC.run(audioStream);
            drawAudioWave();
        }

    });
    // 监听音频切换
    layui.form.on('select(voice-select)', async (data) => {
        if (data.value == 'default') {
            audioStream = await audioMeeting.getSystemStream() as MediaStream;
        } else {
            audioStream = await audioMeeting.getMicrophoneStream();
        }
        localStream = new MediaStream([audioStream.getAudioTracks()[0], disabledVideoTrack.clone(), disabledVideoTrack.clone()]);

        for (let rtcPeerConnection of rtcPcMap.values()) {
            if (rtcPeerConnection) {
                let sender = rtcPeerConnection.getSenders().find(s => {
                    return s.track.kind == 'audio';
                });
                if (sender) {
                    sender.replaceTrack(audioStream.getAudioTracks()[0]);
                }
            }
        };



    });
    // 监听摄像头
    layui.form.on('select(video-select)', async (data) => {
        // 关闭
        if (data.value == 'close') {

            for (let rtcPeerConnection of rtcPcMap.values()) {
                if (rtcPeerConnection) {
                    let sender = rtcPeerConnection.getSenders().find(s => {
                        return s.track.kind == disabledVideoTrack.kind;
                    });
                    if (sender) {
                        sender.replaceTrack(disabledVideoTrack.clone());
                        localStream.getVideoTracks()[0] = disabledVideoTrack;
                    }
                }
            };



            // @ts-ignore
            myCameraVideo.srcObject = new MediaStream([disabledVideoTrack]);
            localStream = new MediaStream([localStream.getAudioTracks()[0], disabledVideoTrack.clone(), localStream.getTracks()[2]]);
        } else {
            videoStream = await videoMeeting.getStream();

            for (let rtcPeerConnection of rtcPcMap.values()) {
                if (rtcPeerConnection) {
                    console.log(rtcPeerConnection);

                    let sender = rtcPeerConnection.getSenders()[1];
                    if (sender) {
                        sender.replaceTrack(videoStream.getVideoTracks()[0].clone());
                    }
                }
            };

            console.log(videoStream);
            // @ts-ignore
            myCameraVideo.srcObject = videoStream;
            // @ts-ignore
            try {
                // @ts-ignore
                myCameraVideo.play();
            } catch (error) {
                console.error(error);

            }

            localStream = new MediaStream([localStream.getTracks()[0], videoStream.getVideoTracks()[0], localStream.getTracks()[2]]);

        }

    });


    // 屏幕共享
    layui.form.on('select(screen-select)', async (data) => {
        if (data.value == 'close') {

            for (let rtcPeerConnection of rtcPcMap.values()) {
                if (rtcPeerConnection) {
                    let sender = rtcPeerConnection.getSenders()[2];
                    if (sender) {
                        await sender.replaceTrack(disabledVideoTrack.clone());

                    }
                }
            };
            // @ts-ignore
            myScreenVideo.srcObject = new MediaStream([disabledVideoTrack]);
            localStream = new MediaStream([localStream.getTracks()[0], localStream.getTracks()[1], disabledVideoTrack.clone()]);

        } else {
            screenMeeting.run();
        }

    });



    $('.baibanwhiteboard10').off().on('click', async () => {
        streamType = 'board';
        let boardStream = await boardMeeting.run();
        console.log(boardStream);

        for (let rtcPeerConnection of rtcPcMap.values()) {
            if (rtcPeerConnection) {
                let sender2 = rtcPeerConnection.getSenders()[2];
                sender2.replaceTrack(boardStream.getVideoTracks()[0]);
            }
        };
        // @ts-ignore
        myScreenVideo.srcObject = new MediaStream([boardStream.getVideoTracks()[0]]);
        localStream = new MediaStream([localStream.getTracks()[0], localStream.getTracks()[1], boardStream.getVideoTracks()[0]]);
        try {
            // @ts-ignore
            myScreenVideo.onplay();
        } catch (error) {

        }

    });

    /**
     * 白板
     */
    ipcRenderer.on(ChannelConstant.BOARDWINDOW_CLOSED, () => {
        console.log(ChannelConstant.BOARDWINDOW_CLOSED);

        for (let rtcPeerConnection of rtcPcMap.values()) {
            if (rtcPeerConnection) {
                rtcPeerConnection.getSenders()[2].replaceTrack(disabledVideoTrack.clone());
                $('#screen-select').find('option[value="close"]').first().attr('selected', 'selected');
                layui.form.render();


            }
        };

        localStream = new MediaStream([localStream.getTracks()[0], localStream.getTracks()[1], disabledVideoTrack]);

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

ipcRenderer.once("windowId", (event, _windowId: string) => {

    windowId = _windowId;
});

async function renderLocalVideoElement() {
    // @ts-ignore
    let screenValid = (myScreenVideo.srcObject && myScreenVideo.srcObject.getVideoTracks()[0].readyState != 'ended'&& myScreenVideo.srcObject.getVideoTracks()[0].getSettings().width > 2 ) ||   $('#screen-select').val() != 'close';
    let videoValid = $('#video-select').val() != 'close';
    // console.log(screenValid, videoValid);

    try {
        if (!screenValid && !videoValid) {
            myScreenVideo.style.width = '0%';
            myScreenVideo.style.height = '0%';
            myCameraVideo.style.width = '0%';
            myCameraVideo.style.height = '0%';
        } else if (screenValid && videoValid) {
            myScreenVideo.style.width = '100%';
            myScreenVideo.style.height = '100%';
            myCameraVideo.style.width = '25%';
            myCameraVideo.style.height = '25%';
            // @ts-ignore
            try {
                // @ts-ignore
                myScreenVideo.play();
            } catch (error) {

            }

            try {
                // @ts-ignore
                myCameraVideo.play();
            } catch (error) {

            }
        } else if (screenValid && !videoValid) {
            myScreenVideo.style.width = '100%';
            myScreenVideo.style.height = '100%';
            myCameraVideo.style.width = '0%';
            myCameraVideo.style.height = '0%';
            // @ts-ignore
            try {
                // @ts-ignore
                myScreenVideo.play();
            } catch (error) {

            }
        } else if (!screenValid && videoValid) {
            myScreenVideo.style.width = '0%';
            myScreenVideo.style.height = '0%';
            myCameraVideo.style.width = '100%';
            myCameraVideo.style.height = '100%';
            // @ts-ignore
            try {
                // @ts-ignore
                myCameraVideo.play();
            } catch (error) {

            }
        }
    } catch (error) {

    }
    requestAnimationFrame(renderLocalVideoElement);

}
renderLocalVideoElement();


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

function talkingNowBtnLook() {

    let mainVideo = $('#main-video');
    let cameraVideo = $('#main-video');
    let talkingNowBtn = $('.talking-now-btn');
    setInterval(() => {
        if (mainVideo.width() != 0 || cameraVideo.width()) {
            talkingNowBtn.hide();
        } else {
            talkingNowBtn.show();
        }

    }, 1);


}
talkingNowBtnLook();
/**
 * 画音频的波形图
 */
function drawAudioWave() {
    //part1: 画布
    let canvas = document.getElementById("audio-wave-canvas");
    let context = (canvas as any).getContext("2d");


    let WIDTH = (canvas as any).width;
    let HEIGHT = (canvas as any).height;



    //part3: 分析器
    let audioContext = new AudioContext();//音频内容
    let src = audioContext.createMediaStreamSource(audioStream);
    let analyser = audioContext.createAnalyser();

    src.connect(analyser);
    // analyser.connect(AudCtx.destination);   // 屏蔽之后不会播放声音
    analyser.fftSize = 128;//快速傅里叶变换, 必须为2的N次方

    let bufferLength = analyser.frequencyBinCount;// = fftSize * 0.5

    //part4: 变量
    let barWidth = (WIDTH / bufferLength) - 1;//间隔1px
    let barHeight;

    let dataArray = new Uint8Array(bufferLength);//8位无符号定长数组

    //part5: 动态监听
    function renderFrame() {
        requestAnimationFrame(renderFrame);//方法renderFrame托管到定时器，无限循环调度，频率<16.6ms/次

        // context.fillStyle = "#000";//黑色背景
        context.fillStyle = "gray";//黑色背景
        context.fillRect(0, 0, WIDTH, HEIGHT);//画布拓展全屏,动态调整

        analyser.getByteFrequencyData(dataArray);//获取当前时刻的音频数据

        //part6: 绘画声压条
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            let data = dataArray[i];//int,0~255

            let percentV = data / 255;//纵向比例
            let percentH = i / bufferLength;//横向比例

            barHeight = HEIGHT * percentV;

            //gbk,0~255
            let r = 255 * percentV;//值越大越红
            let g = 255 * percentH;//越靠右越绿
            // let b = 50;
            let b = 128;

            context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            context.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;//间隔1px
        }
    }

    renderFrame();



}


export = {}
