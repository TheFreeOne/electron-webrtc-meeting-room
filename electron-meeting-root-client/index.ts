import { ipcRenderer } from 'electron';
import $ = require('jquery');
import ChannelConstant from './util/ChannelConstant';
let config = require('./config.json');


layui.use(['form'], () => {
    let form = layui.form;
    form.on('submit(create-meeting)', () => {

        let token = ipcRenderer.sendSync(ChannelConstant.GET_TOKEN);
        $.ajax({
            url: `${config.javaLoginServer}/createRoom.json`,
            headers: {
                'token': token
            },
            type: 'post',
            success: (result) => {
                if (result.success) {
                    ipcRenderer.send(ChannelConstant.CREATE_MEETING_WINDOW, result.data.roomNumber, "CREATE");
                }
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
            $.ajax({
                url: `${config.javaLoginServer}/queryRoomExisted.json`,
                headers: {
                    'token': token
                },
                data: {
                    roomNumber: pass
                },
                type: 'post',
                success: (result) => {
                    layui.layer.closeAll();
                    if (result.data && result.data.existed == true) {
                        ipcRenderer.send(ChannelConstant.CREATE_MEETING_WINDOW, pass, "JOIN");
                    } else {
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

export = {}
