import VideoUtil from './videoUtil';
import AudioUtil from './audioUtil';
import ScreenUtil from './ScreenUtil';

import { Device } from 'mediasoup-client';
import { ProducerCodecOptions, ProducerOptions, Transport } from 'mediasoup-client/lib/types';


export default class RoomClient {

    public static _EVENTS = {
        exitRoom: 'exitRoom',
        openRoom: 'openRoom',
        startVideo: 'startVideo',
        stopVideo: 'stopVideo',
        startAudio: 'startAudio',
        stopAudio: 'stopAudio',
        startScreen: 'startScreen',
        stopScreen: 'stopScreen'
    }


    public static mediaType = {
        audio: 'audioType',
        video: 'videoType',
        screen: 'screenType'
    }


    private name;

    private localMediaEl;
    private remoteVideoEl;

    private mediasoupClient;

    private socket;
    private producerTransport:Transport;
    private consumerTransport;
    private device;
    private room_id;

    private consumers;
    private producers;
    private producerLabel;

    private _isOpen;
    private eventListeners;
    private password
    /**
     *
     * @param localMediaEl 用于存放本地流的div
     * @param remoteVideoEl  用于存放远程视频流的div，音频流
     * @param mediasoupClient
     * @param socket socketio实例
     * @param room_id 房间号码
     * @param name 自己的名字
     * @param successCallback 回调
     */
    constructor(localMediaEl, remoteVideoEl,   mediasoupClient, socket, room_id, name, password,successCallback) {
        console.log(`constructor  `, localMediaEl, remoteVideoEl,   mediasoupClient, socket, room_id, name, successCallback)
        this.name = name
        this.password = password
        this.localMediaEl = localMediaEl
        this.remoteVideoEl = remoteVideoEl
        // 先保留从js引入的mediasoupClient 但不使用
        this.mediasoupClient = mediasoupClient

        this.socket = socket
        this.producerTransport = null
        this.consumerTransport = null
        this.device = null
        this.room_id = room_id

        this.consumers = new Map()
        this.producers = new Map()

        /**
         * map that contains a mediatype as key and producer_id as value
         */
        this.producerLabel = new Map()

        this._isOpen = false
        this.eventListeners = new Map()
        Object.keys(RoomClient._EVENTS).forEach(function (evt) {
            this.eventListeners.set(evt, [])
        }.bind(this))


        this.createRoom(room_id, password).then(async function () {
            await this.join(name, room_id, password)
            this.initSockets()
            this._isOpen = true
            successCallback()
        }.bind(this))




    }

    ////////// INIT /////////

    async createRoom(room_id, password) {
        console.log(`createRoom`)
        await this.socket.request('createRoom', {
            room_id,
            password
        }).catch(err => {
            console.log(err)
        })
    }

    async join(name, room_id, password) {
        console.log(`join`)
        this.socket.request('join', {
            name,
            room_id,
            password
        }).then(async function (e) {
            console.log(e)
            const data = await this.socket.request('getRouterRtpCapabilities');
            let device = await this.loadDevice(data)
            this.device = device
            ;(window as any).device = device
            await this.initTransports(device);
            this.socket.emit('getProducers');
            (window as any).socketid = e.socketid;
        }.bind(this)).catch(e => {
            console.log(e)
        })
    }

