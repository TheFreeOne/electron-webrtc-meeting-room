package org.freeone.android.meeting.room.client.lib;

import android.content.Context;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.Looper;
import android.util.Log;
import android.view.View;


import androidx.annotation.NonNull;

import org.freeone.android.meeting.room.client.ConsumerItemViewModel;
import org.freeone.android.meeting.room.client.R;
import org.freeone.android.meeting.room.client.adapter.PeerAdapter;
import org.freeone.android.meeting.room.client.lib.lv.RoomStore;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.mediasoup.droid.Consumer;
import org.mediasoup.droid.Device;
import org.mediasoup.droid.Logger;
import org.mediasoup.droid.MediasoupException;
import org.mediasoup.droid.Producer;
import org.mediasoup.droid.RecvTransport;
import org.mediasoup.droid.SendTransport;
import org.mediasoup.droid.Transport;
import org.webrtc.AudioTrack;
import org.webrtc.MediaStreamTrack;
import org.webrtc.SurfaceViewRenderer;
import org.webrtc.VideoTrack;

import java.net.URISyntaxException;

import io.socket.client.Ack;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;

public class RoomClient extends RoomMessageHandler {
    // jobs worker handler.
    private Handler mWorkHandler;
    // main looper handler.
    private Handler mMainHandler;
    RoomStore roomStore;
    Context mContext;
    /**
     * 自己的socketio的id
     */
    String peerId;
    PeerConnectionUtils mPeerConnectionUtils;

    String roomId;
    String nickname;
    String sfuServerAddress;
    Socket mSocket;

    public static Boolean needWaitSocketIO = false;
    public static String tempProducerId ="";

    // mediasoup-client Device instance.
    private Device mMediasoupDevice;
    // mediasoup Transport for sending.
    private SendTransport mSendTransport;
    // mediasoup Transport for receiving.
    private RecvTransport mRecvTransport;
    // Local Audio Track for mic.
    private AudioTrack mLocalAudioTrack;
    // Local mic mediasoup Producer.
    private Producer mMicProducer;
    // local Video Track for cam.
    private VideoTrack mLocalVideoTrack;
    // Local cam mediasoup Producer.
    private Producer mCamProducer;

    private PeerAdapter mPeerAdapter;


    public enum ConnectionState {
        // initial state.
        NEW,
        // connecting or reconnecting.
        CONNECTING,
        // connected.
        CONNECTED,
        // mClosed.
        CLOSED,
    }

    public RoomClient(
            Context context,
            String roomId,
            String nickname,
            String sfuServerAddress,
            RoomStore roomStore, PeerAdapter peerAdapter) {
        super(roomStore);
        this.roomId = roomId;
        this.nickname = nickname;
        this.sfuServerAddress = sfuServerAddress;
        this.mContext = context;
        this.mPeerAdapter = peerAdapter;
        // init worker handler.
        HandlerThread handlerThread = new HandlerThread("worker");
        handlerThread.start();
        mWorkHandler = new Handler(handlerThread.getLooper());
        mMainHandler = new Handler(Looper.getMainLooper());
        mWorkHandler.post(() -> {
            mPeerConnectionUtils = new PeerConnectionUtils();

        });

        initSocketIO();
    }

