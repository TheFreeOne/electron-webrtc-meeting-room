package org.freeone.android.meeting.room.client;

import androidx.annotation.NonNull;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;


import android.graphics.Rect;

import android.os.Bundle;

import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;


import org.freeone.android.meeting.room.client.adapter.PeerAdapter;
import org.freeone.android.meeting.room.client.lib.PeerConnectionUtils;
import org.freeone.android.meeting.room.client.lib.RoomClient;
import org.freeone.android.meeting.room.client.lib.lv.RoomStore;

import org.mediasoup.droid.MediasoupClient;

public class MeetingActivity extends AppCompatActivity {
    String TAG = "MeetingActivity";
    String nickname;
    String roomId;
    String sfuServerAddress;
    RoomClient roomClient;

    Button micBtn;
    Button camBtn;
    boolean enableMic = true;
    boolean enableCam = true;
    RecyclerView recyclerView;
    PeerAdapter mPeerAdapter;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_meeting);
        micBtn = findViewById(R.id.mic_btn);
        camBtn = findViewById(R.id.cam_btn);
        try {
            MediasoupClient.initialize(getApplicationContext());
            Bundle extras = getIntent().getExtras();
            this.nickname = extras.getString("nickname");
            this.roomId = extras.getString("roomId");
            this.sfuServerAddress = extras.getString("sfuServerAddress");


            recyclerView = findViewById(R.id.meeting_recycleView);
            GridLayoutManager gridLayoutManager = new GridLayoutManager(this, 2);
            LinearLayoutManager linearLayoutManager = new LinearLayoutManager(this);
            linearLayoutManager.setAutoMeasureEnabled(true);

            recyclerView.setLayoutManager(linearLayoutManager);
            mPeerAdapter = new PeerAdapter( this);
            recyclerView.setAdapter(mPeerAdapter);
            recyclerView.addItemDecoration(new RecyclerView.ItemDecoration() {
                @Override
                public void getItemOffsets(@NonNull Rect outRect, @NonNull View view, @NonNull RecyclerView parent, @NonNull RecyclerView.State state) {
                    super.getItemOffsets(outRect, view, parent, state);
                    outRect.set(0, 0, 0, 20);
                }
            });
            this.roomClient = new RoomClient(MeetingActivity.this, roomId, nickname, sfuServerAddress, new RoomStore(),mPeerAdapter);

            PeerConnectionUtils.setPreferCameraFace("front");
            enableCam = true;
            enableMic = true;
            camBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Toast.makeText(MeetingActivity.this, "camBtn", Toast.LENGTH_SHORT).show();
                    if (enableCam){
                        Log.e(TAG, "onClick: 关闭摄像头 start" );
                        boolean ok = roomClient.disableCamImpl();
                        enableCam = false;
                        Log.e(TAG, "onClick: ok = "+ ok );
                        camBtn.setText("开启摄像头");
                        Log.e(TAG, "onClick: 关闭摄像头 end" );
                    }else{
                        Log.e(TAG, "onClick: 开启摄像头 start" );
                        roomClient.enableCamImpl();
                        enableCam = true;
                        camBtn.setText("关闭摄像头");
                        Log.e(TAG, "关闭摄像头" );
                        Log.e(TAG, "onClick: 开启摄像头 end" );
                    }
                }
            });

            micBtn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (enableMic){
                        roomClient.disableMicImpl();
                        enableMic = false;
                        micBtn.setText("开启麦克风");
                    }else{
                        roomClient.enableMicImpl();
                        enableMic = true;
                        micBtn.setText("关闭麦克风");
                    }
                }
            });
        } catch (Throwable e) {
            e.printStackTrace();
        }

    }

    @Override
    protected void onStop() {
        roomClient.close();
        super.onStop();
    }
}