    async loadDevice(routerRtpCapabilities):Promise<Device> {
        console.log(`loadDevice`)
        let device:Device;
        try {
            // device = new this.mediasoupClient.Device();
            device = new Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('browser not supported');
            }
            console.error(error)
        }
        await device.load({
            routerRtpCapabilities
        })
        return device;

    }

    async initTransports(device:Device) {
        console.log(`initTransports`)
        // init producerTransport
        {
            const data = await this.socket.request('createWebRtcTransport', {
                forceTcp: false,
                rtpCapabilities: device.rtpCapabilities,
            })
            if (data.error) {
                console.error(data.error);
                return;
            }

            this.producerTransport = device.createSendTransport(data);

            this.producerTransport.on('connect', async function ({
                dtlsParameters
            }, callback, errback) {
                console.log(`producer request connectTransport`)
                this.socket.request('connectTransport', {
                    dtlsParameters,
                    transport_id: data.id
                })
                    .then(callback)
                    .catch(errback)
            }.bind(this));

            this.producerTransport.on('produce', async function ({
                kind,
                rtpParameters
            }, callback, errback) {
                try {
                    const {
                        producer_id
                    } = await this.socket.request('produce', {
                        producerTransportId: this.producerTransport.id,
                        kind,
                        rtpParameters,
                    });
                    callback({
                        id: producer_id
                    });
                } catch (err) {
                    errback(err);
                }
            }.bind(this))

            this.producerTransport.on('connectionstatechange', function (state) {
                switch (state) {
                    case 'connecting':

                        break;

                    case 'connected':
                        //localVideo.srcObject = stream
                        break;

                    case 'failed':
                        this.producerTransport.close();
                        break;

                    default:
                        break;
                }
            }.bind(this));
        }

        // init consumerTransport
        {
            const data = await this.socket.request('createWebRtcTransport', {
                forceTcp: false,
            });
            if (data.error) {
                console.error(data.error);
                return;
            }

            // only one needed
            this.consumerTransport = device.createRecvTransport(data);
            this.consumerTransport.on('connect', function ({
                dtlsParameters
            }, callback, errback) {
                console.log(`connect request connectTransport`)
                this.socket.request('connectTransport', {
                    transport_id: this.consumerTransport.id,
                    dtlsParameters
                })
                    .then(callback)
                    .catch(errback);
            }.bind(this));

            this.consumerTransport.on('connectionstatechange', async function (state) {
                switch (state) {
                    case 'connecting':
                        break;

                    case 'connected':
                        //remoteVideo.srcObject = await stream;
                        //await socket.request('resume');
                        break;

                    case 'failed':
                        this.consumerTransport.close();
                        break;

                    default:
                        break;
                }
            }.bind(this));
        }

    }

    initSockets() {
        this.socket.on('consumerClosed', function ({
            consumer_id
        }) {
            console.log('closing consumer:', consumer_id)
            this.removeConsumer(consumer_id)
        }.bind(this))

        /**
         * data: [ {
         *  producer_id:
         *  producer_socket_id:
         * }]
         */
        this.socket.on('newProducers', async function (data) {
            console.log('new producers', data)
            for (let {
                producer_id,
                producer_socket_id
            } of data) {
                await this.consume(producer_id, producer_socket_id)
            }
        }.bind(this))

        this.socket.on('disconnect', function () {
            this.exit(true)
        }.bind(this))

        // 自定义方法
        this.socket.on('joined', function (data) {
            console.log(`一个用户${data.name}加入了房间`);

            (window as any).personMap.set(data.socketid, data.name);

        }.bind(this));
        // 自定义方法
        this.socket.on('othersInRoom', function (data) {

            for(let item of data){
                (window as any).personMap.set(item.socketid, item.name);
            }

        }.bind(this));

        // 自定义方法
        this.socket.on('a user is disconnected', function (data) {
            ((window as any).personMap as Map<string, string>).delete(data.sockerid);
            let personVideoItem = document.getElementById(data.sockerid);
            if (personVideoItem) {
                personVideoItem.parentNode.removeChild(personVideoItem);
            }
        }.bind(this))


    }




    //////// MAIN FUNCTIONS /////////////


    async produce(type, deviceId = null) {
        console.log(`produce: ${type} ${deviceId}`)
        let mediaConstraints = {} as MediaStreamConstraints
        let audio = false
        let screen = false
        switch (type) {
            case RoomClient.mediaType.audio:
                mediaConstraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100,
                        channelCount: { ideal: 2, min: 1 },
                        deviceId: deviceId
                    },
                    video: false
                }
                audio = true
                break
            case RoomClient.mediaType.video:
                let resolution = document.getElementById('video-resolution');
                let defaultWidth = 1280;
                let defaultHeight = 760;
                if(resolution){
                    //@ts-ignore
                    let value = resolution.value;
                    if(value === '1280*768'){
                        defaultWidth = 1280;
                        defaultHeight = 760;
                    }else if(value === '1920*1080'){
                        defaultWidth = 1920;
                        defaultHeight = 1080;
                    }
                }
                mediaConstraints = {
                    audio: false,
                    video: {
                        width: {
                            min: 640,
                            ideal: defaultWidth,
                            max: defaultWidth,
                            exact: defaultWidth
                        },
                        height: {
                            min: 400,
                            ideal: defaultHeight,
                            max: defaultHeight,
                            exact: defaultHeight
                        },
                        // 必须是一个数字，对象报错
                        frameRate: 60,
                        // frameRate:{ideal: 48,min:24,max:60, exact:60},
                        deviceId: deviceId
                        /*aspectRatio: {
                            ideal: 1.7777777778
                        }*/
                    }
                }
                break
            case RoomClient.mediaType.screen:
                mediaConstraints = {}
                screen = true
                break;
            default:
                return
                break;
        }
        if (!this.device.canProduce('video') && !audio) {
            console.error('cannot produce video');
            return;
        }
        if (this.producerLabel.has(type)) {
            console.log('producer already exists for this type ' + type)
            return
        }
        console.log('mediacontraints:', mediaConstraints)
        let stream:MediaStream;
        try {
            // 获取流
            if (screen) {

                let screenUtil = new ScreenUtil();
                stream = await screenUtil.getScreenStream();

            } else if (audio) {
                let audioUtil = new AudioUtil();
                if(deviceId === 'system'){

                    // 判断目标是获取系统的声音
                    try {
                        (window as any).toastr.info('获取屏幕声音');
                        let _stream = await audioUtil.getSystemStream();
                        (window as any)._stream = _stream;
                        console.log(_stream);
                        // 获取整个流之后只取音轨部分
                        stream = new MediaStream([_stream.getAudioTracks()[0]]);
                    } catch (error) {
                        console.error(error);
                        (window as any).toastr.error('获取屏幕声音失败');
                    }
                    
                } else {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
                    } catch (error) {
                        (window as any).toastr.error('获取音频流失败');

                        try {

                            (window as any).toastr.info('更改为获取系统声音');
                            let _stream = await audioUtil.getSystemStream();
                            (window as any)._stream = _stream;
                            console.log(_stream);

                            stream = new MediaStream([_stream.getAudioTracks()[0]]);
                        } catch (error) {
                            console.error(error);
                            (window as any).toastr.error('获取系统声音失败');
                        }

                    }
                }
                (window as any).currentStream = stream;
                (window as any).drawAudioWave(stream);
            } else {
                try {

                    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
                    console.log('ddddddddddddddddddddddddddddddddddddddddddddd')
                } catch (error) {
                    console.log('vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv')
                    console.error(error);
                    let videoMeeting = new VideoUtil();
                    let _stream = await videoMeeting.getStream();
                    stream = new MediaStream([_stream.getAudioTracks()[0], _stream.getVideoTracks()[0]]);
                }
            }



            console.log(navigator.mediaDevices.getSupportedConstraints());

            console.log("audio ? ", audio ? 'YES' : "NO");

            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0].clone();
   
            const params: ProducerOptions = {
                track: track
            };
       
            if (!audio && !screen) {
                // 强制使用h264
                params.codec = this.device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === 'video/h264')
                params.encodings = [{
                    rid: 'r0',
                    maxBitrate: 100000,
                    //scaleResolutionDownBy: 10.0,
                    scalabilityMode: 'S1T3'
                },
                {
                    rid: 'r1',
                    maxBitrate: 300000,
                    scalabilityMode: 'S1T3'
                },
                {
                    rid: 'r2',
                    maxBitrate: 900000,
                    scalabilityMode: 'S1T3'
                }
                ];

                const codecOptions:ProducerCodecOptions = {
                    videoGoogleStartBitrate: 1000,
                    videoGoogleMaxBitrate: 1000,
                    videoGoogleMinBitrate: 1000
                } ;
                params.codecOptions = codecOptions;
            } else if (screen) {
                // params.codec = this.device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === 'video/vp8')
                // 强制使用h264
                params.codec = this.device.rtpCapabilities.codecs.find((codec) => codec.mimeType.toLowerCase() === 'video/h264')
  
                params.encodings = [{
                    maxBitrate: 900000,
                    maxFramerate: 120,
                    priority: 'high',
                    networkPriority: 'high'
                }]

                // params.codecOptions = codecOptions;
            }
            console.log('params = ' , params)
            let producer = await this.producerTransport.produce(params);
            (window as any).currentProducer = producer;
            console.log('producer', producer)

            this.producers.set(producer.id, producer)

            let elem;
            if (!audio) {
                elem = document.createElement('video')
                elem.srcObject = stream;
                elem.id = producer.id;
                elem.playsinline = false;
                elem.autoplay = true;
                elem.className = "vid";
                elem.muted = true;
                this.localMediaEl.appendChild(elem);
            }

            producer.on('trackended', () => {
                this.closeProducer(type)
            })

            producer.on('transportclose', () => {
                console.log('producer transport close')
                if (!audio) {
                    elem.srcObject.getTracks().forEach(function (track) {
                        track.stop()
                    })
                    elem.parentNode.removeChild(elem)
                }
                this.producers.delete(producer.id)

            })

            producer.on('close', () => {
                console.log('closing producer')
                if (!audio) {
                    elem.srcObject.getTracks().forEach(function (track) {
                        track.stop()
                    })
                    elem.parentNode.removeChild(elem)
                }
                this.producers.delete(producer.id)

            })

            this.producerLabel.set(type, producer.id)
            console.log(`switch (${type})`)
            switch (type) {
                case RoomClient.mediaType.audio:
                    this.event(RoomClient._EVENTS.startAudio)
                    break
                case RoomClient.mediaType.video:
                    this.event(RoomClient._EVENTS.startVideo)
                    break
                case RoomClient.mediaType.screen:
                    this.event(RoomClient._EVENTS.startScreen)
                    break;
                default:
                    return
                    break;
            }
        } catch (err) {
            console.log(err)
        }
    }

    async consume(producer_id, producer_socket_id?) {
        console.log(`consume ${producer_id}`)
        //let info = await roomInfo()

        this.getConsumeStream(producer_id).then(function ({
            consumer,
            stream,
            kind
        }) {

            this.consumers.set(consumer.id, consumer)

            let elem;
            if (kind === 'video') {



                elem = document.createElement('video');

                elem.srcObject = stream;
                elem.id = consumer.id;
                elem.playsinline = false;
                elem.autoplay = true;
                elem.className = "vid";
                elem.setAttribute('producer_id', producer_id);

                if (document.getElementById(producer_socket_id)) {
                    document.getElementById(producer_socket_id).appendChild(elem);
                } else {
                    let div = document.createElement('div');
                    div.className = 'person-video-item';
                    div.id = producer_socket_id;

                    let personInfo = document.createElement('div');
                    personInfo.setAttribute('class', 'person-info');
                    let personName = document.createElement('span');
                    personName.className = 'person-name';
                    let personStatus = document.createElement('span');
                    personStatus.className = 'person-status';
                    personName.innerHTML = (window as any).personMap.get(producer_socket_id)+"：";
                    personStatus.innerHTML = '';
                    personInfo.appendChild(personName);
                    personInfo.appendChild(personStatus);
                    div.appendChild(personInfo);

                    div.appendChild(elem);
                    this.remoteVideoEl.appendChild(div);

                    div.setAttribute('onclick','videoMax(this)');
                }

            } else {
                elem = document.createElement('audio');
                elem.srcObject = stream;
                elem.id = consumer.id;
                elem.playsinline = false;
                elem.autoplay = true;
                if (document.getElementById(producer_socket_id)) {
                    let personItem = document.getElementById(producer_socket_id);
                    personItem.appendChild(elem);
                    personItem.querySelector('.person-status').innerHTML= '发言中...';
                } else {
                    let div = document.createElement('div');
                    div.className = 'person-video-item';
                    div.id = producer_socket_id;
                    div.appendChild(elem);

                    let personInfo = document.createElement('div');
                    personInfo.setAttribute('class', 'person-info');
                    let personName = document.createElement('span');
                    personName.className = 'person-name';
                    let personStatus = document.createElement('span');
                    personStatus.className = 'person-status';
                    personName.innerHTML = (window as any).personMap.get(producer_socket_id)+"：";
                    personStatus.innerHTML = '发言中...';
                    personInfo.appendChild(personName);
                    personInfo.appendChild(personStatus);
                    div.appendChild(personInfo);
                    this.remoteVideoEl.appendChild(div);
                }

            }

            consumer.on('trackended', function () {
                this.removeConsumer(consumer.id)
            }.bind(this))
            consumer.on('transportclose', function () {
                this.removeConsumer(consumer.id)
            }.bind(this))



        }.bind(this))
    }

    async getConsumeStream(producerId) {
        console.log(`getConsumeStream by producerId:${producerId}`)
        const {
            rtpCapabilities
        } = this.device
        console.log(`request consume`);
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id, // might be
            producerId
        });
        // 从返回的结果中解构赋值
        const {
            id,
            kind,
            rtpParameters,
        } = data;

        let codecOptions = {};
        console.log('Create a Consumer to consume a remote Producer.');
        const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });

        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        return {
            consumer,
            stream,
            kind
        }
    }

    closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('there is no producer for this type ' + type)
            return
        }
        let producer_id = this.producerLabel.get(type)
        console.log(producer_id)
        this.socket.emit('producerClosed', {
            producer_id
        })
        this.producers.get(producer_id).close()
        this.producers.delete(producer_id)
        this.producerLabel.delete(type)

        if (type !== RoomClient.mediaType.audio) {
            let elem = document.getElementById(producer_id);
            //@ts-ignore
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop()
            })
            elem.parentNode.removeChild(elem)
        }

        switch (type) {
            case RoomClient.mediaType.audio:
                this.event(RoomClient._EVENTS.stopAudio)
                break
            case RoomClient.mediaType.video:
                this.event(RoomClient._EVENTS.stopVideo)
                break
            case RoomClient.mediaType.screen:
                this.event(RoomClient._EVENTS.stopScreen)
                break;
            default:
                return
                break;
        }

    }

    pauseProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('there is no producer for this type ' + type)
            return
        }
        let producer_id = this.producerLabel.get(type)
        this.producers.get(producer_id).pause()

    }

    resumeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('there is no producer for this type ' + type)
            return
        }
        let producer_id = this.producerLabel.get(type)
        this.producers.get(producer_id).resume()

    }

    removeConsumer(consumer_id) {

        let elem = document.getElementById(consumer_id);
        if(elem == null) return;
        //@ts-ignore
        if(elem.srcObject && elem.srcObject != null){
            //@ts-ignore
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop()
            })
        }
        let nodeName = elem.nodeName;


        let parent = elem.parentNode;
        parent.removeChild(elem);
        if(nodeName == 'AUDIO'){
            parent.querySelector('.person-status').innerHTML = '';
        }
        if(parent.querySelectorAll('audio').length == 0 && parent.querySelectorAll('video').length == 0){
            parent.parentNode.removeChild(parent);
        }
        this.consumers.delete(consumer_id)

    }

    exit(offline = false) {

        let clean = function () {
            this._isOpen = false
            this.consumerTransport.close()
            this.producerTransport.close()
            this.socket.off('disconnect')
            this.socket.off('newProducers')
            this.socket.off('consumerClosed')
        }.bind(this)

        if (!offline) {
            this.socket.request('exitRoom').then(e => console.log(e)).catch(e => console.warn(e)).finally(function () {
                clean()
            }.bind(this))
        } else {
            clean()
        }

        this.event(RoomClient._EVENTS.exitRoom)

    }

    ///////  HELPERS //////////

    async roomInfo() {
        let info = await this.socket.request('getMyRoomInfo')
        return info
    }

    // static get mediaType() {
    //     return mediaType
    // }

    event(evt) {
        if (this.eventListeners.has(evt)) {
            this.eventListeners.get(evt).forEach(callback => callback())
        }
    }

    on(evt, callback) {
        this.eventListeners.get(evt).push(callback)
    }

    //////// GETTERS ////////

    isOpen() {
        return this._isOpen
    }

    static get EVENTS() {
        return RoomClient._EVENTS
    }
}