    public void initSocketIO(){
        try {
            mSocket = IO.socket(sfuServerAddress);
            mSocket.on(Socket.EVENT_CONNECT, onConnect);
            mSocket.on(Socket.EVENT_DISCONNECT, onDisconnect);
            mSocket.on(Socket.EVENT_CONNECT_ERROR, onConnectError);
            mSocket.on("newProducers", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    Log.e(TAG, "call: newProducers");
                    if (args != null) {
                        Log.e(TAG, "newProducers  get  " + args[0].toString());
                        try {
                            JSONArray jsonArray = new JSONArray(args[0].toString());
                            if (jsonArray.length() > 0) {
                                for (int i = 0; i < jsonArray.length(); i++) {

                                    JSONObject info = jsonArray.getJSONObject(i);
                                    Logger.d(TAG, "device#createSendTransport() " + info);
                                    String producer_id = info.optString("producer_id");
                                    JSONObject jsonObject = new JSONObject();
                                    jsonObject.put("producerId", producer_id);
                                    jsonObject.put("consumerTransportId", mRecvTransport.getId());
                                    jsonObject.put("rtpCapabilities", mMediasoupDevice.getRtpCapabilities());
                                    Log.e(TAG, "call: mSocket.emit(\"consume\",jsonObject);");
                                    mSocket.emit("consume", jsonObject, (Ack) args1 -> {
                                        if (args1 != null) {
                                            try {

                                                JSONObject data = new JSONObject(args1[0].toString());
                                                Log.e(TAG, "call: consume callback = "+ data);
                                                String peerId = data.optString("peerId");
                                                String producerId = data.optString("producerId");
                                                String id = data.optString("id");
                                                String kind = data.optString("kind");
                                                String rtpParameters = data.optString("rtpParameters");
                                                String type = data.optString("type");

                                                boolean producerPaused = false;

                                                Consumer consumer = mRecvTransport.consume(
                                                        c -> {
                                                            mConsumers.remove(c.getId());
                                                            Logger.w(TAG, "onTransportClose for consume");
                                                        },
                                                        id,
                                                        producerId,
                                                        kind,
                                                        rtpParameters,
                                                        null);

                                                mConsumers.put(consumer.getId(), new ConsumerHolder(peerId, consumer));

                                                mStore.addConsumer(peerId, type, consumer, producerPaused);

                                                if ("video".equals(consumer.getKind())) {
                                                    consumer.resume();
                                                    ConsumerItemViewModel consumerItemViewModel = new ConsumerItemViewModel();
                                                    consumerItemViewModel.setConsumer(consumer);
                                                    mWorkHandler.post(()->{
                                                        mPeerAdapter.AddConsumerItemViewModel(consumerItemViewModel);
                                                    });
                                                }





                                            } catch (Exception e) {
                                                e.printStackTrace();
                                            }
                                        }
                                    });

                                }


                            }
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            });
            // 关闭消费
            mSocket.on("consumerClosed", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    if (args != null){
                        try {
                            JSONObject jsonObject = new JSONObject(args[0].toString());
                            Log.e(TAG, "socketIO on consumerClosed = "+jsonObject );
                            String consumerId = jsonObject.optString("consumer_id");
                            ConsumerHolder holder = mConsumers.remove(consumerId);
                            if (holder != null) {
                                holder.mConsumer.close();
                                mConsumers.remove(consumerId);
                                mStore.removeConsumer(holder.peerId, holder.mConsumer.getId());
                            }
                            mPeerAdapter.removeConsumerItemViewModelByConsumerId(consumerId);

                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                    }
                }
            });


            mSocket.connect();

            Log.e(TAG, "initSocketIO: initSocketIO" );
        } catch (URISyntaxException e) {
            e.printStackTrace();
        }
    }


