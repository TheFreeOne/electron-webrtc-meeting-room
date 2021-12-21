const config = require('./config')
import * as SocketIO from 'socket.io';
import Peer from './Peer' ;
import { Worker } from 'mediasoup/node/lib/Worker';
import { Router } from 'mediasoup/node/lib/Router';
import { WebRtcTransport, WebRtcTransportStat } from 'mediasoup/node/lib/WebRtcTransport';


export default class Room {

    /**
     * 房间的号码
     */
    private id:string;

    private peers:Map<any,Peer>;

    private io:SocketIO.Server;

    private router:Router;

    constructor(room_id:string, worker:Worker, io:SocketIO.Server) {
        this.id = room_id
        const mediaCodecs = config.mediasoup.router.mediaCodecs
        worker.createRouter({
            mediaCodecs
        }).then(function (router) {
            this.router = router
        }.bind(this))

        this.peers = new Map()
        this.io = io
    }

    addPeer(peer) {
        this.peers.set(peer.id, peer)
    }

    getProducerListForPeer(socket_id) {
        let producerList = []
        this.peers.forEach(peer => {
            peer.producers.forEach(producer => {
                producerList.push({
                   
                    producer_id: producer.id
                    // 兼容写法
                    , peerId: peer.id
                    // @ts-ignore 获取额外添加的属性
                    , producer_socket_id: producer.producer_socket_id
                })
            })
        })
        return producerList;
    }

    getRtpCapabilities():Router["rtpCapabilities"] {
        return this.router.rtpCapabilities
    }

    async createWebRtcTransport(socket_id) {
        const {
            maxIncomingBitrate,
            initialAvailableOutgoingBitrate
        } = config.mediasoup.webRtcTransport;
        // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
        const transport:WebRtcTransport = await this.router.createWebRtcTransport({
            listenIps: config.mediasoup.webRtcTransport.listenIps,  // 监听IP地址或优先顺序的地址(第一个是首选的)
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate,  //初始可用的输出比特率(以bps为单位)。
            enableSctp:false
        });
        if (maxIncomingBitrate) {
            try {
                await transport.setMaxIncomingBitrate(maxIncomingBitrate);
            } catch (error) {}
        }

        transport.on('dtlsstatechange', function(dtlsState) {

            if (dtlsState === 'closed') {
                console.log('---transport close--- ' + this.peers.get(socket_id).name + ' closed')
                transport.close()
            }
        }.bind(this))

        transport.on('close', () => {
            console.log('---transport close--- ' + this.peers.get(socket_id).name + ' closed')
        })
        console.log('---adding transport---', transport.id)
        this.peers.get(socket_id).addTransport(transport)
        return {
            params: {
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
                sctpParameters: transport.sctpParameters
            },
        };
    }

    async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
        if (!this.peers.has(socket_id)) return
        await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)

    }

    async produce(socket_id, producerTransportId, rtpParameters, kind) {
        // handle undefined errors
        return new Promise(async function (resolve, reject) {
             
            let producer = await (this.peers.get(socket_id) as Peer).createProducer(producerTransportId, rtpParameters, kind,socket_id);
            resolve(producer.id)
            this.broadCast(socket_id, 'newProducers', [{
                producer_id: producer.id,
                producer_socket_id: socket_id
            }])
        }.bind(this));
    }

    async consume(socket_id, consumer_transport_id, producer_id,  rtpCapabilities) {
        // handle nulls
        if (!this.router.canConsume({
            producerId: producer_id,
            rtpCapabilities,
        })) {
            console.error('can not consume');
            return;
        }
 
        let {consumer, params} = await this.peers.get(socket_id).createConsumer(consumer_transport_id, producer_id, rtpCapabilities)

        consumer.on('producerclose', function(){
            console.log(`---consumer closed--- due to producerclose event  name:${this.peers.get(socket_id).name} consumer_id: ${consumer.id}`)
            this.peers.get(socket_id).removeConsumer(consumer.id)
            // tell client consumer is dead
            this.io.to(socket_id).emit('consumerClosed', {
                consumer_id: consumer.id
            })
        }.bind(this));

        consumer.on('producerpause', () =>
		{
			// tell client consumer is pause
            console.dir(`---producerpause---`)
            this.io.to(socket_id).emit('consumerPaused', {
                consumer_id: consumer.id
            })
		});

		consumer.on('producerresume', () =>
		{
			// tell client consumer is resume
            console.dir(`---producerresume---`)
            this.io.to(socket_id).emit('consumerResumed', {
                consumer_id: consumer.id
            })
		});


        return params;

    }
    /**
     * 
     * @param socket_id 移除人员
     */
    async removePeer(socket_id) {
        this.peers.get(socket_id).close()
        this.peers.delete(socket_id)
    }

    closeProducer(socket_id, producer_id) {
        this.peers.get(socket_id).closeProducer(producer_id)
    }

    async pauseProducer(socket_id, producer_id){
       await this.peers.get(socket_id).pauseProducer(producer_id);
    }

    async resumeProducer(socket_id, producer_id){
        await this.peers.get(socket_id).resumeProducer(producer_id);
     }

    broadCast(socket_id, name, data) {
        for (let otherID of Array.from(this.peers.keys()).filter(id => id !== socket_id)) {
            this.send(otherID, name, data)
        }
    }

    send(socket_id, name, data) {
        this.io.to(socket_id).emit(name, data)
    }

    getPeers(){
        return this.peers
    }

    toJson() {
        return {
            id: this.id,
            // @ts-ignore
            peers: JSON.stringify([...this.peers])
        }
    }


}

 
