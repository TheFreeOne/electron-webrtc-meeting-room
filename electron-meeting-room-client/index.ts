import { ipcRenderer,remote } from 'electron';
import $ = require('jquery');
import * as path from 'path';
import ChannelConstant from './util/ChannelConstant';
import * as fs from 'fs';



 




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


    form.on('submit(create-meeting)', () => {

        let token = ipcRenderer.sendSync(ChannelConstant.GET_TOKEN);
        let config = readJsonFromFile(path.join(remote.app.getAppPath(),'./config.json'));
        $.ajax({
            url: `${config.meetingPattern == 'sfu' ?config.sfuServer:config.nodeRoomServer}/createValidRoomId`,
            headers: {
                'token': token
            },
            type: 'get',
            timeout: 1000,
            success: (result) => {
                ipcRenderer.send(ChannelConstant.CREATE_MEETING_WINDOW, result.roomId, "CREATE");
                layui.layer.closeAll();
            }, error: (err) => {
                console.log(err);
                alert('请求错误');
            }
        });
    });



    form.on('submit(join-meeting)', () => {
        layui.layer.prompt({
            title: '输入9位房间号，并确认', formType: 0, success: () => {
                console.log(1);

                $('.layui-layer-btn').css('top', '-5px');
            }
        }, function (pass, index) {
            if (pass.length != 9) {
                layui.layer.msg("请输入正确的房间号");
                return;
            }
            let token = ipcRenderer.sendSync(ChannelConstant.GET_TOKEN);
            let config = readJsonFromFile(path.join(remote.app.getAppPath(),'./config.json'));
            $.ajax({
                url: `${config.meetingPattern == 'sfu' ?config.sfuServer:config.nodeRoomServer}/isRoomExisted`,
                headers: {
                    'token': token
                },
                data: {
                    roomId: pass
                },
                type: 'post',
                timeout:3000,
                success: (result) => {
                    layui.layer.closeAll();
                    if(result.existed){
                        ipcRenderer.send(ChannelConstant.CREATE_MEETING_WINDOW, pass, "JOIN");
                    }else{
                        layui.layer.msg('不存在的房间');
                    }
                     

                }, error: (err) => {
                    console.log(err);
                    alert('请求错误');
                }
            })


        });
        // ipcRenderer.send(ChannelConstant.CREATE_MEETING_WINDOW,result.data.roomNumber,"CREATE");
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
