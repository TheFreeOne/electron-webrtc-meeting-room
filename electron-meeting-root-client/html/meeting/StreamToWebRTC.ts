export default class StreamToWebRTC{



    public run(_localStream){



        (window as any).localStream = _localStream;
        // document.getElementById('callBtn').onclick = () => {
        //     socket.emit('create or join', roomInput.value);
        //     roomNumber = roomInput.value;
        // }


        (window as any).socket.emit('create or join', (window as any).roomNumber);

    }

    constructor(number) {

        (window as any).roomNumber = number;
        (window as any).remoteStream = null;
        (window as any).rtcPeerConnection = null;
        (window as any).isCaller = false;
        (window as any).dataChannel  = null;
        (window as any).localStream = null;
        (window as any).socket = null;
        (window as any).remoteVideo = document.getElementById('main-video');
        const iceServers = {
            iceServers: [
                {urls: 'stun:192.168.0.142:13478'},
                {urls: 'stun:192.168.0.142:13479'}

            ]
        };



        //@ts-ignore
        const _socket = io((window as any).config.nodeRoomServer,{path:'/socket.io'});
        (window as any).socket = _socket;






        console.log('video will be played');

        _socket.onopen = ()=>{
            console.log('ok')
        };



        _socket.on('connection',function(socket) {
            console.log('made socket connection');

        });
        (window as any).socket.on('created', room => {
            console.log(`socket.on('created'`);
            (window as any).isCaller = true;

        });
        (window as any).socket.on('joined', room => {
            console.log(`socket.on('joined'`);
            (window as any).socket.emit('ready', (window as any).roomNumber);
        });

        (window as any).socket.on('ready', () => {
            console.log(`socket.on('ready'`);
            if ((window as any).isCaller) {
                // @ts-ignore
                window.rtcPeerConnection = new RTCPeerConnection(iceServers);
                console.log((window as any).rtcPeerConnection);
                (window as any).rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if(event.candidate) {
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
                    // @ts-ignore
                    (window as any).remoteVideo.srcObject = event.streams[0];
                    (window as any).remoteStream = event.streams[0];
                    try {
                        // @ts-ignore
                        (window as any).remoteVideo.play();
                    } catch (error) {
                        console.error(error)
                    }
                };
                (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[0], (window as any).localStream);
                if((window as any).localStream.getTracks().length > 1) {
                    (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[1], (window as any).localStream);
                };
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
                    // h2CallName.innerText = event.data
                }
            }
        });

        (window as any).socket.on('offer', (event) => {
            console.log(` socket.on('offer'`);
            if (!(window as any).isCaller) {
                (window as any).rtcPeerConnection = new RTCPeerConnection(iceServers);
                console.log((window as any).rtcPeerConnection);
                (window as any).rtcPeerConnection.onicecandidate = function onIceCandidate(event) {
                    if(event.candidate) {
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
                // @ts-ignore
                (window as any).rtcPeerConnection.ontrack = function onAddStream(event) {
                    // @ts-ignore
                    console.log('rtcPeerConnection.ontrack');
                    console.log(event);
                    (window as any).remoteVideo.srcObject = event.streams[0];
                    (window as any).remoteStream = event.streams[0];
                    try {
                        // @ts-ignore
                        (window as any).remoteVideo.play();
                    } catch (error) {
                        console.error(error)
                    }
                };
                (window as any).rtcPeerConnection.addTrack((window as any).localStream.getTracks()[0], (window as any).localStream);
                if((window as any).localStream.getTracks().length > 1){
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
    }
}
