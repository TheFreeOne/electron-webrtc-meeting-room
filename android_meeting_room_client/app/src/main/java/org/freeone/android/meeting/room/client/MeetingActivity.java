package org.freeone.android.meeting.room.client;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.Manifest;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.FrameLayout;
import android.widget.GridLayout;

import org.freeone.android.meeting.room.client.adapter.PeerAdapter;
import org.freeone.android.meeting.room.client.lib.PeerConnectionUtils;
import org.freeone.android.meeting.room.client.lib.RoomClient;
import org.freeone.android.meeting.room.client.lib.lv.RoomStore;
import org.freeone.android.meeting.room.client.lib.model.RoomInfo;
import org.mediasoup.droid.MediasoupClient;
import org.webrtc.EglRenderer;
import org.webrtc.SurfaceViewRenderer;

public class MeetingActivity extends AppCompatActivity {

    String nickname;
    String roomId;
    String sfuServerAddress;
    RoomClient roomClient;

    RecyclerView recyclerView;
    PeerAdapter mPeerAdapter;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_meeting);

        MediasoupClient.initialize(getApplicationContext());
        Bundle extras = getIntent().getExtras();
        this.nickname = extras.getString("nickname");
        this.roomId = extras.getString("roomId");
        this.sfuServerAddress = extras.getString("sfuServerAddress");


        recyclerView = findViewById(R.id.meeting_recycleView);
        GridLayoutManager gridLayoutManager = new GridLayoutManager(this, 2);
        recyclerView.setLayoutManager(gridLayoutManager);
        mPeerAdapter = new PeerAdapter( this);
        recyclerView.setAdapter(mPeerAdapter);
        this.roomClient = new RoomClient(MeetingActivity.this, roomId, nickname, sfuServerAddress, new RoomStore(),mPeerAdapter);
        PeerConnectionUtils.setPreferCameraFace("front");

    }



}