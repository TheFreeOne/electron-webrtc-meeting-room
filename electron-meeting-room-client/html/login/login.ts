
import { ipcRenderer,remote } from 'electron';
import $ = require("jquery");
import ChannelConstant from '../../util/ChannelConstant';
import * as fs from 'fs';
import * as path from 'path';

 

layui.use(['form'], () => {
    let form = layui.form;

    $('#setting').on('click',() =>{
        $('#config-form').show();
        $('#action-form').hide();
        let config = readJsonFromFile(path.join(remote.app.getAppPath(),'./config.json'));
        form.val('config-form',config)

    });

    form.on('submit(saveConfigBtn)', (obj) => {
        console.log(obj.field);
        let filepath = path.join(remote.app.getAppPath(),'./config.json');
        console.log(filepath.replace(/\\/g,'/'));
        writeJsonToFile(obj.field,filepath);
        $('#action-form').show();
        $('#config-form').hide();
    });

    form.on('submit(login-submit)', (formData) => {
        console.log(formData);
        let config = readJsonFromFile(path.join(remote.app.getAppPath(),'./config.json'));
        $.ajax({
            url: config.javaLoginServer + '/login.json',
            data: formData.field,
            type: 'post',
            timeout:1000,
            success: (result) => {
                if (result.success) {
                    console.log(result);
                    debugger
                    ipcRenderer.send(ChannelConstant.LOGIN_SUCCESS, result.data);
                    // ipcRenderer.send(ChannelConstant.LOGIN_SUCCESS, {
                    //     nickname: `nickname-${formData.field.username}:`+Math.random()*1000,
                    //     token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MTk0OTE2MTAsInVzZXJJZCI6IjE2MTgwMjAzODIwMTkiLCJ1c2VybmFtZSI6IjEifQ.fHBeYh6NDHe3GP0sMluXE9Y_Rwv5bya8BbplLQTcOew"
                    // });

                } else {
                    layui.layer.msg(result.msg);
                }
            },
            error: (xmlHttpRequest, textStatus, errorThrown) => {
                if (xmlHttpRequest.status == 0) {
                    alert(`登陆地址没有响应，开启模拟登陆`);
                    let nickname = `nickname-${formData.field.username}`+parseInt(""+Math.random()*100000);
                    sessionStorage.setItem('nickname',nickname);
                    ipcRenderer.send(ChannelConstant.LOGIN_SUCCESS, {
                        nickname: nickname,
                        // jwttoken
                        token:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MTk0OTE2MTAsInVzZXJJZCI6IjE2MTgwMjAzODIwMTkiLCJ1c2VybmFtZSI6IjEifQ.fHBeYh6NDHe3GP0sMluXE9Y_Rwv5bya8BbplLQTcOew"
                    });
                } else {
                    alert('请求异常 ：' + xmlHttpRequest.status)
                } 

            }
        });


    });
});


function writeJsonToFile(params: any, fileAbsolutePath: string, callback?) {
    console.log(params);
    
   //现将json文件读出来
   var str = JSON.stringify(params);//因为nodejs的写入文件只认识字符串或者二进制数，所以把json对象转换成字符串重新写入json文件中
   console.log(str);
   console.log(fileAbsolutePath);
   // {"javaLoginServer":"http://192.168.0.142:18080/","sfuServer":"http://192.168.0.142:3016","nodeRoomServer":"http://192.168.0.142:3016","sturnserver":"stun:119.29.16.187:3478","turnserver":"turn:119.29.16.187:3478","turnusername":"username","turncredential":"password","meetingPattern":"sfu"}
   fs.writeFileSync(fileAbsolutePath,str,{encoding:'UTF-8'});
   
 }
function readJsonFromFile(jsonFilePath: string) {
    return JSON.parse(fs.readFileSync(jsonFilePath).toString());
  }

export = {}
