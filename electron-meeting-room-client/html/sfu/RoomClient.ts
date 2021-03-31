import VideoUtil from './videoUtil' ;
import AudioUtil from './audioUtil' ;




export default  class RoomClient {

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
    private remoteAudioEl;
    private mediasoupClient;

    private socket;
    private producerTransport;
    private consumerTransport;
    private device;
    private room_id;

    private consumers;
    private producers;
    private producerLabel;

    private _isOpen;
    private eventListeners;

    constructor(localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback) {
        console.log(`constructor  `, localMediaEl, remoteVideoEl, remoteAudioEl, mediasoupClient, socket, room_id, name, successCallback)
        this.name = name
        this.localMediaEl = localMediaEl
        this.remoteVideoEl = remoteVideoEl
        this.remoteAudioEl = remoteAudioEl
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


        this.createRoom(room_id).then(async function () {
            await this.join(name, room_id)
            this.initSockets()
            this._isOpen = true
            successCallback()
        }.bind(this))




    }

    ////////// INIT /////////

    async createRoom(room_id) {
        console.log(`createRoom`)
        await this.socket.request('createRoom', {
            room_id
        }).catch(err => {
            console.log(err)
        })
    }

    async join(name, room_id) {
        console.log(`join`)
        this.socket.request('join', {
            name,
            room_id
        }).then(async function (e) {
            console.log(e)
            const data = await this.socket.request('getRouterRtpCapabilities');
            let device = await this.loadDevice(data)
            this.device = device
            await this.initTransports(device)
            this.socket.emit('getProducers')
        }.bind(this)).catch(e => {
            console.log(e)
        })
    }

    async loadDevice(routerRtpCapabilities) {
        console.log(`loadDevice`)
        let device;
        try {
            device = new this.mediasoupClient.Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('browser not supported');
            }
            console.error(error)
        }
        await device.load({
            routerRtpCapabilities
        })
        return device

    }

    async initTransports(device) {
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
                producer_id
            } of data) {
                await this.consume(producer_id)
            }
        }.bind(this))

        this.socket.on('disconnect', function () {
            this.exit(true)
        }.bind(this))


    }




    //////// MAIN FUNCTIONS /////////////


    async produce(type, deviceId = null) {
        console.log(`produce: ${type} ${deviceId}`)
        let mediaConstraints = {}
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
                mediaConstraints = {
                    audio: false,
                    video: {
                        width: {
                            min: 640,
                            ideal: 1920
                        },
                        height: {
                            min: 400,
                            ideal: 1080
                        },
                        deviceId: deviceId
                        /*aspectRatio: {
                            ideal: 1.7777777778
                        }*/
                    }
                }
                break
            case RoomClient.mediaType.screen:
                mediaConstraints = false
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
        let stream;
        try {
            // 获取流
            if (screen) {


                try {
                    //@ts-ignore
                    stream = navigator.mediaDevices.getDisplayMedia();
                } catch (error) {

                }
            } else if (audio) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
                } catch (error) {
                   try {
                    let audioUtil = new AudioUtil();
                    let _stream = await audioUtil.getSystemStream();
                    (window as any)._stream = _stream;
                    console.log(_stream);
                    
                    stream = new MediaStream([_stream.getAudioTracks()[0],_stream.getVideoTracks()[0]]);
                   } catch (error) {
                       console.error(error);
                       
                   }

                }
            } else {
                try {
                    stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
                } catch (error) {

                    console.error(error);
                    let videoMeeting = new VideoUtil();
                    let _stream = await videoMeeting.getStream();
                    stream = new MediaStream([_stream.getAudioTracks()[0],_stream.getVideoTracks()[0]]);
                }
            }



            console.log(navigator.mediaDevices.getSupportedConstraints());


            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
            const params = {
                track
            };
            if (!audio && !screen) {
                //@ts-ignore
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
                //@ts-ignore
                params.codecOptions = {
                    videoGoogleStartBitrate: 1000
                };
            }

            let producer = await this.producerTransport.produce(params)

            console.log('producer', producer)

            this.producers.set(producer.id, producer)

            let elem
            if (!audio) {
                elem = document.createElement('video')
                elem.srcObject = stream
                elem.id = producer.id
                elem.playsinline = false
                elem.autoplay = true
                elem.className = "vid"
                this.localMediaEl.appendChild(elem)
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

    async consume(producer_id) {
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
                let div = document.createElement('div');
                div.className = 'person-video-item';

                elem = document.createElement('video');

                elem.srcObject = stream;
                elem.id = consumer.id;
                elem.playsinline = false;
                elem.autoplay = true;
                elem.className = "vid";
                div.appendChild(elem);
                div.setAttribute('consumer_id',producer_id);
                this.remoteVideoEl.appendChild(div);
            } else {
                elem = document.createElement('audio');
                elem.srcObject = stream;
                elem.id = consumer.id;
                elem.playsinline = false;
                elem.autoplay = true;
                this.remoteAudioEl.appendChild(elem);
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
        console.log(`getConsumeStream ${producerId}`)
        const {
            rtpCapabilities
        } = this.device
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id, // might be
            producerId
        });
        const {
            id,
            kind,
            rtpParameters,
        } = data;

        let codecOptions = {};
        const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        })
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
        //@ts-ignore
        elem.srcObject.getTracks().forEach(function (track) {
            track.stop()
        })
        let parent = elem.parentNode;
        parent.removeChild(elem);
        this.consumers.delete(consumer_id)
        // 备注，后面加的
        // @ts-ignore
        if(parent.className == 'person-video-item'){
            parent.parentNode.removeChild(parent);
        }
   

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
