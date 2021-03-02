package org.freeone.electronwebrtcmeetingroom.controller;

import org.freeone.electronwebrtcmeetingroom.service.RoomService;
import org.freeone.electronwebrtcmeetingroom.util.ResultModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

/**
 * 房间管理
 */
@RestController
public class RoomController {

    List<String> typeList = Arrays.asList("default","audio","screen","video","board");

    @Autowired
    private RoomService roomService;

    @PostMapping("createRoom.json")
    public ResultModel create(@RequestAttribute String userId, @RequestParam(defaultValue = "default") String type){
        if (!typeList.contains(type)){
            return ResultModel.failed("不支持的类型");
        }
        String roomNumber = roomService.createRoom(userId, type);
        return ResultModel.okWithData(new HashMap<String,String>(){{
            put("roomNumber", roomNumber);
        }});
    }
    @PostMapping("queryRoomExisted.json")
    public ResultModel exist(@RequestParam String roomNumber){
        boolean existed = roomService.existed(roomNumber);
        return ResultModel.okWithData(new HashMap<String,Object>(){{
            put("existed", existed);
        }});
    }
    @RequestMapping("recycleRoom.json")
    public ResultModel recycleRoom(@RequestParam String roomNumber){
        System.out.println("回收房间号 = " +roomNumber);
        roomService.recycleRoom(roomNumber);
        return ResultModel.okWithData(new HashMap<String,Object>(){{
            put("success", true);
        }});
    }
}
