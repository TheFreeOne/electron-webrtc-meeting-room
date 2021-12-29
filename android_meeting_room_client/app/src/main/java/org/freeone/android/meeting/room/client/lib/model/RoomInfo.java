package org.freeone.android.meeting.room.client.lib.model;


import org.freeone.android.meeting.room.client.lib.RoomClient;

import static org.freeone.android.meeting.room.client.lib.RoomClient.ConnectionState.NEW;


public class RoomInfo {

  private String mUrl;
  private String mRoomId;
  private RoomClient.ConnectionState mConnectionState = NEW;
  private String mActiveSpeakerId;
  private String mStatsPeerId;
  private boolean mFaceDetection = false;

  public String getUrl() {
    return mUrl;
  }

  public void setUrl(String url) {
    this.mUrl = url;
  }

  public String getRoomId() {
    return mRoomId;
  }

  public void setRoomId(String roomId) {
    this.mRoomId = roomId;
  }

  public RoomClient.ConnectionState getConnectionState() {
    return mConnectionState;
  }

  public void setConnectionState(RoomClient.ConnectionState connectionState) {
    this.mConnectionState = connectionState;
  }

  public String getActiveSpeakerId() {
    return mActiveSpeakerId;
  }

  public void setActiveSpeakerId(String activeSpeakerId) {
    this.mActiveSpeakerId = activeSpeakerId;
  }

  public String getStatsPeerId() {
    return mStatsPeerId;
  }

  public void setStatsPeerId(String statsPeerId) {
    this.mStatsPeerId = statsPeerId;
  }

  public boolean isFaceDetection() {
    return mFaceDetection;
  }

  public void setFaceDetection(boolean faceDetection) {
    this.mFaceDetection = faceDetection;
  }
}
