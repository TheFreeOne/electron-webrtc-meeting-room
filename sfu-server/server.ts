import * as  express from 'express';
import * as HTTP from 'http';
// const https = require('httpolyglot');
import * as fs from 'fs'
import * as mediasoup from 'mediasoup';
const config = require('./config');
import * as path from 'path';
import Room from './Room';
import Peer from './Peer';
import * as SocketIO from 'socket.io';
import { Worker } from 'mediasoup/src/Worker';
const bodyParser = require('body-parser');
(async () => {
    await createWorkers()
})();

const app = express();
const options = {
    // key: fs.readFileSync(path.join(__dirname,config.sslKey), 'utf-8'),
    // cert: fs.readFileSync(path.join(__dirname,config.sslCrt), 'utf-8')
}
const http: HTTP.Server = new HTTP.Server(app);
// const httpsServer = https.createServer(options, app)
 

const io: SocketIO.Server = require('socket.io')(http);
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.get('/createValidRoomId',(req,resp)=>{
    resp.send({ roomId: createValidRoomId() });
});

app.post('/isRoomExisted',(req,resp)=>{
  try {
    //   console.log(req.query)
    // console.log(req.params)
    let {roomId }=req.body;
    // console.log(req.get('Origin'))
    // console.log(req.url)

    if(Array.from(roomList.keys()).includes(roomId)){
        resp.status(200).json({existed:true});
    }else{
        resp.status(200).json({existed:false});
    }
  } catch (error) {
     resp.status(500).json({error}); 
  }
});

app.use(express.static(path.join(__dirname, '.', 'public')));

http.listen(config.listenPort, () => {
    console.log('listening https ' + config.listenPort)
});


// all mediasoup workers
// let workers = new Array<mediasoup.types.Worker>();
let workers = new Array<Worker>();
let nextMediasoupWorkerIdx = 0;

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
let roomList = new Map<string, Room>();

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

            try {
                // setInterval(async () => {
                //     const usage = await worker.getResourceUsage();
                //     console.info('mediasoup Worker resource usage [pid:%d]: %o', worker.pid, usage);
                // }, 120000);
            } catch (error) {
                
            }
             
        } catch (error) {
            console.log('捕获到异常');

            console.dir(error);
        }
      
    }


}
interface NewSocket extends SocketIO.Socket {
    /**
     * 给连接的添加房间号
     */
    room_id;
}

