package org.freeone.android.meeting.room.client.model;

import org.freeone.android.meeting.room.client.adapter.PeerAdapter;
import org.freeone.android.meeting.room.client.view.MySurfaceViewRenderer;
import org.mediasoup.droid.Consumer;

import java.util.ArrayList;
import java.util.List;

public class PersonItemViewModel {

    boolean isInit = false;

    String socketId;

    String nickname;
    /**
     * 一个消费AudioTrack，一个消费VideoTrack
     */
    List<Consumer> consumerList = new ArrayList<>(2);

    MySurfaceViewRenderer surfaceViewRenderer;

    PeerAdapter.PeerViewHolder PeerViewHolder;

    public PeerAdapter.PeerViewHolder getPeerViewHolder() {
        return this.PeerViewHolder;
    }

    public void setPeerViewHolder(PeerAdapter.PeerViewHolder peerViewHolder) {
        PeerViewHolder = peerViewHolder;
    }
    @Deprecated
    public void addNewConsumer(Consumer consumer){
        consumerList.add(consumer);
        // TODO 声音还是视频

    }

    public boolean getIsInit() {
        return this.isInit;
    }

    public void setIsInit(boolean isInit) {
        this.isInit = isInit;
    }

    public String getNickname() {
        return this.nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getSocketId() {
        return this.socketId;
    }

    public void setSocketId(String socketId) {
        this.socketId = socketId;
    }

    public List<Consumer> getConsumerList() {
        return this.consumerList;
    }

    public void setConsumerList(List<Consumer> consumerList) {
        this.consumerList = consumerList;
    }

    public MySurfaceViewRenderer getSurfaceViewRenderer() {
        return this.surfaceViewRenderer;
    }

    public void setSurfaceViewRenderer(MySurfaceViewRenderer surfaceViewRenderer) {
        this.surfaceViewRenderer = surfaceViewRenderer;
    }
}
