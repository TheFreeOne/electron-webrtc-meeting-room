const config = require("./config");
import * as SocketIO from "socket.io";
import Peer from "./Peer";
import { Worker } from "mediasoup/node/lib/Worker";
import { Router } from "mediasoup/node/lib/Router";
import {
  DtlsParameters,
  DtlsState,
  WebRtcTransport,
} from "mediasoup/node/lib/WebRtcTransport";
import {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/RtpParameters";
import {
  AudioLevelObserver,
  AudioLevelObserverVolume,
} from "mediasoup/node/lib/AudioLevelObserver";

export default class Room {
  /**
   * 房间的号码
   */
  private id: string;

  private peers: Map<string, Peer>;

  private io: SocketIO.Server;

  private router?: Router;

  private audioLevelObserver?: AudioLevelObserver;

  constructor(room_id: string, worker: Worker, io: SocketIO.Server) {
    this.id = room_id;
    const mediaCodecs = config.mediasoup.router.mediaCodecs;
    worker
      .createRouter({
        mediaCodecs,
      })
      .then(async (router) => {
        this.router = router;
        this.audioLevelObserver = await router.createAudioLevelObserver({
          maxEntries: 1,
          threshold: -70,
          interval: 1000,
        });

        this.audioLevelObserver.on(
          "volumes",
          (volumes: AudioLevelObserverVolume[]) => {
            const { producer, volume } = volumes[0];
            console.info("audio-level volumes event");
            console.log("producer = ", producer.id);
            console.log("volume = ", volume);
          }
        );
        this.audioLevelObserver.on("silence", () => {
          console.info("audio-level silence event");
        });
        this.audioLevelObserver.on("@close", () => {
          console.info("audio-level @close event");
        });

        this.audioLevelObserver.on("routerclose", () => {
          console.info("audio-level routerclose event");
        });
      });

    this.peers = new Map();
    this.io = io;
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  getProducerListForPeer(socketId: string) {
    let producerList = [] as any[];
    this.peers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producerList.push({
          producer_id: producer.id,
          // 兼容写法
          peerId: peer.id,
          // @ts-ignore 获取额外添加的属性
          producer_socket_id: producer.producer_socket_id,
        });
      });
    });
    return producerList;
  }

  getRtpCapabilities(): RtpCapabilities | undefined {
    if (this.router) {
      return this.router.rtpCapabilities;
    }
    return undefined;
  }

  async createWebRtcTransport(socketId: string) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } =
      config.mediasoup.webRtcTransport;
    // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
    if (this.router === undefined) {
      return;
    }
    const transport: WebRtcTransport = await this.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps, // 监听IP地址或优先顺序的地址(第一个是首选的)
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate, //初始可用的输出比特率(以bps为单位)。
      enableSctp: false,
    });
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {}
    }

    transport.on("dtlsstatechange", (dtlsState: DtlsState) => {
      if (dtlsState === "closed") {
        console.log(
          "---transport close--- " + this.peers.get(socketId)?.name + " closed"
        );
        transport.close();
      }
    });

    // transport.on('close', function() {
    //     console.log('---transport close--- ' + this.peers.get(socket_id).name + ' closed')
    // })
    console.log("---adding transport---", transport.id);
    this.peers.get(socketId)?.addTransport(transport);
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
      },
    };
  }

  async connectPeerTransport(
    socketId: string,
    transportId: string,
    dtlsParameters: DtlsParameters
  ) {
    if (!this.peers.has(socketId)) return;
    const peer = this.peers.get(socketId);
    if (peer) {
      await peer.connectTransport(transportId, dtlsParameters);
    }
  }

  async produce(
    socketId: string,
    producerTransportId: string,
    rtpParameters: RtpParameters,
    kind: MediaKind
  ) {
    return new Promise(async (resolve: any, reject: any) => {
      let producer = await (this.peers.get(socketId) as Peer).createProducer(
        producerTransportId,
        rtpParameters,
        kind,
        socketId
      );
      resolve(producer.id);
      this.broadCast(socketId, "newProducers", [
        {
          producer_id: producer.id,
          producer_socket_id: socketId,
        },
      ]);
    });
  }

  async consume(
    socketId: string,
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    // handle nulls
    if (this.router === undefined) {
      return;
    }
    if (
      !this.router.canConsume({
        producerId: producerId,
        rtpCapabilities,
      })
    ) {
      console.error("can not consume");
      return;
    }
    const peer = this.peers.get(socketId);
    if (peer) {
      const result = await peer.createConsumer(
        consumerTransportId,
        producerId,
        rtpCapabilities
      );
      if (result) {
        const { consumer, params } = result;
        consumer.on("producerclose", () => {
          console.log(
            `---consumer closed--- due to producerclose event  name:${
              this.peers.get(socketId)?.name
            } consumer_id: ${consumer.id}`
          );
          this.peers.get(socketId)?.removeConsumer(consumer.id);
          // tell client consumer is dead
          this.io.to(socketId).emit("consumerClosed", {
            consumer_id: consumer.id,
          });
        });

        consumer.on("producerpause", () => {
          // tell client consumer is pause
          console.dir(`---producerpause---`);
          this.io.to(socketId).emit("consumerPaused", {
            consumer_id: consumer.id,
          });
        });

        consumer.on("producerresume", () => {
          // tell client consumer is resume
          console.dir(`---producerresume---`);
          this.io.to(socketId).emit("consumerResumed", {
            consumer_id: consumer.id,
          });
        });
        return params;
      }
    }
  }
  /**
   *
   * @param socketId 移除人员
   */
  async removePeer(socketId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.close();
    }
    this.peers.delete(socketId);
  }

  closeProducer(socketId: string, producerId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      peer.closeProducer(producerId);
    }
  }

  async pauseProducer(socketId: string, producer_id: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      await peer.pauseProducer(producer_id);
    }
  }

  async resumeProducer(socketId: string, producerId: string) {
    const peer = this.peers.get(socketId);
    if (peer) {
      await peer.resumeProducer(producerId);
    }
  }

  broadCast(socketId: string, name: any, data: any) {
    for (let otherID of Array.from(this.peers.keys()).filter(
      (id) => id !== socketId
    )) {
      this.send(otherID, name, data);
    }
  }

  send(socketId: string, name: any, data: any) {
    this.io.to(socketId).emit(name, data);
  }

  getPeers() {
    return this.peers;
  }

  toJson() {
    return {
      id: this.id,
      // @ts-ignore
      peers: JSON.stringify([...this.peers]),
    };
  }
}
