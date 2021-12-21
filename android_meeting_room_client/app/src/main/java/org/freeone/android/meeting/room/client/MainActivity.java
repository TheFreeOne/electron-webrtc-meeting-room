package org.freeone.android.meeting.room.client;

import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AppCompatActivity;

import android.Manifest;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;

public class MainActivity extends AppCompatActivity {

    EditText edit_nickname;
    EditText edit_room_id;
    EditText edit_sfu_server_address;
    Button go_in_meeting;

    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        edit_nickname = findViewById(R.id.edit_nickname);
        edit_room_id = findViewById(R.id.edit_room_id);
        edit_sfu_server_address = findViewById(R.id.edit_sfu_server_address);
        go_in_meeting = findViewById(R.id.go_in_meeting);
        init();
        requestPermissions();
    }

    public void init() {
        go_in_meeting.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String nickname = edit_nickname.getText().toString();
                String roomId = edit_room_id.getText().toString();
                String sfuServerAddress = edit_sfu_server_address.getText().toString();

                Intent intent = new Intent(MainActivity.this, MeetingActivity.class);
                Bundle bundle = new Bundle();
                bundle.putString("nickname", nickname);
                bundle.putString("roomId", roomId);
                bundle.putString("sfuServerAddress", sfuServerAddress);
                intent.putExtras(bundle);

                startActivity(intent);
            }
        });
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    private void requestPermissions() {
            this.requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO
                    , Manifest.permission.MODIFY_AUDIO_SETTINGS
                    , Manifest.permission.WRITE_EXTERNAL_STORAGE
                    , Manifest.permission.ACCESS_NETWORK_STATE
                    , Manifest.permission.ACCESS_WIFI_STATE
                    , Manifest.permission.INTERNET
                    , Manifest.permission.READ_PHONE_STATE
                    , Manifest.permission.CAMERA
            }, 1);

    }


}