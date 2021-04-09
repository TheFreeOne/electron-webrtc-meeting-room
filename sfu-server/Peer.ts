import { Consumer } from "mediasoup/src/Consumer";
import { Producer } from "mediasoup/src/Producer";
import { WebRtcTransport } from "mediasoup/src/WebRtcTransport";

export default  class Peer {

    public id;
    public name ;
    public transports:Map<any,WebRtcTransport> ;
    public consumers:Map<any,Consumer> ;
    public producers:Map<any,Producer> ;

    constructor(socket_id, name) {
        this.id = socket_id
        this.name = name
        this.transports = new Map<any,WebRtcTransport>()
        this.consumers = new Map()
        this.producers = new Map<any,Producer>()
    }


    addTransport(transport:WebRtcTransport) {
        this.transports.set(transport.id, transport)
    }

    async connectTransport(transport_id, dtlsParameters) {
        if (!this.transports.has(transport_id)) return
        await this.transports.get(transport_id).connect({
            dtlsParameters: dtlsParameters
        });
    }

    async createProducer(producerTransportId, rtpParameters, kind,producer_socket_id?):Promise<Producer> {
        // console.log(`createProducer`,producerTransportId, rtpParameters, kind,producer_socket_id);
        
        //TODO handle null errors
        let producer:Producer = await (this.transports.get(producerTransportId) as  WebRtcTransport).produce({
            kind,
            rtpParameters 
        })
        // @ts-ignore 额外添加属性
        producer.producer_socket_id = producer_socket_id;
        this.producers.set(producer.id, producer)

        producer.on('transportclose', function() {
            console.log(`---producer transport close--- name: ${this.name} consumer_id: ${producer.id}`)
            producer.close()
            this.producers.delete(producer.id)

        }.bind(this))

        return producer;
    }

    async createConsumer(consumer_transport_id, producer_id, rtpCapabilities)  {
        let consumerTransport = this.transports.get(consumer_transport_id)
    
        let consumer:Consumer = null
        try {
            consumer = await consumerTransport.consume({
                producerId: producer_id,
                rtpCapabilities,
                paused: false //producer.kind === 'video',
            });
        } catch (error) {
            console.error('consume failed', error);
            return;
        }

        if (consumer.type === 'simulcast') {
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            });
        }

        this.consumers.set(consumer.id, consumer)

        consumer.on('transportclose', function() {
            console.log(`---consumer transport close--- name: ${this.name} consumer_id: ${consumer.id}`)
            this.consumers.delete(consumer.id)
        }.bind(this))



        return {
            consumer,
            params: {
                producerId: producer_id,
                id: consumer.id,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
                type: consumer.type,
                producerPaused: consumer.producerPaused
            }
        }
    }

    closeProducer(producer_id) {
        try {
            this.producers.get(producer_id).close()
        } catch(e) {
            console.warn(e)
        }


        this.producers.delete(producer_id)
    }

    getProducer(producer_id) {
        return this.producers.get(producer_id)
    }

    close() {
        this.transports.forEach(transport => transport.close())
    }

    removeConsumer(consumer_id) {
        this.consumers.delete(consumer_id)
    }

     

} 
