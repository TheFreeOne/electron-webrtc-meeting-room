package org.freeone.android.meeting.room.client;

import org.freeone.android.meeting.room.client.view.MySurfaceViewRenderer;
import org.mediasoup.droid.Consumer;
import org.webrtc.SurfaceViewRenderer;


public class ConsumerItemViewModel {

    Consumer consumer;

    MySurfaceViewRenderer surfaceViewRenderer;

    public Consumer getConsumer() {
        return this.consumer;
    }

    public void setConsumer(Consumer consumer) {
        this.consumer = consumer;
    }

    public MySurfaceViewRenderer getSurfaceViewRenderer() {
        return this.surfaceViewRenderer;
    }

    public void setSurfaceViewRenderer(MySurfaceViewRenderer surfaceViewRenderer) {
        this.surfaceViewRenderer = surfaceViewRenderer;
    }
}
