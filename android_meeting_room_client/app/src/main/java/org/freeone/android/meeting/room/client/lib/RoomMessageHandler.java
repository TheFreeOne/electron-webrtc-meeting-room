package org.freeone.android.meeting.room.client.lib;

import androidx.annotation.NonNull;

import org.freeone.android.meeting.room.client.lib.lv.RoomStore;
import org.mediasoup.droid.Consumer;


import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RoomMessageHandler {

  static  String TAG = "RoomClient";

  // Stored Room States.
  @NonNull
  RoomStore mStore;
  // mediasoup Consumers.
  @NonNull
  Map<String, ConsumerHolder> mConsumers;

 public static class ConsumerHolder {
    @NonNull final String peerId;
    @NonNull final Consumer mConsumer;

    ConsumerHolder(@NonNull String peerId, @NonNull Consumer consumer) {
      this.peerId = peerId;
      mConsumer = consumer;
    }
  }

  RoomMessageHandler(@NonNull RoomStore store) {
    this.mStore = store;
    this.mConsumers = new ConcurrentHashMap<>();
  }

}
