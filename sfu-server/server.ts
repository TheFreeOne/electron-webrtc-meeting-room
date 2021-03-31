const express = require('express');
import * as HTTP from 'http';
const app = express();
const https = require('httpolyglot');
const fs = require('fs');
import * as mediasoup from 'mediasoup';
// const mediasoup = require('mediasoup');
const config = require('./config');
const path = require('path');
import Room  from './Room';
import Peer from './Peer';
import * as SocketIO from 'socket.io';
import { Worker } from 'mediasoup/src/Worker';
(async () => {
    await createWorkers()
})();


const options = {
    // key: fs.readFileSync(path.join(__dirname,config.sslKey), 'utf-8'),
    // cert: fs.readFileSync(path.join(__dirname,config.sslCrt), 'utf-8')
}
const http: HTTP.Server = new HTTP.Server(app);
// const httpsServer = https.createServer(options, app)
import { Socket }from 'socket.io';


const io: SocketIO.Server = require('socket.io')(http)



app.use(express.static(path.join(__dirname, '.', 'public')))

http.listen(config.listenPort, () => {
    console.log('listening https ' + config.listenPort)
})
 

// all mediasoup workers
let workers = new Array<Worker>()
let nextMediasoupWorkerIdx = 0

/**
 * roomList
 * {
 *  room_id: Room {
 *      id:
 *      router:
 *      peers: {
 *          id:,
 *          name:,
 *          master: [boolean],
 *          transports: [Map],
 *          producers: [Map],
 *          consumers: [Map],
 *          rtpCapabilities:
 *      }
 *  }
 * }
 */
let roomList = new Map<string,Room>();




async function createWorkers() {
    let {
        numWorkers
    } = config.mediasoup
    console.log(`create  ${numWorkers} workers `)

    for (let i = 0; i < numWorkers; i++) {
        try {
            let worker = await mediasoup.createWorker({
                logLevel: config.mediasoup.worker.logLevel,
                logTags: config.mediasoup.worker.logTags,
                rtcMinPort: config.mediasoup.worker.rtcMinPort,
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
            });
            
            worker.on('died', () => {
                console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
                setTimeout(() => process.exit(1), 2000);
            });
            //@ts-ignore
            workers.push(worker);

        } catch (error) {
            console.log('捕获到异常');

            console.dir(error)
        }
        // log worker resource usage
        /*setInterval(async () => {
            const usage = await worker.getResourceUsage();

            console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
        }, 120000);*/
    }


}
interface  NewSocket extends SocketIO.Socket{
    room_id;
}

