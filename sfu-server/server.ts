const express = require('express');
import * as HTTP from 'http';
const app = express();
const https = require('httpolyglot');
const fs = require('fs');
const mediasoup = require('mediasoup');
const config = require('./config');
const path = require('path');
const Room = require('./Room');
const Peer = require('./Peer');


(async () => {
    await createWorkers()
})();


const options = {
    // key: fs.readFileSync(path.join(__dirname,config.sslKey), 'utf-8'),
    // cert: fs.readFileSync(path.join(__dirname,config.sslCrt), 'utf-8')
}
const http: HTTP.Server = new HTTP.Server(app);
// const httpsServer = https.createServer(options, app)
const io = require('socket.io')(http)

app.use(express.static(path.join(__dirname, '.', 'public')))

http.listen(config.listenPort, () => {
    console.log('listening https ' + config.listenPort)
})



// all mediasoup workers
let workers = []
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
let roomList = new Map()

    ;




async function createWorkers() {
    let {
        numWorkers
    } = config.mediasoup

    for (let i = 0; i < numWorkers; i++) {
        try {
            let worker = await mediasoup.createWorker({
                logLevel: config.mediasoup.worker.logLevel,
                logTags: config.mediasoup.worker.logTags,
                rtcMinPort: config.mediasoup.worker.rtcMinPort,
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort,
            })

            worker.on('died', () => {
                console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
                setTimeout(() => process.exit(1), 2000);
            })
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

var personInServer = {}
io.on('connection', socket => {

    socket.on('createRoom', async ({
                                       room_id
                                   }, callback) => {

        if (roomList.has(room_id)) {
            callback('already exists')
        } else {
            console.log('---created room--- ', room_id)
            let worker = await getMediasoupWorker();
            console.log("worker");

            console.log(worker);

            roomList.set(room_id, new Room(room_id, worker, io))
            callback(room_id)
        }
    })

    socket.on('join', ({
                           room_id,
                           name
                       }, cb) => {

        console.log('---user joined--- \"' + room_id + '\": ' + name)
        if (!roomList.has(room_id)) {
            return cb({
                error: 'room does not exist'
            })
        }
        roomList.get(room_id).addPeer(new Peer(socket.id, name))
        socket.room_id = room_id

        cb(roomList.get(room_id).toJson())
    })


    socket.on('create or join', async (event, callback) => {
        let room_id  = event.room;
        let personInRoom = { length: 0 };
        if (io.sockets.adapter.rooms.has(room_id)) {
            personInRoom = Array.from(io.sockets.adapter.rooms.get(room_id));
        }
        const clientSize = personInRoom.length;
        if (clientSize === 0) {
            socket.join(room_id);
            socket.emit('created', { "room": room_id, "socketId": socket.id, "personInRoom": Array.from(io.sockets.adapter.rooms.get(room_id)) });
            socket.broadcast.to(room_id).emit('new one enter', { "socketId": socket.id });
            socket.emit('new one enter', { "socketId": socket.id });
            personInServer[socket.id] = socket;

            let worker = await getMediasoupWorker();
            roomList.set(room_id, new Room(room_id, worker, io))


        } else if (clientSize <= 8) {
            socket.join(room_id);
            socket.emit('joined', { "room": room_id, "socketId": socket.id, "personInRoom": Array.from(io.sockets.adapter.rooms.get(room_id)) });
            socket.broadcast.to(room_id).emit('new one enter', { "socketId": socket.id });
            socket.emit('new one enter', { "socketId": socket.id });
            personInServer[socket.id] = socket;
            let worker = await getMediasoupWorker();
            roomList.set(room_id, new Room(room_id, worker, io));

                console.log('---user joined--- \"' + room_id + '\": ' + name)
                if (!roomList.has(room_id)) {
                    return cb({
                        error: 'room does not exist'
                    })
                }
                roomList.get(room_id).addPeer(new Peer(socket.id, name))
                socket.room_id = room_id
                cb(roomList.get(room_id).toJson())

        } else {
            console.log('error joining room');
            socket.emit('full', { "room": room_id, "socketId": socket.id });
        }

        // if (roomList.has(room_id)) {
        //     callback('already exists')
        // } else {
        //     console.log('---created room--- ', room_id)
        //     let worker = await getMediasoupWorker();
        //
        //     roomList.set(room_id, new Room(room_id, worker, io))
        //     callback(room_id)
        // }

    });

    // socket.on('join', ({
    //     room_id,
    //     name
    // }, cb) => {
    //
    //     console.log('---user joined--- \"' + room_id + '\": ' + name)
    //     if (!roomList.has(room_id)) {
    //         return cb({
    //             error: 'room does not exist'
    //         })
    //     }
    //     roomList.get(room_id).addPeer(new Peer(socket.id, name))
    //     socket.room_id = room_id
    //     cb(roomList.get(room_id).toJson())
    // })

    // 向房间里头的人说新来的已经准备好了
    socket.on('ready', event => {
        event.fromSocketId = socket.id;
        socket.broadcast.to(event.room).emit('ready', event);
    });

    socket.on('candidate', event => {
        let toSocketId = event.toSocketId;
        event.fromSocketId = socket.id
        event.toSocketId = toSocketId
        // socket.broadcast.to(event.room).emit('candidate', event);
        if (toSocketId && personInServer[toSocketId]) {
            personInServer[toSocketId].emit('candidate', event);
        }
    });
    /**
     * 向新来的人提示创建连接
     */
    socket.on('offer', event => {
        let toSocketId = event.toSocketId;
        event.sdp.fromSocketId = socket.id;
        event.sdp.fromNickName = event.fromNickName;
        // socket.broadcast.to(event.room).emit('offer', event.sdp);
        if (toSocketId && personInServer[toSocketId]) {
            personInServer[toSocketId].emit('offer', event.sdp);
        }
    });

    socket.on('answer', event => {
        let toSocketId = event.toSocketId;
        event.sdp.fromSocketId = socket.id
        // socket.broadcast.to(event.room).emit('answer', event.sdp);
        if (toSocketId && personInServer[toSocketId]) {
            personInServer[toSocketId].emit('answer', event.sdp);
        }
    });
    // 用户退出房间
    socket.on('out of room', event => {
        event.fromSocketId = socket.id;
        socket.broadcast.to(event.room).emit('out of room', event);
        socket.leave(event.room);
        let hasRoom = io.sockets.adapter.rooms.has(event.room)
        if (!hasRoom) {

            // axios.get(config.javaLoginServer + "/recycleRoom.json?roomNumber=" + event.room)
            //     .then(function (res) {
            //
            //     }).then(error => {
            //
            // });
        }
    });


    socket.on('getProducers', () => {
        console.log(`---get producers--- name:${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        // send all the current producer to newly joined member
        if (!roomList.has(socket.room_id)) return
        let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id)

        socket.emit('newProducers', producerList)
    })

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
        callback(params)
    })

    socket.on('resume', async (data, callback) => {

        // await consumer.resume();
        callback();
    });

    socket.on('getMyRoomInfo', (_, cb) => {
        cb(roomList.get(socket.room_id).toJson())
    })

    socket.on('disconnect', () => {
        console.log(`---disconnect--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        if (!socket.room_id) return
        roomList.get(socket.room_id).removePeer(socket.id)
    })

    socket.on('producerClosed', ({
        producer_id
    }) => {
        console.log(`---producer close--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
    })

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


        callback('successfully exited room')
    })
})

// function room() {
//     return Object.values(roomList).map(r => {
//         return {
//             router: r.router.id,
//             peers: Object.values(r.peers).map(p => {
//                 return {
//                     name: p.name,
//                 }
//             }),
//             id: r.id
//         }
//     })
// }

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
