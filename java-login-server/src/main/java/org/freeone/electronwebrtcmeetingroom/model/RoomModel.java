package org.freeone.electronwebrtcmeetingroom.model;

import java.util.Date;
import java.util.List;

public class RoomModel {

    private String number;
    /**
     * 所有房间的默认密码
     */
    private String password = "123456";
    /**
     * 默认最大人数
     */
    private Integer maxPerson = 2;

    private String type;

    private Date createTime = new Date();
    /**
     * 白名单
     */
    private List<String> whiteList;

    private List<String> personInRoom;

    private String userId;

    private RoomModel() {
    }

    public RoomModel(String userId, String type) {
        this.userId = userId;
        this.type = type;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<String> getWhiteList() {
        return this.whiteList;
    }

    public void setWhiteList(List<String> whiteList) {
        this.whiteList = whiteList;
    }

    public List<String> getPersonInRoom() {
        return this.personInRoom;
    }

    public void setPersonInRoom(List<String> personInRoom) {
        this.personInRoom = personInRoom;
    }

    public String getNumber() {
        return this.number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getPassword() {
        return this.password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getMaxPerson() {
        return this.maxPerson;
    }

    public void setMaxPerson(Integer maxPerson) {
        this.maxPerson = maxPerson;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Date getCreateTime() {
        return this.createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
}
