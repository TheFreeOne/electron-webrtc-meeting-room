
import { ipcRenderer } from 'electron';
import $ = require("jquery");
import ChannelConstant from '../../util/ChannelConstant';

let config = require('../../config.json');

layui.use(['form'],()=>{
    let form = layui.form;
    form.on('submit(login-submit)',(formData)=>{
        console.log(formData);
        $.post(config.javaLoginServer+'/login.json',formData.field,(result)=>{
            if(result.success){
                ipcRenderer.send(ChannelConstant.LOGIN_SUCCESS,result.data);
                 
            }else{
                layui.layer.msg(result.msg);
            }
        });
        

    });
});

export = {}
