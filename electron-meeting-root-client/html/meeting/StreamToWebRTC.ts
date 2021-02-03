export default class StreamToWebRTC {



    public run(_localStream) {



        (window as any).localStream = _localStream;
        // document.getElementById('callBtn').onclick = () => {
        //     socket.emit('create or join', roomInput.value);
        //     roomNumber = roomInput.value;
        // }


        (window as any).socket.emit('create or join', {room: (window as any).roomNumber ,nickname: (window as any).nickname});

    }

    constructor(number) {

        // 此处使用(window as any)是为了避免无法调用相关变量

        // 房间号
        (window as any).roomNumber = number;

        // 远程对象传输过来的流
        (window as any).remoteStream = null;

        // 用于视频流/音频流、以及数据的传输
        (window as any).rtcPeerConnection = null;

        // 是否在童话
        (window as any).isCaller = false;

        // 用于传输数据
        (window as any).dataChannel = null;

        // 本地流，音视频流，屏幕留
        (window as any).localStream = null;

        // soket.io创建的socket
        (window as any).socket = null;

        // 页面中用于远程传输过来的流的video标签
        (window as any).remoteVideo = document.getElementById('main-video');

        // 打洞服务器的相关配置，局域网或者是单机环境下，这个配置不会生效
        const iceServers = {
            iceServers: [
                { urls: 'stun:192.168.0.142:13478' },
                { urls: 'stun:192.168.0.142:13479' }
            ]
        };

        // 链接房间服务器
        //@ts-ignore
        const _socket = io((window as any).config.nodeRoomServer, { path: '/socket.io' });
        (window as any).socket = _socket;

        // 收到created，说明房间已经创建好了
        (window as any).socket.on('created', room => {
            console.log(`socket.on('created'`);
            (window as any).isCaller = true;

        });
        // 收到joined，说明成功加入一个房间
        (window as any).socket.on('joined', room => {
            console.log(`socket.on('joined'`);
            // 被动的一方/收到邀请的一方向服务器发送消息，说明客人已经准备好进行通讯
            (window as any).socket.emit('ready', (window as any).roomNumber);
        });

        // 房间创建者/发起方/主人  收到已经准备好的消息，
        (window as any).socket.on('ready', () => {
            console.log(`socket.on('ready'`);
            if ((window as any).isCaller) {

                // 创建rtcPeerConnection用于音视频相关的传输
                (window as any).rtcPeerConnection = new RTCPeerConnection(iceServers);

                // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/onicecandidate
                // 只要本地代理ICE 需要通过信令服务器传递信息给其他对等端时就会触发
                (window as any).rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if (event.candidate) {
                        console.log('sending ice candidate', event.candidate);
                        (window as any).socket.emit('candidate', {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdMid,
                            candidate: event.candidate.candidate,
                            room: (window as any).roomNumber
                        })
                    }
                };
                // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/ontrack
                // rtcPeerConnection收到流
                (window as any).rtcPeerConnection.ontrack = function onAddStream(event) {
                    console.log('rtcPeerConnection get stream ');
                    console.log(event);
                    ; (window as any).remoteVideo.srcObject = event.streams[0];
                    (window as any).remoteStream = event.streams[0];
                    try {
                        (window as any).remoteVideo.play();
                    } catch (error) {
                        console.error(error);
                    }
                };

                // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/addTrack
                // rtcPeerConnection
                (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[0], (window as any).localStream);
                if ((window as any).localStream.getTracks().length > 1) {
                    (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[1], (window as any).localStream);
                };

                // https://developer.mozilla.org/zh-CN/docs/Web/API/RTCPeerConnection/createOffer
                // RTCPeerConnection接口的createOffer（）方法启动创建一个SDP offer，目的是启动一个新的WebRTC去连接远程端点。
                // SDP offer包含有关已附加到WebRTC会话，浏览器支持的编解码器和选项的所有MediaStreamTracks信息，以及ICE 代理，目的是通过信令信道发送给潜在远程端点，以请求连接或更新现有连接的配置。
                // 返回值是一个Promise，创建 offer 后，将使用包含新创建的要约的RTCSessionDescription对象来解析该返回值。
                (window as any).rtcPeerConnection.createOffer()
                    .then(sessionDescription => {
                        (window as any).rtcPeerConnection.setLocalDescription(sessionDescription);
                        (window as any).socket.emit('offer', {
                            type: 'offer',
                            sdp: sessionDescription,
                            room: (window as any).roomNumber
                        })
                    })
                    .catch(err => {
                        console.log('error here');
                    });
                (window as any).dataChannel = (window as any).rtcPeerConnection.createDataChannel((window as any).roomNumber);
                (window as any).dataChannel.onmessage = event => {
                    console.log(event.data, "rollercoaster");
                }
            }
        });

        // 收到邀请的一方收到offer
        (window as any).socket.on('offer', (event) => {
            console.log(` socket.on('offer'`);
            if (!(window as any).isCaller) {
                (window as any).rtcPeerConnection = new RTCPeerConnection(iceServers);
             
                (window as any).rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if (event.candidate) {
                        console.log('sending ice candidate', event.candidate);
                        (window as any).socket.emit('candidate', {
                            type: 'candidate',
                            label: event.candidate.sdpMLineIndex,
                            id: event.candidate.sdMid,
                            candidate: event.candidate.candidate,
                            room: (window as any).roomNumber
                        })
                    }
                };
                 
                (window as any).rtcPeerConnection.ontrack = function onAddStream(event) {
                     
                    console.log('rtcPeerConnection.ontrack');
                    console.log(event);
                    (window as any).remoteVideo.srcObject = event.streams[0];
                    (window as any).remoteStream = event.streams[0];
                    try {
                       
                        (window as any).remoteVideo.play();
                    } catch (error) {
                        console.error(error)
                    }
                };

                (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[0], (window as any).localStream);
                if ((window as any).localStream.getTracks().length > 1) {
                    (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[1], (window as any).localStream);
                }

                (window as any).rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
                (window as any).rtcPeerConnection.createAnswer()
                    .then(sessionDescription => {
                        (window as any).rtcPeerConnection.setLocalDescription(sessionDescription);
                        (window as any).socket.emit('answer', {
                            type: 'answer',
                            sdp: sessionDescription,
                            room: (window as any).roomNumber
                        })
                    })
                    .catch(err => {
                        console.log('error here');
                    });
                (window as any).rtcPeerConnection.ondatachannel = event => {
                    (window as any).dataChannel = event.channel;
                    (window as any).dataChannel.onmessage = event => {
                        // h2CallName.innerText = event.data
                    }
                }
            }
        });



        (window as any).socket.on('answer', (event) => {
            console.log(`socket.on('answer'`);
            console.log('answered done');
            (window as any).rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        });

        (window as any).socket.on('candidate', event => {
            console.log(`socket.on('candidate'`);
            console.log('am her for Ice', event);
            const candidate = new RTCIceCandidate({
                sdpMLineIndex: event.label,
                candidate: event.candidate
            });
            (window as any).rtcPeerConnection.addIceCandidate(candidate);
        })

        // 页面关闭之后
        window.onunload = function windowClose(){
            if((window as any).socket){
                (window as any).socket.emit('out of room', {
                    room: (window as any).roomNumber,
                    nickname: (window as any).nickname
                });
            }
        }
    }
}
