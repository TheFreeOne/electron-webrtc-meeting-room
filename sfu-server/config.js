const os = require('os')

module.exports = {
  listenIp: '0.0.0.0',
  listenPort: 3016,
  // 证书，目前不需要
  // sslCrt: '../ssl/cert.pem',
  // sslKey: '../ssl/key.pem',

  mediasoup: {
    // 获取的是处理器的线程数量，比如电脑是六核十二线程，那么就是12
    numWorkers: Object.keys(os.cpus()).length,
    worker: {
      logLevel: 'warn',
      logTags: [
        'info', // 关于软件/库版本、配置和进程信息的日志。
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
        'rtx',
        'bwe',
        'score',
        'simulcast',
        'svc',
        'sctp',
        'message' // 消息日志(包括SCTP消息和直连消息)。
      ],
      rtcMinPort: process.env.MEDIASOUP_MIN_PORT || 10000,
      rtcMaxPort: process.env.MEDIASOUP_MAX_PORT || 10100
    },
    // Router settings
    router: {
      mediaCodecs: [
        // https://github.com/haiyangwu/mediasoup-client-android/issues/36#issuecomment-768499443
        {
          kind: 'audio',
          mimeType: 'audio/PCMU',
          preferredPayloadType: 0,
          clockRate: 8000
        },
        {
          kind: 'audio',
          mimeType: 'audio/PCMA',
          preferredPayloadType: 8,
          clockRate: 8000
        },
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 2,
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1,
            'x-google-start-bitrate': 1000
          }
        }
      ]
    },
    // WebRtcTransport 主要用来进行 client 端 与 mediasoup server 端 Router 进行通讯。
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.publicIp || '192.168.0.142' // replace by public IP address
        }
      ],
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      maxIncomingBitrate: 1500000,
      initialAvailableOutgoingBitrate: 1000000
    }
    // PlainTransport 主要用于 RTP/RTCP （或者采用安全的srtp）以及 SCTP(DataChannel)的通讯连接。
    // ,  plainTransportOptions: {
    //         listenIp:
    //             {
    //                 ip: process.env.MEDIASOUP_LISTEN_IP || '1.2.3.4',
    //                 announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP|| '192.168.0.142'
    //             },
    //         maxSctpMessageSize: 262144
    //     }
  }
}
