import { Consumer } from "mediasoup/node/lib/Consumer";
import { Producer } from "mediasoup/node/lib/Producer";
import {
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/RtpParameters";
import {
  DtlsParameters,
  WebRtcTransport,
} from "mediasoup/node/lib/WebRtcTransport";
/**
 * 房间里头的人
 */
export default class Peer {
  /**
   * 连接的socket的id
   */
  public id: string;
  /**
   * 连接socket的名
   */
  public name: string;

  public transports: Map<string, WebRtcTransport>;

  public consumers: Map<string, Consumer>;

  public producers: Map<string, Producer>;

  constructor(socketId: string, name = "unknow") {
    this.id = socketId;
    this.name = name;
    this.transports = new Map<string, WebRtcTransport>();
    this.consumers = new Map<string, Consumer>();
    this.producers = new Map<string, Producer>();
  }

  addTransport(transport: WebRtcTransport) {
    this.transports.set(transport.id, transport);
  }

  async connectTransport(transportId: string, dtlsParameters: DtlsParameters) {
    if (!this.transports.has(transportId)) return;
    const transport = this.transports.get(transportId);
    if (transport) {
      await transport.connect({
        dtlsParameters: dtlsParameters,
      });
    }
  }

  async createProducer(
    producerTransportId: string,
    rtpParameters: RtpParameters,
    kind: MediaKind,
    producerSocketId?: any
  ): Promise<Producer> {
    console.log(
      `createProducer`,
      producerTransportId,
      rtpParameters,
      kind,
      producerSocketId
    );

    //TODO handle null errors
    let producer: Producer = await (
      this.transports.get(producerTransportId) as WebRtcTransport
    ).produce({
      kind,
      rtpParameters,
    });
    // @ts-ignore 额外添加属性
    producer.producer_socket_id = producerSocketId;
    this.producers.set(producer.id, producer);

    // producer.on('transportclose', function () {
    //     console.log(`---producer transport close--- name: ${this.name} consumer_id: ${producer.id}`)
    //     producer.close()
    //     this.producers.delete(producer.id)
    // }.bind(this))
    producer.on("transportclose", () => {
      console.log(
        `---producer transport close--- name: ${this.name} consumer_id: ${producer.id}`
      );
      producer.close();
      this.producers.delete(producer.id);
    });

    return producer;
  }

  async createConsumer(
    consumerTransportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities
  ) {
    const consumerTransport = this.transports.get(consumerTransportId);
    if (consumerTransport) {
      let consumer: Consumer;
      try {
        consumer = await consumerTransport.consume({
          producerId: producerId,
          rtpCapabilities,
          paused: false, //producer.kind === 'video',
        });
      } catch (error) {
        console.error("consume failed", error);
        return;
      }

      if (consumer.type === "simulcast") {
        await consumer.setPreferredLayers({
          spatialLayer: 2,
          temporalLayer: 2,
        });
      }

      this.consumers.set(consumer.id, consumer);

      // consumer.on('transportclose', function () {
      //     console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`)
      //     this.consumers.delete(consumer.id)
      // }.bind(this))

      consumer.on("transportclose", () => {
        console.log(
          `---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`
        );
        this.consumers.delete(consumer.id);
      });
      return {
        consumer,
        params: {
          producerId: producerId,
          id: consumer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          type: consumer.type,
          producerPaused: consumer.producerPaused,
        },
      };
    }
  }

  closeProducer(producerId: string) {
    const producer = this.producers.get(producerId);
    if (producer) {
      try {
        producer.close();
      } catch (e) {
        console.warn(e);
      }
      this.producers.delete(producerId);
    }
  }

  async pauseProducer(producerId: string) {
    const producer = this.producers.get(producerId);
    if (producer) {
      try {
        await producer.pause();
      } catch (e) {
        console.error(e);
      }
    }
  }

  async resumeProducer(producerId: string) {
    const producer = this.producers.get(producerId);
    if (producer) {
      try {
        await producer.resume();
      } catch (e) {
        console.error(e);
      }
    }
  }

  getConsumer(consumerId: string) {
    return this.consumers.get(consumerId);
  }

  getProducer(producerId: string) {
    return this.producers.get(producerId);
  }

  close() {
    this.transports.forEach((transport) => transport.close());
  }

  removeConsumer(consumerId: string) {
    this.consumers.delete(consumerId);
  }
}