io.on('connection', (socket: NewSocket) => {

    // 创建房间
    socket.on('createRoom', async ({
        room_id
    }, callback) => {
        console.dir('---try create room ---');
        try {
            // 保证在传输了房间号之后再处理
            if(room_id){
                if (roomList.has(room_id)) {
                    if (callback) {
                        callback('already exists');
                    } else {
                        socket.emit('createRoom callback', 'already exists')
                    }
    
                } else {
                    console.log('---created room--- ', room_id)
                    let worker = await getMediasoupWorker();
                    let room = new Room(room_id, worker, io)
                    roomList.set(room_id, room);
                    if (callback) {
                        callback(room_id);
                    } else {
                        socket.emit('createRoom callback', room_id)
                    }
                }
            }
        } catch (error) {
            console.error(error);

        }
    });
    // 加入房间
    socket.on('join', ({
        room_id,
        name
    }, cb) => {
        console.log(cb);

        try {
            console.log('---user joined--- \"' + room_id + '\": ' + name)
            if (!roomList.has(room_id)) {
                if (cb) {
                    return cb({
                        error: 'room does not exist'
                    });
                } else {
                    socket.emit('join callback', {
                        error: 'room does not exist'
                    });
                }

            }
            // 获取进入房间之前的人
            let peers = roomList.get(room_id).getPeers();
            let peerInfos = new Array();
            for (let peerid of Array.from(peers.keys())) {
                peerInfos.push({
                    socketid: peerid,
                    name: peers.get(peerid).name
                });
            }

            roomList.get(room_id).addPeer(new Peer(socket.id, name));
            socket.room_id = room_id;
            // 广播
            roomList.get(room_id).broadCast(socket.id, 'joined', {
                room_id: room_id,
                name: name,
                socketid: socket.id
            });
            let jsonObject = roomList.get(room_id).toJson();
            (jsonObject as any).socketid = socket.id;
            if (cb) {
                cb(jsonObject);
            } else {
                socket.emit('join callback', jsonObject);
            }

            socket.emit('othersInRoom', peerInfos)
        } catch (error) {
            console.error(error);
        }



    })
 
    socket.on('getProducers', () => {
        console.log(`---get producers--- name:${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        // send all the current producer to newly joined member
        if (!roomList.has(socket.room_id)) {
            return
        }
        let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id)

        socket.emit('newProducers', producerList);
    });

    socket.on('getRouterRtpCapabilities', (_, callback) => {

        console.log(`---get RouterRtpCapabilities--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            if (callback) {
                callback(roomList.get(socket.room_id).getRtpCapabilities());
            } else {
                socket.emit('getRouterRtpCapabilities callback', roomList.get(socket.room_id).getRtpCapabilities());
            }
        } catch (e) {
            callback && callback({
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

            if (callback) {
                callback(params);
            } else {
                socket.emit('createWebRtcTransport callback', params)
            }

        } catch (err) {
            console.error(err);
            callback && callback({
                error: err.message
            });
        }
    });
    /**
     * 异步的写法
     * 一般情况下只要createWebRtcTransport就可以了
     */
    socket.on('createSendTransport', async (_, callback) => {
        console.log(`---createSendTransport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            const {
                params
            } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

            if (callback) {
                callback(params);
            } else {
                socket.emit('createSendTransport callback', params)
            }
            
        } catch (err) {
            console.error(err);
            callback && callback({
                error: err.message
            });
        }
    });

    /**
     * 异步的写法
     * 一般情况下只要createWebRtcTransport就可以了
     */
    socket.on('createRecvTransport', async (_, callback) => {
        console.log(`---createRecvTransport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        try {
            const {
                params
            } = await roomList.get(socket.room_id).createWebRtcTransport(socket.id);

            if (callback) {
                callback(params);
            } else {
                socket.emit('createRecvTransport callback', params)
            }
            
        } catch (err) {
            console.error(err);
            callback && callback({
                error: err.message
            });
        }
    });

    socket.on('connectTransport', async ({
        transport_id,
        dtlsParameters
    }, callback) => {

        try {
            console.log(`---connect transport--- name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            console.log(`---connect transport--- transport_id: ${transport_id}`)
            console.log(`---connect transport--- dtlsParameters: ${dtlsParameters}`)
            if (!roomList.has(socket.room_id)) return
            await roomList.get(socket.room_id).connectPeerTransport(socket.id, transport_id, dtlsParameters)

            callback && callback('success')
            console.log(`---connectTransport success---`);
            
        } catch (error) {
            console.error(error);
        }

    })

    socket.on('produce', async ({
        kind,
        rtpParameters,
        producerTransportId
    }, callback) => {

        console.log(`---produce --- kind = ${kind}` );
        console.log(`---produce --- rtpParameters = ${JSON.stringify(rtpParameters)}` );
        console.log(`---produce --- producerTransportId = ${producerTransportId}` );
        

        if (!roomList.has(socket.room_id)) {
            return callback && callback({ error: 'not is a room' })
        }

        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)
        console.log(`---produce--- type: ${kind} name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name} id: ${producer_id}`)
       

        if(callback){
            callback({
                producer_id
            })
        }else{
            socket.emit('produce callback',{
                producer_id
            })
        }
    })
    /**
     * 开始消费
     */
    socket.on('consume', async ({
        consumerTransportId,
        producerId,
        rtpCapabilities
    }, callback) => {
        //TODO null handling
        // console.log(`---consume consumerTransportId = ${consumerTransportId}`);
        // console.log(`---consume producerId = ${producerId}`);
        // console.log(`---consume rtpCapabilities = ${rtpCapabilities}`);
        
        if(typeof rtpCapabilities == 'string'){
            try {
                rtpCapabilities = JSON.parse(rtpCapabilities);
            } catch (error) {
                
            }
        }
        
        try {
            let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities);
            console.log(`---consuming--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name} prod_id:${producerId} consumer_id:${params.id}`)
            if(callback){
                callback(params);
            }else{
                (params as any).peerId = socket.id;
                socket.emit('consume callback',params);
            }
        } catch (error) {
            console.error(error);

        }
    })

    socket.on('resume', async (data, callback) => {

        // await consumer.resume();
        callback();
    });

    socket.on('getMyRoomInfo', (_, cb) => {
        try {
            cb(roomList.get(socket.room_id).toJson())
        } catch (error) {
            console.error(error);
        }
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
            console.log(`room.getPeers().size`, room.getPeers().size);

            if (room.getPeers().size > 0) {
                roomList.get(socket.room_id).broadCast(socket.id, 'a user is disconnected', {
                    "sockerid": socket.id
                });
            }
             
        } catch (error) {

        }
    })

    socket.on('producerClosed', ({
        producer_id
    }) => {
        try {
            console.log(`---producer close--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
        } catch (error) {
            console.error(error);

        }

    })
    /**
     * 点击了退出房间,此时检测并销毁房间
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
            if (room.getPeers().size > 0) {
                roomList.get(socket.room_id).broadCast(socket.id, 'a user is exits the room', {
                    "sockerid": socket.id
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
/**
 * 
 * @param time 生成随机号码
 * @returns 
 */
function randomNumber(time = 9):string{
    let str = '0123456789';
    let result = '';
    for(let i = 0;i<time ;i++){
        
        result += str.charAt(parseInt((Math.random() * 10)+""));
    }
    return result;
}
/**
 * 
 * @returns 生成房间号
 */
function createValidRoomId():string {

    let number = randomNumber();
    let roomIds = Array.from(roomList.keys());

    while(testRoomId(number)){
        number = randomNumber();
    }
    return number;

    function testRoomId(_number){
        if(roomIds.includes(_number)){
            return true;
        }else{
            return false;
        }
    }
}