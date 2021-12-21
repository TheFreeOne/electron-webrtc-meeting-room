package org.freeone.electronwebrtcmeetingroom.service.impl;

import org.freeone.electronwebrtcmeetingroom.service.RoomService;
import org.freeone.electronwebrtcmeetingroom.util.TemporaryRoomUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RoomServiceImpl implements RoomService {

    @Autowired
    private TemporaryRoomUtil roomUtil;

    @Override
    public String createRoom(String userId,String type) {
        String roomNumber = roomUtil.createRoom(userId, type);
        return roomNumber;
    }

    @Override
    public boolean existed(String roomNumber) {
        return roomUtil.hasRoom(roomNumber);
    }

    @Override
    public void recycleRoom(String roomNumber) {
        roomUtil.recycleRoom(roomNumber);
    }


}
