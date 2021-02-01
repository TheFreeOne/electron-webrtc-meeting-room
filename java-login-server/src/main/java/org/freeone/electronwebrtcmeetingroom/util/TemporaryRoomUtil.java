package org.freeone.electronwebrtcmeetingroom.util;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 临时房间工具类
 */
public class TemporaryRoomUtil {

    public static ConcurrentHashMap room = new ConcurrentHashMap<String, List>();

    public synchronized boolean hasRoom(String roomNumber){
        return room.keySet().contains(roomNumber);
    }


}
