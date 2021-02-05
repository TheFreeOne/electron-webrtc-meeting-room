import { desktopCapturer, NativeImage, screen as electronScreen } from "electron";
import $ = require('jquery');

export default class ScreenMeeting {



    public run() {


        let html = $('<div class="window-item-content"></div>');
        layui.layer.open({
            type: 1,
            title: '选择窗口',
            area: ['640px', '500px'],
            content: html[0].outerHTML
        })

        var supported = navigator.mediaDevices.getSupportedConstraints();
        (window as any).supported = supported;
        // navigator.webkitGetUserMedia 时创建一个约束对象，如果使用 desktopCapturer 的资源，
        // 必须设置 chromeMediaSource 为 "desktop" ，并且 audio 为 false.
        //如果你想捕获整个桌面的 audio 和 video，你可以设置 chromeMediaSource 为 "screen" ，和 audio
        // 为 true. 当使用这个
        //的时候，不可以指定一个 chromeMediaSourceId.

        var supported = navigator.mediaDevices.getSupportedConstraints();
        (window as any).supported = supported;
        // 这个方法不会不做最小化的软件窗口，即使任务栏有图标
        desktopCapturer.getSources({ types: ['window', 'screen'], fetchWindowIcons: true }).then(async sources => {
            console.log(sources);


            for (const source of sources) {
                try {
                    let thumbnail: NativeImage = source.thumbnail;

                    let windowVideoItem = $(`<div class="window-item"   >
                        <input type="hidden" value="${source.id}">
                        <img src="${thumbnail.toDataURL()}" ></img>
                        <p>${source.name}</p>
                      
                    </div>`);

                    $('.window-item-content').append(windowVideoItem);

                    $(`input[value="${source.id}"]`).parents('.window-item').off().on('click', async () => {


                        var constraints = {};

                        let sourceId = $(`input[value="${source.id}"]`).val();
                        console.log(sourceId);
                        let desktopStream = null;
                        if ((sourceId as string).startsWith('screen:')) {
                            console.log("准备获取【有声屏幕】的流");

                            // 获取的是窗口，做特殊处理
                            try {
                                desktopStream = await navigator.mediaDevices.getUserMedia(
                                    {
                                        audio: {
                                            //@ts-ignore
                                            mandatory: {
                                                chromeMediaSource: 'desktop',
                                                chromeMediaSourceId: source.id
                                            }
                                        },
                                        video: {
                                            //@ts-ignore
                                            mandatory: {
                                                chromeMediaSource: 'screen'
                                            }
                                        }
                                    }
                                );
                                (window as any).toastr.info("获取【有声屏幕】的流 ==》 成功");
                            } catch (deskTopError) {

                                console.error(deskTopError);
                                (window as any).toastr.info("获取【有声屏幕】的流 错误，切换【无声屏幕】流");
                                desktopStream = await navigator.mediaDevices.getUserMedia(
                                    {
                                        audio: false,
                                        video: {
                                            //@ts-ignore
                                            mandatory: {
                                                chromeMediaSource: 'screen'
                                            }
                                        }
                                    }
                                );
                                (window as any).toastr.info("获取【无声屏幕】的流 ==》成功");
                            }

                        } else {
                            (window as any).toastr.info('准备获取【有声应用】的流');

                            try {
                                desktopStream = await navigator.mediaDevices.getUserMedia({
                                    audio: {
                                        // echoCancellation:supported.echoCancellation || false,
                                        // noiseSuppression: true,
                                        // deviceId:   source.id,
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'desktop',
                                            chromeMediaSourceId: source.id
                                        }
                                    },
                                    video: {
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'desktop',
                                            chromeMediaSourceId: sourceId,
                                            minWidth: screen.width,
                                            maxWidth: screen.width,
                                            minHeight: screen.height,
                                            maxHeight: screen.height
                                        }
                                    }
                                });
                                (window as any).toastr.info('获取【有声应用】的流 ==》 成功');

                            } catch (deskTopError) {
                                console.error(deskTopError);
                                (window as any).toastr.info('获取【有声应用】的流 ==》 失败，切换成 【无声应用】的流');
                                desktopStream = await navigator.mediaDevices.getUserMedia({
                                    audio: false,
                                    video: {
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'desktop',
                                            chromeMediaSourceId: sourceId,
                                            minWidth: screen.width,
                                            maxWidth: screen.width,
                                            minHeight: screen.height,
                                            maxHeight: screen.height
                                        }
                                    }
                                });

                                (window as any).toastr.info('获取【无声应用】的流 ==>成功');


                            }

                        }

                        if (desktopStream == null) {
                            return;
                        }
                        let leftVideo = document.getElementById('left-video');
                        // 将捕获的流放到右上角的video中
                        // @ts-ignore
                        leftVideo.srcObject = desktopStream;
                        // @ts-ignore
                        leftVideo.volume = 0.0;
                        // @ts-ignore
                        leftVideo.onloadedmetadata = (e) => leftVideo.play();
                        layui.layer.closeAll();

                        // (window as any).streamToWebRTC.run(desktopStream);
                        try {
             
                            let videoTrack =  desktopStream.getVideoTracks()[0];
                            
                            var sender = (window as any).rtcPeerConnection.getSenders().find(function (s) {
                                return s.track.kind == videoTrack.kind;
                            });
                            
                            if(sender){
                                console.log(sender);
                                
                                console.log('sender 替换 视频轨道');
                                try {
                                    let trackReplacedPromise  = await sender.replaceTrack(videoTrack);
                                    console.log(trackReplacedPromise);
                                    
                                } catch (error) {
                                    console.error(error);
                                }
                            }else{
                                ((window as any).rtcPeerConnection as RTCPeerConnection).addTrack((desktopStream as MediaStream).getVideoTracks()[0], (window as any).localStream);
                            }
                            
                            // ((window as any).rtcPeerConnection as RTCPeerConnection).addTrack((desktopStream as MediaStream).getVideoTracks()[0], (window as any).localStream);

                      

                                

                        } catch (error) {
                            console.error(error);
                        }


                    });

                } catch (error) {
                    console.error(error);
                }
            }



        });
    }
}

