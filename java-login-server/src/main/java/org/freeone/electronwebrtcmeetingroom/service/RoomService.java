package org.freeone.electronwebrtcmeetingroom.service;

public interface RoomService {

    String createRoom(String userId,String type);

    boolean existed(String roomNumber);



}
