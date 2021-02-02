import { desktopCapturer, NativeImage, screen as electronScreen } from "electron";
import $ = require('jquery');

export default class ScreenMeeting {



    public run() {
        console.log('run');

        let html = $('<div class="window-item-content"></div>');
        layui.layer.open({
            type: 1,
            title: '选择窗口',
            area: ['640px', '500px'],
            content: html[0].outerHTML
        })
        // navigator.webkitGetUserMedia 时创建一个约束对象，如果使用 desktopCapturer 的资源，
        // 必须设置 chromeMediaSource 为 "desktop" ，并且 audio 为 false.
        //如果你想捕获整个桌面的 audio 和 video，你可以设置 chromeMediaSource 为 "screen" ，和 audio
        // 为 true. 当使用这个
        //的时候，不可以指定一个 chromeMediaSourceId.


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
                        let sourceId = $(`input[value="${source.id}"]`).val();
                        console.log(sourceId);
                        let desktopStream = null;
                        if (sourceId == 'screen:0:0') {
                            // 获取的是窗口，做特殊处理
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
                            ).catch(deskTopError => {
                                console.error(deskTopError);
                            });
                        } else {

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
                            }).catch(deskTopError => {
                                console.error(deskTopError);
                            });
                        }

                        if (desktopStream == null) {
                            return ;
                        }
                        let leftVideo = document.getElementById('left-video');
                        // @ts-ignore
                        leftVideo.srcObject = desktopStream;
                        // @ts-ignore
                        leftVideo.onloadedmetadata = (e) => leftVideo.play();
                        layui.layer.closeAll();
                        (window as any).streamToWebRTC.run(desktopStream);
                    });

                } catch (error) {
                    console.error(error);
                }
            }



        });
    }
}

   // if (source.id === 'screen:0:0') {
                //     try {
                //         const desktopStream = await navigator.mediaDevices.getUserMedia({
                //             audio: false,
                //             video: {
                //                 //@ts-ignore
                //                 mandatory: {
                //                     chromeMediaSource: 'desktop',
                //                     chromeMediaSourceId: 'screen:0:0',
                //                     minWidth: 1280,
                //                     maxWidth: 1280,
                //                     minHeight: 720,
                //                     maxHeight: 720
                //                 }
                //             }
                //         }).catch(deskTopError => {
                //             console.error(deskTopError);
                //         });

                //         (window as any).desktopStream = desktopStream;

                //     } catch (e) {

                //     }
                //     return
                // }