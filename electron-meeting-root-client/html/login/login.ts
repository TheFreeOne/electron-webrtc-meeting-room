
import { ipcRenderer } from 'electron';
import $ = require("jquery");
import ChannelConstant from '../../util/ChannelConstant';

let config = require('../../config.json');

layui.use(['form'], () => {
    let form = layui.form;
    form.on('submit(login-submit)', (formData) => {
        console.log(formData);
        $.ajax({
            url: config.javaLoginServer + '/login.json',
            data: formData.field,
            type: 'post',
            success: (result) => {
                if (result.success) {
                    ipcRenderer.send(ChannelConstant.LOGIN_SUCCESS, result.data);
                } else {
                    layui.layer.msg(result.msg);
                }
            },
            error: (xmlHttpRequest, textStatus, errorThrown) => {
                if (xmlHttpRequest.status == 0) {
                    alert('服务器没有响应，请检查服务器地址');
                } else {
                    alert('请求异常 ：' + xmlHttpRequest.status)
                } 

            }
        });


    });
});

export = {}