var personInServer = {}
io.on('connection',  (socket:NewSocket) => {


    socket.on('createRoom', async ({
                                       room_id
                                   }, callback) => {

        if (roomList.has(room_id)) {
            callback('already exists')
        } else {
            console.log('---created room--- ', room_id)
            let worker = await getMediasoupWorker();
            let room = new Room(room_id, worker, io)
            roomList.set(room_id, room);
            callback(room_id);
        }
    });

    socket.on('join', async ({
                           room_id,
                           name
                       }, cb) => {

        console.log('---user joined--- \"' + room_id + '\": ' + name)
        if (!roomList.has(room_id)) {
            return cb({
                error: 'room does not exist'
            })
        }
        // 获取进入房间之前的人
        let peers = roomList.get(room_id).getPeers();
        let peerInfos = new Array();
        for (let peerid of Array.from(peers.keys())) {
            peerInfos.push({
                socketid:peerid,
                name:peers.get(peerid).name
            });
        }

      
        roomList.get(room_id).addPeer(new Peer(socket.id, name));
        socket.room_id = room_id;
        
        roomList.get(room_id).broadCast(socket.id,'joined', {
            room_id:room_id,
            name:name,
            socketid:socket.id
        })
        let jsonObject = roomList.get(room_id).toJson();
        (jsonObject as any).socketid = socket.id;
        cb(jsonObject);
        
        socket.emit('othersInRoom',peerInfos)

    })

    socket.on('getProducers', () => {
        console.log(`---get producers--- name:${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        // send all the current producer to newly joined member
        if (!roomList.has(socket.room_id)){
            return
        }
        let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id)

        socket.emit('newProducers', producerList);
    });

    socket.on('getRouterRtpCapabilities', (_, callback) => {
       
        console.log(`---get RouterRtpCapabilities--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            callback(roomList.get(socket.room_id).getRtpCapabilities());
        } catch (e) {
            callback({
                error: e.message
            })
        }

    });

    socket.on('createWebRtcTransport', async (_, callback) => {
        console.log(`---create webrtc transport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            const {
                params
            } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

            callback(params);
        } catch (err) {
            console.error(err);
            callback({
                error: err.message
            });
        }
    });

    socket.on('connectTransport', async ({
        transport_id,
        dtlsParameters
    }, callback) => {
        console.log(`---connect transport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!roomList.has(socket.room_id)) return
        await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)

        callback('success')
    })

    socket.on('produce', async ({
        kind,
        rtpParameters,
        producerTransportId
    }, callback) => {

        if (!roomList.has(socket.room_id)) {
            return callback({ error: 'not is a room' })
        }

        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)
        console.log(`---produce--- type: ${kind} name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name} id: ${producer_id}`)
        callback({
            producer_id
        })
    })

    socket.on('consume', async ({
        consumerTransportId,
        producerId,
        rtpCapabilities
    }, callback) => {
        //TODO null handling
        let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities)
        console.log(`---consuming--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name} prod_id:${producerId} consumer_id:${params.id}`)
        callback(params);
    })

    socket.on('resume', async (data, callback) => {

        // await consumer.resume();
        callback();
    });

    socket.on('getMyRoomInfo', (_, cb) => {
        cb(roomList.get(socket.room_id).toJson())
    })
    /**
     * 断开连接，关掉窗口之类的
     */
    socket.on('disconnect', () => {
        console.log(`---disconnect--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!socket.room_id) return
        roomList.get(socket.room_id).removePeer(socket.id);
        try {
            let room = roomList.get(socket.room_id);
            console.log(`room.getPeers().size`,room.getPeers().size);
            
            if(room.getPeers().size  > 0){
                roomList.get(socket.room_id).broadCast(socket.id,'a user is disconnected',{
                    "sockerid":socket.id
                });
            };
           
        } catch (error) {
            
        }
    })

    socket.on('producerClosed', ({
        producer_id
    }) => {
        console.log(`---producer close--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
    })
    /**
     * 点击了退出房间
     */
    socket.on('exitRoom', async (_, callback) => {
        console.log(`---exit room--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!roomList.has(socket.room_id)) {
            callback({
                error: 'not currently in a room'
            })
            return
        }
        // close transports
        await roomList.get(socket.room_id).removePeer(socket.id)
        if (roomList.get(socket.room_id).getPeers().size === 0) {
            roomList.delete(socket.room_id)
        }

        socket.room_id = null
        callback('successfully exited room');
        try {
            let room = roomList.get(socket.room_id);
            if(room.getPeers().size  > 0){
                roomList.get(socket.room_id).broadCast(socket.id,'a user is exits the room',{
                    "sockerid":socket.id
                });
            };
           
        } catch (error) {
            
        }
    })
})

function room() {
    return Object.values(roomList).map(r => {
        return {
            router: r.router.id,
            peers: Object.values(r.peers).map(p => {
                // @ts-ignore
                return {
                    // @ts-ignore
                    name: p.name,
                }
            }),
            id: r.id
        }
    })
}

/**
 * Get next mediasoup Worker.
 */
function getMediasoupWorker() {
    const worker = workers[nextMediasoupWorkerIdx];
    console.log(`workers size = ` + workers.length);

    if (++nextMediasoupWorkerIdx === workers.length) {
        nextMediasoupWorkerIdx = 0;
    }

    return worker;
}
