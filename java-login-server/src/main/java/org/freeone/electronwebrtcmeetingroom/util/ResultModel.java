package org.freeone.electronwebrtcmeetingroom.util;

import java.util.HashMap;

public class ResultModel {


    private Integer code = 0;

    private Boolean success = true;

    private String msg = "";

    private Object data = null;

    public Integer getCode() {
        return this.code;
    }

    public ResultModel setCode(Integer code) {
        this.code = code;
        return this;
    }

    public Boolean getSuccess() {
        return this.success;
    }

    public ResultModel setSuccess(Boolean success) {
        this.success = success;
        return this;
    }

    public String getMsg() {
        return this.msg;
    }

    public ResultModel setMsg(String msg) {
        this.msg = msg;
        return this;
    }

    public Object getData() {
        return this.data;
    }

    public ResultModel setData(Object data) {
        this.data = data;
        return this;
    }

    public static ResultModel failed(String msg){
        ResultModel resultModel = new ResultModel();
        resultModel.code = 1;
        resultModel.setMsg(msg);
        resultModel.success = false;
        return resultModel;
    }
    public static ResultModel ok(){
        return new ResultModel();
    }
    public static ResultModel ok(String msg){
        ResultModel resultModel = new ResultModel();
        resultModel.code = 1;
        resultModel.success = true;
        resultModel.msg = msg;
        return resultModel;
    }

    public static ResultModel okWithData(Object data){
        ResultModel resultModel = new ResultModel();
        resultModel.code = 0;
        resultModel.success = true;
        resultModel.msg = "";
        resultModel.data = data;
        return resultModel;
    }


}
