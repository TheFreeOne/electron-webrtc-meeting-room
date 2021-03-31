"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const ChannelConstant_1 = require("../../../util/ChannelConstant");
class StreamToWebRTC {
    run(_localStream) {
        window.localStream = _localStream;
        // document.getElementById('callBtn').onclick = () => {
        //     socket.emit('create or join', roomInput.value);
        //     roomNumber = roomInput.value;
        // }
        console.log('create or join');
        window.socket.emit('create or join', { room: window.roomNumber, nickname: window.nickname });
    }
    constructor(number) {
        // 此处使用(window as any)是为了避免无法调用相关变量
        // 房间号
        window.roomNumber = number;
        let rtcPcArray = window.rtcPcArray;
        // soket.io创建的socket
        window.socket = null;
        let personVideoItem = document.createElement('div');
        personVideoItem.setAttribute('class', 'person-video-item');
        let screenVideo = document.createElement("video");
        screenVideo.setAttribute('class', 'screen-video');
        let cameraVideo = document.createElement("video");
        cameraVideo.setAttribute('class', 'camera-video');
        personVideoItem.appendChild(screenVideo);
        personVideoItem.appendChild(cameraVideo);
        let personInfo = document.createElement('div');
        personInfo.setAttribute('class', 'person-info');
        let personName = document.createElement('span');
        let personStatus = document.createElement('span');
        personStatus.innerHTML = '发言中...';
        personInfo.appendChild(personName);
        personInfo.appendChild(personStatus);
        personVideoItem.appendChild(personInfo);
        let config = require('../../../config.json');
        // 打洞服务器的相关配置，局域网或者是单机环境下，这个配置不会生效
        const iceServers = {
            iceServers: [
                { urls: config.sturnserver },
                { urls: config.turnserver, username: config.turnusername, credential: config.turncredential }
            ]
        };
        window.iceServers = iceServers;
        // 链接房间服务器
        //@ts-ignore
        const _socket = io(window.config.nodeRoomServer, { path: '/socket.io' });
        window.socket = _socket;
        // 收到created，说明房间已经创建好了
        window.socket.on('created', data => {
            console.log('created');
            console.log(data);
            window.socketId = data.socketId;
            window.personInRoom = data.personInRoom;
            console.log(`${data.room} 房间已经创建完成`);
        });
        // 收到joined，说明成功加入一个房间
        window.socket.on('joined', data => {
            console.log('joined');
            console.log(data);
            window.socketId = data.socketId;
            window.personInRoom = data.personInRoom;
            console.log(`${data.room}房间加入成功`);
            // 被动的一方/收到邀请的一方向服务器发送消息，说明客人已经准备好进行通讯
            window.socket.emit('ready', { room: window.roomNumber, fromNickName: window.nickname });
        });
        // 房间已经满
        window.socket.on('full', room => {
            window.toastr.info('加入失败，房间已满');
            require('electron').remote.dialog.showMessageBoxSync({ type: 'info', message: '房间已满', title: '提示' });
            window.close();
        });
        // 房间创建者/发起方/主人  收到已经准备好的消息，
        window.socket.on('ready', (data) => {
            console.log('this');
            console.log(this);
            console.log(`对方准备完成`);
            this.olderCreateRTCPeerConnection(data.fromSocketId, data.fromNickName);
        });
        // 收到邀请的一方收到offer
        window.socket.on('offer', (event) => {
            console.log(` socket.on('offer'`);
            this.newerCreateRTCPeerConnection(event.fromSocketId, event.fromNickName, event);
        });
        window.socket.on('answer', (event) => {
            console.log(`socket.on('answer'`);
            console.log(event);
            try {
                // console.log('answered done');
                let rtcPcMap = window.rtcPcMap;
                let rtcPeerConnection = rtcPcMap.get(event.fromSocketId);
                rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
            }
            catch (error) {
                console.log(`rtcPcMap`, window.rtcPcMap);
                console.log(`event.fromSocketId`, event.fromSocketId);
            }
        });
        window.socket.on('candidate', event => {
            try {
                let rtcPcMap = window.rtcPcMap;
                let rtcPeerConnection = rtcPcMap.get(event.fromSocketId);
                // console.log(`socket.on('candidate'`);
                // console.log('am her for Ice', event);
                const candidate = new RTCIceCandidate({
                    sdpMLineIndex: event.label,
                    candidate: event.candidate
                });
                rtcPeerConnection.addIceCandidate(candidate);
            }
            catch (error) {
                console.error(window.rtcPcMap);
                console.error(`event.fromSocketId`, event.fromSocketId);
            }
        });
        window.socket.on('out of room', (event) => {
            window.toastr.info(event.nickname + '离开了会议');
            let fromSocketId = event.fromSocketId;
            try {
                let rtcPcMap = window.rtcPcMap;
                let rtcPeerConnection = rtcPcMap.get(fromSocketId);
                rtcPeerConnection.close();
                rtcPeerConnection = null;
                rtcPcMap.delete(fromSocketId);
            }
            catch (error) {
                console.error(error);
            }
            console.log(`${fromSocketId} out of room`);
            $(`#${fromSocketId}`).remove();
        });
        // 页面关闭之后
        window.onunload = function windowClose() {
            if (window.socket) {
                window.socket.emit('out of room', {
                    room: window.roomNumber,
                    nickname: window.nickname
                });
            }
        };
    }
    olderCreateRTCPeerConnection(fromSocketId, fromNickName) {
        let rtcPcMap = window.rtcPcMap;
        let personVideoItem = document.createElement('div');
        personVideoItem.setAttribute('class', 'person-video-item');
        personVideoItem.setAttribute('id', fromSocketId);
        let audio = document.createElement("audio");
        let screenVideo = document.createElement("video");
        screenVideo.setAttribute('class', 'screen-video');
        let cameraVideo = document.createElement("video");
        cameraVideo.setAttribute('class', 'camera-video');
        personVideoItem.appendChild(audio);
        personVideoItem.appendChild(screenVideo);
        personVideoItem.appendChild(cameraVideo);
        let personInfo = document.createElement('div');
        personInfo.setAttribute('class', 'person-info');
        let personName = document.createElement('span');
        let personStatus = document.createElement('span');
        personName.innerHTML = fromNickName + '：';
        personStatus.innerHTML = '发言中...';
        personInfo.appendChild(personName);
        personInfo.appendChild(personStatus);
        personVideoItem.appendChild(personInfo);
        personVideoItem.ondblclick = () => {
            if (personVideoItem.style.position != 'absolute') {
                personVideoItem.style.position = 'absolute';
                personVideoItem.style.zIndex = '99';
            }
            else {
                personVideoItem.style.position = 'relative';
                personVideoItem.style.zIndex = '1';
            }
        };
        // 创建rtcPeerConnection用于音视频相关的传输
        // @ts-ignore
        let rtcPeerConnection = new RTCPeerConnection(window.iceServers, { 'optional': [{ 'DtlsSrtpKeyAgreement': true }, { 'RtpDataChannels': true }] });
        rtcPcMap.set(fromSocketId, rtcPeerConnection);
        document.getElementById('main-video-content').appendChild(personVideoItem);
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/onicecandidate
        // 只要本地代理ICE 需要通过信令服务器传递信息给其他对等端时就会触发
        rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
            if (event.candidate) {
                // console.log('sending ice candidate', event.candidate);
                window.socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: window.roomNumber,
                    toSocketId: fromSocketId
                });
            }
        };
        //@ts-ignore
        let dataChannel = rtcPeerConnection.createDataChannel(window.roomNumber, { reliable: false });
        console.log('createDataChannel');
        dataChannel.onopen = function (event) {
            console.log('dataChannel open');
        };
        dataChannel.onmessage = event => {
            console.log('dataChannel onmessage', event.data);
        };
        dataChannel.onclose = function () { console.log("dataChannel closed! "); };
        dataChannel.onerror = function () { console.log("dataChannel ERROR!!!"); };
        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);
            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                electron_1.ipcRenderer.send(ChannelConstant_1.default.RTCPEERCONNECTION_DISCONNECTED);
            }
        };
        rtcPeerConnection.ondatachannel = function (ev) {
            ev.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
            ev.channel.onmessage = function (e) {
                console.log("DC from  :" + e.data);
            };
        };
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/ontrack
        let _audioStream = new MediaStream();
        let _cameraStream = new MediaStream();
        let _sreenStream = new MediaStream();
        rtcPeerConnection.ontrack = function onAddStream(event) {
            console.log('rtcPeerConnection get stream ');
            let stream = event.streams[0];
            let cameraTrack = stream.getVideoTracks()[0];
            let desktopTrack = stream.getVideoTracks()[1];
            try {
                _audioStream.addTrack(stream.getAudioTracks()[0]);
            }
            catch (e) {
            }
            ;
            _cameraStream.addTrack(cameraTrack);
            _sreenStream.addTrack(desktopTrack);
            audio.srcObject = _audioStream;
            cameraVideo.srcObject = _cameraStream;
            screenVideo.srcObject = _sreenStream;
            try {
                audio.play();
            }
            catch (error) {
                console.error(error);
            }
            try {
                cameraVideo.play();
            }
            catch (error) {
                console.error(error);
            }
            try {
                screenVideo.play();
            }
            catch (error) {
                console.error(error);
            }
            setInterval(() => {
                let cameraValid = cameraTrack.getSettings().width != 2;
                let desktopValid = desktopTrack.getSettings().width != 2;
                if (cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '25%';
                    cameraVideo.style.height = '25%';
                }
                else if (cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '100%';
                    cameraVideo.style.height = '100%';
                }
                else if (!cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }
                else if (!cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }
                try {
                    screenVideo.play();
                }
                catch (error) {
                }
                try {
                    cameraVideo.play();
                }
                catch (error) {
                }
            }, 1000);
        };
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/addTrack
        // rtcPeerConnection
        let mediaStreamTrackArray = window.localStream.getTracks();
        console.log('rtcPeerConnection 正在添加 addTrack', mediaStreamTrackArray);
        mediaStreamTrackArray.forEach(mediaStreamTrack => {
            rtcPeerConnection.addTrack(mediaStreamTrack, window.localStream);
        });
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/createOffer
        // RTCPeerConnection接口的createOffer（）方法启动创建一个SDP offer，目的是启动一个新的WebRTC去连接远程端点。
        // SDP offer包含有关已附加到WebRTC会话，浏览器支持的编解码器和选项的所有MediaStreamTracks信息，以及ICE 代理，目的是通过信令信道发送给潜在远程端点，以请求连接或更新现有连接的配置。
        // 返回值是一个Promise，创建 offer 后，将使用包含新创建的要约的RTCSessionDescription对象来解析该返回值。
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription);
            window.socket.emit('offer', {
                type: 'offer',
                sdp: sessionDescription,
                room: window.roomNumber,
                toSocketId: fromSocketId,
                fromNickName: window.nickname
            });
        })
            .catch(err => {
            console.error('error here');
        });
        // @ts-ignore
    }
    newerCreateRTCPeerConnection(fromSocketId, fromNickName, event) {
        console.warn('newerCreateRTCPeerConnection');
        console.log('this');
        console.log(this);
        let rtcPcMap = window.rtcPcMap;
        let personVideoItem = document.createElement('div');
        personVideoItem.setAttribute('class', 'person-video-item');
        personVideoItem.setAttribute('id', fromSocketId);
        let audio = document.createElement("audio");
        let screenVideo = document.createElement("video");
        screenVideo.setAttribute('class', 'screen-video');
        let cameraVideo = document.createElement("video");
        cameraVideo.setAttribute('class', 'camera-video');
        personVideoItem.appendChild(audio);
        personVideoItem.appendChild(screenVideo);
        personVideoItem.appendChild(cameraVideo);
        let personInfo = document.createElement('div');
        personInfo.setAttribute('class', 'person-info');
        let personName = document.createElement('span');
        let personStatus = document.createElement('span');
        personName.innerHTML = fromNickName + '：';
        personStatus.innerHTML = '发言中...';
        personInfo.appendChild(personName);
        personInfo.appendChild(personStatus);
        personVideoItem.appendChild(personInfo);
        personVideoItem.ondblclick = () => {
            if (personVideoItem.style.position != 'absolute') {
                personVideoItem.style.position = 'absolute';
                personVideoItem.style.zIndex = '99';
                personVideoItem.style.width = '100%';
                personVideoItem.style.height = '100%';
            }
            else {
                personVideoItem.style.position = 'relative';
                personVideoItem.style.zIndex = '1';
                personVideoItem.style.width = 'auto';
                personVideoItem.style.height = 'auto';
            }
        };
        // @ts-ignore
        let rtcPeerConnection = new RTCPeerConnection(window.iceServers, { optional: [{ RtpDataChannels: true }] });
        rtcPcMap.set(fromSocketId, rtcPeerConnection);
        document.getElementById('main-video-content').appendChild(personVideoItem);
        rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
            if (event.candidate) {
                // console.log('sending ice candidate', event.candidate);
                window.socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: window.roomNumber,
                    toSocketId: fromSocketId
                });
            }
        };
        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);
            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                electron_1.ipcRenderer.send(ChannelConstant_1.default.RTCPEERCONNECTION_DISCONNECTED);
            }
        };
        //@ts-ignore
        let dataChannel = rtcPeerConnection.createDataChannel(window.roomNumber, { reliable: false });
        console.log('createDataChannel');
        dataChannel.onopen = function (event) {
            console.log('dataChannel open');
        };
        dataChannel.onmessage = event => {
            console.log('dataChannel onmessage', event.data);
        };
        dataChannel.onclose = function () { console.log("dataChannel closed! "); };
        dataChannel.onerror = function () { console.log("dataChannel ERROR!!!"); };
        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);
            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                electron_1.ipcRenderer.send(ChannelConstant_1.default.RTCPEERCONNECTION_DISCONNECTED);
            }
        };
        rtcPeerConnection.ondatachannel = function (ev) {
            ev.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
            ev.channel.onmessage = function (e) {
                console.log("DC from  :" + e.data);
            };
        };
        let _audioStream = new MediaStream();
        let _cameraStream = new MediaStream();
        let _sreenStream = new MediaStream();
        rtcPeerConnection.ontrack = function onAddStream(event) {
            // console.log('rtcPeerConnection.ontrack');
            console.log(event);
            let stream = event.streams[0];
            let cameraTrack = stream.getVideoTracks()[0];
            let desktopTrack = stream.getVideoTracks()[1];
            try {
                _audioStream.addTrack(stream.getAudioTracks()[0]);
            }
            catch (e) {
            }
            ;
            _cameraStream.addTrack(cameraTrack);
            _sreenStream.addTrack(desktopTrack);
            audio.srcObject = _audioStream;
            cameraVideo.srcObject = _cameraStream;
            screenVideo.srcObject = _sreenStream;
            try {
                audio.play();
            }
            catch (error) {
                console.error(error);
            }
            try {
                cameraVideo.play();
            }
            catch (error) {
                console.error(error);
            }
            try {
                screenVideo.play();
            }
            catch (error) {
                console.error(error);
            }
            setInterval(() => {
                let cameraValid = cameraTrack.getSettings().width != 2;
                let desktopValid = desktopTrack.getSettings().width != 2;
                if (cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '25%';
                    cameraVideo.style.height = '25%';
                }
                else if (cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '100%';
                    cameraVideo.style.height = '100%';
                }
                else if (!cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }
                else if (!cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }
                try {
                    screenVideo.play();
                }
                catch (error) {
                }
                try {
                    cameraVideo.play();
                }
                catch (error) {
                }
            }, 1000);
        };
        let mediaStreamTrackArray = window.localStream.getTracks();
        console.log('rtcPeerConnection 正在添加 addTrack', mediaStreamTrackArray);
        mediaStreamTrackArray.forEach(mediaStreamTrack => {
            rtcPeerConnection.addTrack(mediaStreamTrack, window.localStream);
        });
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription);
            window.socket.emit('answer', {
                type: 'answer',
                sdp: sessionDescription,
                room: window.roomNumber,
                toSocketId: fromSocketId
            });
        })
            .catch(err => {
            console.error(err);
        });
    }
}
exports.default = StreamToWebRTC;
//# sourceMappingURL=StreamToWebRTC.js.map