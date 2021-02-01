package org.freeone.electronwebrtcmeetingroom.util;

import org.freeone.electronwebrtcmeetingroom.model.RoomModel;
import org.springframework.context.annotation.Configuration;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 临时房间工具类
 */
@Configuration
public class TemporaryRoomUtil {

    public static ConcurrentHashMap ROOM = new ConcurrentHashMap<String, RoomModel>();

    public static ConcurrentHashMap USER_CRETEED_ROOM = new ConcurrentHashMap<String, String>();


    public synchronized boolean hasRoom(String roomNumber){
        return ROOM.keySet().contains(roomNumber);
    }

    public synchronized String createRoom(String userId,String type){
        String roomNumber = generateRoomNumber();
        while (hasRoom(roomNumber)){
            roomNumber = generateRoomNumber();
        }
        RoomModel roomModel = new RoomModel(userId,type);
        roomModel.setNumber(roomNumber);
        ROOM.put(roomNumber, ROOM);
        USER_CRETEED_ROOM.put(userId, roomNumber);
        return roomNumber;
    }

    private String generateRoomNumber() {
        String numberString = "0123456789";
        String roomNumber = "";
        Random random = new Random();
        for (int i = 0; i < 9; i++) {
            roomNumber += numberString.charAt(random.nextInt(10));
        }
//        int number = (int)(Math.random()*100000*100000);// z这种方式,当超过int的最大值时只能返回int的最大值2147483647
        return roomNumber;
    }
}
