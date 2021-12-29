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
import { Logger } from 'mediasoup/src/Logger';
const bodyParser = require('body-parser');
(async () => {
    await createWorkers()
})();

const app = express();

// 
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

/**
 * 生成一个没有使用的房间号码
 */
app.get('/createValidRoomId', (req, resp) => {
    resp.send({ roomId: createValidRoomId() });
});
/**
 * 用于查询房间号码是否存在
 */
app.post('/isRoomExisted', (req, resp) => {
    try {
        // 解构赋值
        let { roomId } = req.body;
        if (Array.from(roomList.keys()).includes(roomId)) {
            resp.status(200).json({ existed: true });
        } else {
            resp.status(200).json({ existed: false });
        }
    } catch (error) {
        resp.status(500).json({ error });
    }
});

app.use(express.static(path.join(__dirname, '.', 'public')));
/**
 * 启动完成之后,打印端口
 */
http.listen(config.listenPort, () => {
    console.log('listening port at ' + config.listenPort)
});



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

/**
 * worker代表一个mediasoup c++子进程，它运行在单个CPU内核中，并处理Router实例
 * 创建mediasoup的worker
 * https://mediasoup.org/documentation/v3/mediasoup/api/
 */
async function createWorkers() {

    console.log("medisoup version is %s", mediasoup.version);
    const rtpCapabilities = mediasoup.getSupportedRtpCapabilities();
    console.log(rtpCapabilities);

    mediasoup.observer.on("newworker", (worker) => {
        console.log("new worker created [pid:%d]", worker.pid);
    });



    let {
        numWorkers
    } = config.mediasoup
    // numWorkers 一般等于线程数
    console.log(`create  ${numWorkers} workers `)

    for (let i = 0; i < numWorkers; i++) {
        try {

            // mediasoup.observer.on("newworker", (worker) => {
            //     console.log("new worker created [pid:%d]", worker.pid);
            // });

            let worker = await mediasoup.createWorker({
                logLevel: config.mediasoup.worker.logLevel,  // debug,warn,error,none
                logTags: config.mediasoup.worker.logTags, // 用于调试的日志标签。检查调试文档中的可用标记列表
                rtcMinPort: config.mediasoup.worker.rtcMinPort, //为ICE, DTLS, RTP等提供最小RTC端口。默认10000
                rtcMaxPort: config.mediasoup.worker.rtcMaxPort, // 默认59999
                // dtlsCertificateFile : "/home/foo/dtls-cert.pem", // PEM格式的DTLS公共证书文件路径。如果不设置，则动态创建证书。
                // dtlsPrivateKeyFile  : "/home/foo/dtls-key.pem"
                appData: {
                    world: "世界"       // 自定义应用程序数据。
                }
            });

            worker.on('died', (error) => {
                console.error('mediasoup worker died, exiting in 2 seconds... [pid:%d]', worker.pid);
                console.error("mediasoup worker died!: %o", error);
                setTimeout(() => process.exit(1), 2000);
            });
            // 创建新路由器时触发。
            // worker.observer.on("newrouter", (router) => {
            //     console.log("new router created [id:%s]", router.id);
            // });
            // worker.updateSettings({ logLevel: "warn" })
            //@ts-ignore
            workers.push(worker);

            // 打印日志
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
/**
 * 通过socketio创建websocket
 */
io.on('connection', (socket: NewSocket) => {

    /**
     * 监听 创建房间
     */
    socket.on('createRoom', async ({
        room_id
    }, callback) => {
        console.dir('---try create room ---');
        try {
            // 保证在传输了房间号之后再处理
            if (room_id) {
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
            console.error("创建房间异常", error);
        }
    });
    /**
     *  加入房间
     */
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
            setTimeout(() => {
                socket.emit('othersInRoom', peerInfos);
            }, 1);
        } catch (error) {
            console.error(error);
        }



    })
    /**
     * 监听消息  获取生产者
     */
    socket.on('getProducers', () => {
        console.log(`---get producers--- name:${roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
        // send all the current producer to newly joined member
        if (!roomList.has(socket.room_id)) {
            return
        }
        let producerList = roomList.get(socket.room_id).getProducerListForPeer(socket.id)

        socket.emit('newProducers', producerList);
    });

    /**
     * 获取路由能力，编码器和解码器的相关信息
     */
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
     * @deprecated
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
     * @deprecated
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

    /**
     * 监听消息  连接传输通道
     */
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

    /**
     * 监听消息  开始生产
     */
    socket.on('produce', async ({
        kind,
        rtpParameters,
        producerTransportId
    }, callback) => {

        console.log(`---produce --- kind = ${kind}`);
        console.log(`---produce --- rtpParameters = ${JSON.stringify(rtpParameters)}`);
        console.log(`---produce --- producerTransportId = ${producerTransportId}`);


        if (!roomList.has(socket.room_id)) {
            return callback && callback({ error: 'not is a room' })
        }

        let producer_id = await roomList.get(socket.room_id).produce(socket.id, producerTransportId, rtpParameters, kind)
        console.log(`---produce--- type: ${kind} name: ${roomList.get(socket.room_id).getPeers().get(socket.id).name} id: ${producer_id}`)


        if (callback) {
            callback({
                producer_id
            })
        } else {
            socket.emit('produce callback', {
                producer_id
            })
        }
    })
    /**
     * 监听消息 开始消费
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

        if (typeof rtpCapabilities == 'string') {
            try {
                rtpCapabilities = JSON.parse(rtpCapabilities);
            } catch (error) {

            }
        }

        try {
            let params = await roomList.get(socket.room_id).consume(socket.id, consumerTransportId, producerId, rtpCapabilities);
            console.log(`---consuming--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name} prod_id:${producerId} consumer_id:${params.id}`)
            if (callback) {
                callback(params);
            } else {
                (params as any).peerId = socket.id;
                socket.emit('consume callback', params);
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
            console.log(`room[${socket.room_id}].getPeers().size`, room.getPeers().size);

            if (room.getPeers().size > 0) {
                roomList.get(socket.room_id).broadCast(socket.id, 'a user is disconnected', {
                    "sockerid": socket.id
                });
            }

        } catch (error) {

        }
    });

    /**
     * 监听消息 生产关闭，就是不再传输音频和视频流了
     */
    socket.on('producerClosed', ({
        producer_id
    }) => {
        console.log(`---producer close--- producer_id = ${producer_id}`);

        try {
            console.log(`---producer close--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            roomList.get(socket.room_id).closeProducer(socket.id, producer_id)
        } catch (error) {
            console.error(error);

        }

    })
    /**
     * 暂停生产
     */
    socket.on('pauseProducer', ({ producer_id }, callback) => {
        try {
            console.log(`---producer pause--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            producer_id && roomList.get(socket.room_id).pauseProducer(socket.id, producer_id);
            callback && callback("success")
        } catch (error) {
            console.error(error);
        }
    })

    /**
     * 继续生产
     */
    socket.on('resumeProducer', ({ producer_id }, callback) => {
        try {
            console.log(`---producer resume--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            producer_id && roomList.get(socket.room_id).resumeProducer(socket.id, producer_id);
            callback && callback("success")
        } catch (error) {
            console.error(error);
        }
    })

    /**
     * 暂停消费
     */
    socket.on('pauseConsumer', ({ consumer_id }, callback) => {
        if (consumer_id) {
            console.log(`---consumer pause--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            let consumer = roomList.get(socket.room_id).getPeers().get(socket.id).getConsumer(consumer_id);
            if (consumer) {
                consumer.pause();
                callback("success");
            }
        }
    });

    /**
     * 继续消费
     */
    socket.on('resumeConsumer', ({ consumer_id }, callback) => {
        if (consumer_id) {
            console.log(`---consumer resume--- name: ${roomList.get(socket.room_id) && roomList.get(socket.room_id).getPeers().get(socket.id).name}`)
            let consumer = roomList.get(socket.room_id).getPeers().get(socket.id).getConsumer(consumer_id);
            if (consumer) {
                consumer.resume();
                callback("success");
            }
        }
    });


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

        try {
            let room = roomList.get(socket.room_id);
            if (room.getPeers().size > 0) {
                roomList.get(socket.room_id).broadCast(socket.id, 'a user is exits the room', {
                    "sockerid": socket.id
                });
            };

        } catch (error) {

        }
        socket.room_id = null
        callback('successfully exited room');
    });

    socket.on('restartIce', async ({ transport_id }, callback) => {

        try {
            console.log(`---restartIce---transport_id = ` + transport_id)
            const transport = roomList.get(socket.room_id).getPeers().get(socket.id).transports.get(transport_id);

            if (transport) {

                const iceParameters = await transport.restartIce();
                console.log(`---restartIce --- iceParameters = ${iceParameters}`);

                callback(iceParameters);
            } else {
                console.log(`transport unknow`)
            }
        } catch (error) {

        }
    });
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
 *通过轮询的方式 获取worker
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
function randomNumber(time = 9): string {
    let str = '0123456789';
    let result = '';
    for (let i = 0; i < time; i++) {

        result += str.charAt(parseInt((Math.random() * 10) + ""));
    }
    return result;
}
/**
 *
 * @returns 生成房间号
 */
function createValidRoomId(): string {

    let number = randomNumber();
    let roomIds = Array.from(roomList.keys());

    while (testRoomId(number)) {
        number = randomNumber();
    }
    return number;

    function testRoomId(_number) {
        if (roomIds.includes(_number)) {
            return true;
        } else {
            return false;
        }
    }
}
