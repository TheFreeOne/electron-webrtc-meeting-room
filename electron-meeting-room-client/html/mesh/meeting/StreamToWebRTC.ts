import { dialog, ipcRenderer } from "electron";
import ChannelConstant from "../../../util/ChannelConstant";
// const { app } = require("@electron/remote");
export default class StreamToWebRTC {



    public run(_localStream: MediaStream) {



        (window as any).localStream = _localStream;
        // document.getElementById('callBtn').onclick = () => {
        //     socket.emit('create or join', roomInput.value);
        //     roomNumber = roomInput.value;
        // }

        console.log('create or join');

        (window as any).socket.emit('create or join', { room: (window as any).roomNumber, nickname: (window as any).nickname });

    }

    constructor(number: string) {

        // 此处使用(window as any)是为了避免无法调用相关变量

        // 房间号
        (window as any).roomNumber = number;

        let rtcPcArray = (window as any).rtcPcArray as Array<RTCPeerConnection>;



        // soket.io创建的socket
        (window as any).socket = null;

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
        (window as any).iceServers = iceServers;

        // 链接房间服务器
        //@ts-ignore
        const _socket = io((window as any).config.nodeRoomServer, { path: '/socket.io' });
        (window as any).socket = _socket;

        // 收到created，说明房间已经创建好了
        (window as any).socket.on('created', (data: { socketId: any; personInRoom: any; room: any; }) => {
            console.log('created');
            console.log(data);
            (window as any).socketId = data.socketId;
            (window as any).personInRoom = data.personInRoom;
            console.log(`${data.room} 房间已经创建完成`);


        });
        // 收到joined，说明成功加入一个房间
        (window as any).socket.on('joined', (data: { socketId: any; personInRoom: any; room: any; }) => {
            console.log('joined');
            console.log(data);
            (window as any).socketId = data.socketId;
            (window as any).personInRoom = data.personInRoom;
            console.log(`${data.room}房间加入成功`);
            // 被动的一方/收到邀请的一方向服务器发送消息，说明客人已经准备好进行通讯
            (window as any).socket.emit('ready', {room:(window as any).roomNumber,fromNickName: (window as any).nickname});
        });
        // 房间已经满
        (window as any).socket.on('full', (room: any) => {
            (window as any).toastr.info('加入失败，房间已满');
            // remote.dialog.showMessageBoxSync({ type: 'info', message: '房间已满', title: '提示' });
            alert('房间已满')
            window.close();
        });

        // 房间创建者/发起方/主人  收到已经准备好的消息，
        (window as any).socket.on('ready', (data:any) => {
            console.log('this');
            console.log(this);
            console.log(`对方准备完成`);

            this.olderCreateRTCPeerConnection(data.fromSocketId,data.fromNickName);

        });

        // 收到邀请的一方收到offer
        (window as any).socket.on('offer',  (event:any) => {
            console.log(` socket.on('offer'`);

            this.newerCreateRTCPeerConnection(  event.fromSocketId,event.fromNickName, event);

        });



        (window as any).socket.on('answer', (event:any) => {

            console.log(`socket.on('answer'`);
            console.log(event);

            try {
                // console.log('answered done');
                let rtcPcMap = (window as any).rtcPcMap as Map<string, RTCPeerConnection>;
                let rtcPeerConnection: RTCPeerConnection = rtcPcMap.get(event.fromSocketId) as RTCPeerConnection;
                rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
            } catch (error) {
                console.log(`rtcPcMap`,(window as any).rtcPcMap);
                console.log(`event.fromSocketId`,event.fromSocketId);

            }
        });

        (window as any).socket.on('candidate', (event:any) => {


            try {
                let rtcPcMap = (window as any).rtcPcMap as Map<string, RTCPeerConnection>;
                let rtcPeerConnection: RTCPeerConnection = rtcPcMap.get(event.fromSocketId) as RTCPeerConnection;
                // console.log(`socket.on('candidate'`);
                // console.log('am her for Ice', event);
                const candidate = new RTCIceCandidate({
                    sdpMLineIndex: event.label,
                    candidate: event.candidate
                });

                rtcPeerConnection.addIceCandidate(candidate);
            } catch (error) {
                console.error((window as any).rtcPcMap);

                console.error(`event.fromSocketId`, event.fromSocketId);

            }
        });

        (window as any).socket.on('out of room', (event:any) => {
            let fromSocketId = event.fromSocketId;
            try {

                let rtcPcMap = (window as any).rtcPcMap as Map<string, RTCPeerConnection>;
                let rtcPeerConnection = rtcPcMap.get(fromSocketId);
                rtcPeerConnection?.close();
                rtcPeerConnection = undefined;
                rtcPcMap.delete(fromSocketId);
            } catch (error) {
                console.error(error);

            }
            console.log(`${fromSocketId} out of room`);
            if($(`#${fromSocketId}`).find('span').first()){
                (window as any).toastr.info($(`#${fromSocketId}`).find('span').first().html() + '离开了会议');
            }
            $(`#${fromSocketId}`).remove();
        });

        // 页面关闭之后
        window.onunload = function windowClose() {
            if ((window as any).socket) {
                (window as any).socket.emit('out of room', {
                    room: (window as any).roomNumber,
                    nickname: (window as any).nickname
                });
            }
        }
    }

