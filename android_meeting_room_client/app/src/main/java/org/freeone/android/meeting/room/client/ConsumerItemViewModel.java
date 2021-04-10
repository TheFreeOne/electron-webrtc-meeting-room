package org.freeone.android.meeting.room.client;

import org.mediasoup.droid.Consumer;

public class ConsumerItemViewModel {
    Consumer consumer;

    public Consumer getConsumer() {
        return this.consumer;
    }

    public void setConsumer(Consumer consumer) {
        this.consumer = consumer;
    }
}