    public void join(final String name, final String roomId) {

        try {

            JSONObject jsonObject = new JSONObject();
            jsonObject.put("name", name);
            jsonObject.put("room_id", roomId);

            mSocket.emit("join", jsonObject, (Ack) joinArgs -> {
                Log.e(TAG, "join: send = " +jsonObject );
                if (joinArgs != null){
                    try {
                        Log.e(TAG, "join: callback = " + new JSONObject(joinArgs[0].toString()) );
                        JSONObject jsonCallback = new JSONObject(joinArgs[0].toString());
                        this.peerId = jsonCallback.optString("socketid");
                        getRouterRtpCapabilities();
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                }
            });

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public void getRouterRtpCapabilities(){
        mSocket.emit("getRouterRtpCapabilities", new JSONObject(),(Ack) args -> {
            if(args!= null){
                try {
                    Log.e(TAG, "getRouterRtpCapabilities: callback = "+args[0].toString() );

                    mWorkHandler.post(()->{
                        try {
                            this.mMediasoupDevice = new Device();
                            String routerRtpCapabilities = args[0].toString();
                            mMediasoupDevice.load(routerRtpCapabilities);

                            String rtpCapabilities = mMediasoupDevice.getRtpCapabilities();
                            Log.e(TAG, "call: mMediasoupDevice.getRtpCapabilities = " + rtpCapabilities);
                            initProducerTransport();
                        } catch (MediasoupException e) {
                            e.printStackTrace();
                        }
                    });


                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

        });
    }

    public void getProducers(){
        mSocket.emit("getProducers");
    }

    public void initProducerTransport(){
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("forceTcp", false);
            jsonObject.put("rtpCapabilities", mMediasoupDevice.getRtpCapabilities());
            Log.e(TAG, "initProducerTransport: json = "+jsonObject );
            mSocket.emit("createWebRtcTransport", jsonObject, (Ack) args -> {
                    if(args != null){
                        try {
                            Log.e(TAG, "initProducerTransport createWebRtcTransport callback = " + args[0].toString() );
                            JSONObject info = new JSONObject(args[0].toString());

                            Logger.d(TAG, "device#createSendTransport() " + info);

                            String id = info.optString("id");
                            String iceParameters = info.optString("iceParameters");
                            String iceCandidates = info.optString("iceCandidates");
                            String dtlsParameters = info.optString("dtlsParameters");
                            String sctpParameters = info.optString("sctpParameters");

                            this.mSendTransport = mMediasoupDevice.createSendTransport(sendTransportListener, id, iceParameters, iceCandidates, dtlsParameters);
//                            enableCam();
                            initConsumerTransport();
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public void initConsumerTransport(){
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("forceTcp", false);

            Log.e(TAG, "initConsumerTransport: " );
            mSocket.emit("createWebRtcTransport", jsonObject, (Ack) args -> {
                if(args != null){
                    Log.e(TAG, "initConsumerTransport: createWebRtcTransport send = " + jsonObject);
                    try {
                        Log.e(TAG, "initConsumerTransport createWebRtcTransport callback: args[0].toString() = " + args[0].toString() );
                        JSONObject info = new JSONObject(args[0].toString());

                        String id = info.optString("id");
                        String iceParameters = info.optString("iceParameters");
                        String iceCandidates = info.optString("iceCandidates");
                        String dtlsParameters = info.optString("dtlsParameters");

                        this.mRecvTransport = mMediasoupDevice.createRecvTransport( recvTransportListener, id, iceParameters, iceCandidates, dtlsParameters,null);
                        getProducers();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            });
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public void enableCam() {
        Log.d(TAG, "enableCam()");
        mStore.setCamInProgress(true);
        mWorkHandler.post(
                () -> {
                    try {
                        if (mLocalVideoTrack == null) {
                            mLocalVideoTrack = mPeerConnectionUtils.createVideoTrack(mContext , "cam");
                            mLocalVideoTrack.setEnabled(true);
                        }
                        mCamProducer =
                                mSendTransport.produce(
                                        producer -> {
                                            Logger.e(TAG, "onTransportClose(), camProducer");
                                            if (mCamProducer != null) {
                                                mStore.removeProducer(mCamProducer.getId());
                                                mCamProducer = null;
                                            }
                                        },
                                        mLocalVideoTrack,
                                        null,
                                        null);
                        Log.e(TAG, "enableCamImpl: mCamProducer " );
                        Log.e(TAG, "tempProducerId = 3" );

                        System.out.println(mCamProducer);
                        mStore.addProducer(mCamProducer);
                        mStore.setCamInProgress(false);
                    } catch (MediasoupException e) {
                        e.printStackTrace();
                    }
                });
    }


    private final SendTransport.Listener sendTransportListener =
            new SendTransport.Listener() {

                private String listenerTAG = TAG + "_SendTrans";

                @Override
                public String onProduce(
                        Transport transport, String kind, String rtpParameters, String appData) {


                    try {

                        JSONObject jsonObject = new JSONObject();

                        jsonObject.put("producerTransportId", mSendTransport.getId());
                        jsonObject.put("kind", kind);
                        jsonObject.put("rtpParameters", toJsonObject(rtpParameters));
                        jsonObject.put("appData", appData);
                        Log.e(TAG, "onProduce: appData = " +appData );

                        mSocket.emit("produce", jsonObject, new Ack() {
                            @Override
                            public void call(Object... args) {
                                if(args != null){
                                    for (Object arg : args) {
                                        try {
                                            JSONObject jsonObject1 = new JSONObject(arg.toString());
                                            tempProducerId = jsonObject1.optString("producer_id");
                                            System.out.println("tempProducerId = 1 " + tempProducerId);

                                        } catch (JSONException e) {
                                            tempProducerId = " ";
                                            e.printStackTrace();
                                        }
                                    }
                                }
                            }
                        });
                        while("".equals(tempProducerId)){
                            // 阻塞等待tempProducerId
                        }

                        System.out.println("tempProducerId = 2 " + tempProducerId);
                        String producerId = tempProducerId;
                        tempProducerId = "";
                        System.out.println("mCamProducer.resume();");
                        System.out.println(mCamProducer);
                        Log.d(listenerTAG, "producerId: " + producerId);

                        return producerId;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return "";
                    }
                }

                @Override
                public void onConnect(Transport transport, String dtlsParameters) {
                    Log.e(TAG, "sendTransportListener onConnect: ");
                    Log.d(listenerTAG + "_send", "onConnect()");
                    try {
                        JSONObject jsonObject = new JSONObject();
                        jsonObject.put("transport_id", mSendTransport.getId());
                        jsonObject.put("dtlsParameters", toJsonObject(dtlsParameters));
                        mSocket.emit("connectTransport", jsonObject);
                        Log.e(listenerTAG, "connectTransport: " + jsonObject.toString());

                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onConnectionStateChange(Transport transport, String connectionState) {
                    Log.d(listenerTAG, "onConnectionStateChange: " + connectionState);
                }
            };

    private RecvTransport.Listener recvTransportListener =
            new RecvTransport.Listener() {

                private String listenerTAG = TAG + "_RecvTrans";

                @Override
                public void onConnect(Transport transport, String dtlsParameters) {

                    try {
                        Log.e(listenerTAG, "onConnect: " );
                        JSONObject jsonObject = new JSONObject();
                        String id = mRecvTransport.getId();

                        jsonObject.put("transport_id", mRecvTransport.getId());
                        jsonObject.put("dtlsParameters", toJsonObject(dtlsParameters));
                        Log.e(listenerTAG, "connectTransport send ="+jsonObject  );
                        mSocket.emit("connectTransport", jsonObject);

                    } catch (JSONException e) {
                        e.printStackTrace();
                    }

                }

                @Override
                public void onConnectionStateChange(Transport transport, String connectionState) {
                    Log.e(listenerTAG, "onConnectionStateChange: connectionState = "+connectionState );
                }
            };


    private Emitter.Listener onConnect = new Emitter.Listener() {
        @Override
        public void call(Object... args) {
            Log.i(TAG, "run: onConnect");
            try {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("room_id", roomId);
                mSocket.emit("createRoom", jsonObject, (Ack) args1 -> {
                    Log.e(TAG, "createRoom send = "+jsonObject );
                    if(args1 != null){
                        Log.e(TAG, "call: createRoom = "+ args1[0].toString()  );
                        join(nickname, roomId);
                    }

                });

            } catch (JSONException e) {
                e.printStackTrace();
            }

        }
    };
    public static JSONObject toJsonObject(String data) {
        try {
            return new JSONObject(data);
        } catch (JSONException e) {
            e.printStackTrace();
            return new JSONObject();
        }
    }
    private Emitter.Listener onDisconnect = args -> Log.i(TAG, "diconnected");

    private Emitter.Listener onConnectError = args -> Log.e(TAG, "Error connecting"); ;

}