    public olderCreateRTCPeerConnection(fromSocketId: string,fromNickName:string): void {
        let rtcPcMap = (window as any).rtcPcMap as Map<string, RTCPeerConnection>;
        let personVideoItem = document.createElement('div');
        personVideoItem.setAttribute('class', 'person-video-item');
        personVideoItem.setAttribute('id',fromSocketId);
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
        personVideoItem.ondblclick = ()=>{
            if(personVideoItem.style.position != 'absolute'){
                personVideoItem.style.position = 'absolute';
                personVideoItem.style.zIndex = '99';
            }else{
                personVideoItem.style.position = 'relative';
                personVideoItem.style.zIndex = '1'
            }

        }
        // 创建rtcPeerConnection用于音视频相关的传输
        // @ts-ignore
        let rtcPeerConnection: RTCPeerConnection = new RTCPeerConnection((window as any).iceServers, { 'optional': [{ 'DtlsSrtpKeyAgreement': true }, { 'RtpDataChannels': true }] });
        rtcPcMap.set(fromSocketId, rtcPeerConnection);
        document.getElementById('main-video-content')?.appendChild(personVideoItem);
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/onicecandidate
        // 只要本地代理ICE 需要通过信令服务器传递信息给其他对等端时就会触发
        rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
            if (event.candidate) {
                // console.log('sending ice candidate', event.candidate);
                (window as any).socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: (window as any).roomNumber,
                    toSocketId: fromSocketId
                })
            }
        };

        //@ts-ignore
        let dataChannel = rtcPeerConnection.createDataChannel((window as any).roomNumber, { reliable: false });
        console.log('createDataChannel');
        dataChannel.onopen = function (event) {
            console.log('dataChannel open');
        };
        dataChannel.onmessage = event => {
            console.log('dataChannel onmessage', event.data);
        }
        dataChannel.onclose = function () { console.log("dataChannel closed! ") };
        dataChannel.onerror = function () { console.log("dataChannel ERROR!!!") };

        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);
            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                ipcRenderer.send(ChannelConstant.RTCPEERCONNECTION_DISCONNECTED);
            }
        };

        rtcPeerConnection.ondatachannel = function (ev) {

            ev.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
            ev.channel.onmessage = function (e) {
                console.log("DC from  :" + e.data);
            }
        };
        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/ontrack
        let _audioStream = new MediaStream();
        let _cameraStream = new MediaStream();
        let _sreenStream = new MediaStream();
        rtcPeerConnection.ontrack = function onAddStream(event: RTCTrackEvent) {
            console.log('rtcPeerConnection get stream ');
            let stream = event.streams[0];
            let cameraTrack = stream.getVideoTracks()[0] as MediaStreamTrack;
            let desktopTrack = stream.getVideoTracks()[1] as MediaStreamTrack;

            try {
                _audioStream.addTrack(stream.getAudioTracks()[0]);
            } catch (e) {

            };
            _cameraStream.addTrack(cameraTrack);
            _sreenStream.addTrack(desktopTrack);

            audio.srcObject = _audioStream;
            cameraVideo.srcObject = _cameraStream;
            screenVideo.srcObject = _sreenStream;


            try {
                audio.play();
            } catch (error) {
                console.error(error);
            }
            try {
                cameraVideo.play();
            } catch (error) {
                console.error(error);
            }

            try {
                screenVideo.play();
            } catch (error) {
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

                } else if (cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '100%';
                    cameraVideo.style.height = '100%';



                } else if (!cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';

                } else if (!cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }

                try {
                    screenVideo.play()
                } catch (error) {

                }

                try {
                    cameraVideo.play()
                } catch (error) {

                }

            }, 1000);
        };

        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/addTrack
        // rtcPeerConnection

        let mediaStreamTrackArray = ((window as any).localStream as MediaStream).getTracks();
        console.log('rtcPeerConnection 正在添加 addTrack', mediaStreamTrackArray);
        mediaStreamTrackArray.forEach(mediaStreamTrack => {
            rtcPeerConnection.addTrack(mediaStreamTrack, (window as any).localStream);
        });


        // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/createOffer
        // RTCPeerConnection接口的createOffer（）方法启动创建一个SDP offer，目的是启动一个新的WebRTC去连接远程端点。
        // SDP offer包含有关已附加到WebRTC会话，浏览器支持的编解码器和选项的所有MediaStreamTracks信息，以及ICE 代理，目的是通过信令信道发送给潜在远程端点，以请求连接或更新现有连接的配置。
        // 返回值是一个Promise，创建 offer 后，将使用包含新创建的要约的RTCSessionDescription对象来解析该返回值。
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                (window as any).socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: (window as any).roomNumber,
                    toSocketId: fromSocketId,
                    fromNickName: (window as any).nickname
                })
            })
            .catch(err => {
                console.error('error here');
            });
        // @ts-ignore

    }


    public newerCreateRTCPeerConnection(  fromSocketId: string,fromNickName:string, event: any) {

        console.warn('newerCreateRTCPeerConnection');



        console.log('this');
        console.log(this);



        let rtcPcMap = (window as any).rtcPcMap as Map<string, RTCPeerConnection>;
        let personVideoItem = document.createElement('div');
        personVideoItem.setAttribute('class', 'person-video-item');
        personVideoItem.setAttribute('id',fromSocketId);
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
        personVideoItem.ondblclick = ()=>{
            if(personVideoItem.style.position != 'absolute'){
                personVideoItem.style.position = 'absolute';
                personVideoItem.style.zIndex = '99';
                personVideoItem.style.width = '100%';
                personVideoItem.style.height = '100%';
            }else{
                personVideoItem.style.position = 'relative';
                personVideoItem.style.zIndex = '1';
                personVideoItem.style.width = 'auto';
                personVideoItem.style.height = 'auto';
            }

        }
        // @ts-ignore
        let rtcPeerConnection = new RTCPeerConnection((window as any).iceServers, { optional: [{ RtpDataChannels: true }] });
        rtcPcMap.set(fromSocketId, rtcPeerConnection);
        document.getElementById('main-video-content')?.appendChild(personVideoItem);
        rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
            if (event.candidate) {
                // console.log('sending ice candidate', event.candidate);
                (window as any).socket.emit('candidate', {
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate,
                    room: (window as any).roomNumber,
                    toSocketId: fromSocketId
                });
            }
        };

        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);

            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                ipcRenderer.send(ChannelConstant.RTCPEERCONNECTION_DISCONNECTED);
            }
        };

        //@ts-ignore
        let dataChannel = rtcPeerConnection.createDataChannel((window as any).roomNumber, { reliable: false });
        console.log('createDataChannel');

        dataChannel.onopen = function (event) {

            console.log('dataChannel open');


        };
        dataChannel.onmessage = event => {
            console.log('dataChannel onmessage', event.data);
        }
        dataChannel.onclose = function () { console.log("dataChannel closed! ") };
        dataChannel.onerror = function () { console.log("dataChannel ERROR!!!") };

        rtcPeerConnection.oniceconnectionstatechange = function () {
            console.log('rtcPeerConnection.iceConnectionState', rtcPeerConnection.iceConnectionState);

            if (rtcPeerConnection.iceConnectionState == 'disconnected') {
                ipcRenderer.send(ChannelConstant.RTCPEERCONNECTION_DISCONNECTED);
            }
        };

        rtcPeerConnection.ondatachannel = function (ev) {

            ev.channel.onopen = function () {
                console.log('Data channel is open and ready to be used.');
            };
            ev.channel.onmessage = function (e) {
                console.log("DC from  :" + e.data);
            }
        };

        let _audioStream = new MediaStream();
        let _cameraStream = new MediaStream();
        let _sreenStream = new MediaStream();
        rtcPeerConnection.ontrack = function onAddStream(event) {


            // console.log('rtcPeerConnection.ontrack');
            console.log(event);
            let stream = event.streams[0];
            let cameraTrack = stream.getVideoTracks()[0] as MediaStreamTrack;
            let desktopTrack = stream.getVideoTracks()[1] as MediaStreamTrack;

            try {
                _audioStream.addTrack(stream.getAudioTracks()[0]);
            } catch (e) {

            };
            _cameraStream.addTrack(cameraTrack);
            _sreenStream.addTrack(desktopTrack);

            audio.srcObject = _audioStream;
            cameraVideo.srcObject = _cameraStream;
            screenVideo.srcObject = _sreenStream;


            try {
                audio.play();
            } catch (error) {
                console.error(error);
            }
            try {
                cameraVideo.play();
            } catch (error) {
                console.error(error);
            }

            try {
                screenVideo.play();
            } catch (error) {
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

                } else if (cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '100%';
                    cameraVideo.style.height = '100%';



                } else if (!cameraValid && desktopValid) {
                    screenVideo.style.width = '100%';
                    screenVideo.style.height = '100%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';

                } else if (!cameraValid && !desktopValid) {
                    screenVideo.style.width = '0%';
                    screenVideo.style.height = '0%';
                    cameraVideo.style.width = '0%';
                    cameraVideo.style.height = '0%';
                }
                try {
                    screenVideo.play()
                } catch (error) {

                }

                try {
                    cameraVideo.play()
                } catch (error) {

                }
            }, 1000);
        };


        let mediaStreamTrackArray = ((window as any).localStream as MediaStream).getTracks();
        console.log('rtcPeerConnection 正在添加 addTrack', mediaStreamTrackArray);
        mediaStreamTrackArray.forEach(mediaStreamTrack => {
            rtcPeerConnection.addTrack(mediaStreamTrack, (window as any).localStream);
        });

        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                (window as any).socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: (window as any).roomNumber,
                    toSocketId: fromSocketId
                });
            })
            .catch(err => {
                console.error(err);
            });









    }
}
