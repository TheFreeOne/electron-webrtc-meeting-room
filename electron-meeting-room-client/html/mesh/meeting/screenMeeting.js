"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const $ = require("jquery");
class ScreenMeeting {
    run() {
        let html = $('<div class="window-item-content"></div>');
        layui.layer.open({
            type: 1,
            title: '选择窗口',
            area: ['640px', '500px'],
            content: html[0].outerHTML
        });
        var supported = navigator.mediaDevices.getSupportedConstraints();
        window.supported = supported;
        // navigator.webkitGetUserMedia 时创建一个约束对象，如果使用 desktopCapturer 的资源，
        // 必须设置 chromeMediaSource 为 "desktop" ，并且 audio 为 false.
        //如果你想捕获整个桌面的 audio 和 video，你可以设置 chromeMediaSource 为 "screen" ，和 audio
        // 为 true. 当使用这个
        //的时候，不可以指定一个 chromeMediaSourceId.
        var supported = navigator.mediaDevices.getSupportedConstraints();
        window.supported = supported;
        // 这个方法不会不做最小化的软件窗口，即使任务栏有图标
        electron_1.desktopCapturer.getSources({ types: ['window', 'screen'], fetchWindowIcons: true }).then((sources) => __awaiter(this, void 0, void 0, function* () {
            console.log(sources);
            for (const source of sources) {
                try {
                    let thumbnail = source.thumbnail;
                    let windowVideoItem = $(`<div class="window-item"   >
                        <input type="hidden" value="${source.id}">
                        <img src="${thumbnail.toDataURL()}" ></img>
                        <p>${source.name}</p>
                      
                    </div>`);
                    $('.window-item-content').append(windowVideoItem);
                    $(`input[value="${source.id}"]`).parents('.window-item').off().on('click', () => __awaiter(this, void 0, void 0, function* () {
                        var constraints = {};
                        let sourceId = $(`input[value="${source.id}"]`).val();
                        console.log(sourceId);
                        let desktopStream = null;
                        if (sourceId.startsWith('screen:')) {
                            console.log("准备获取【有声屏幕】的流");
                            // 获取的是窗口，做特殊处理
                            try {
                                desktopStream = yield navigator.mediaDevices.getUserMedia({
                                    // audio: {
                                    //     //@ts-ignore
                                    //     mandatory: {
                                    //         chromeMediaSource: 'desktop',
                                    //         chromeMediaSourceId: source.id
                                    //     }
                                    // },
                                    video: {
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'screen',
                                            maxFrameRate: 20,
                                            minWidth: 1280,
                                            maxWidth: 1280,
                                            minHeight: 720,
                                            maxHeight: 720
                                        }
                                    }
                                });
                                window.toastr.info("获取【有声屏幕】的流 ==》 成功");
                            }
                            catch (deskTopError) {
                                console.error(deskTopError);
                                window.toastr.info("获取【有声屏幕】的流 错误，切换【无声屏幕】流");
                                desktopStream = yield navigator.mediaDevices.getUserMedia({
                                    audio: false,
                                    video: {
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'screen'
                                        }
                                    }
                                });
                                window.toastr.info("获取【无声屏幕】的流 ==》成功");
                            }
                        }
                        else {
                            window.toastr.info('准备获取【有声应用】的流');
                            try {
                                desktopStream = yield navigator.mediaDevices.getUserMedia({
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
                                            maxFrameRate: 20,
                                        }
                                    }
                                });
                                window.toastr.info('获取【有声应用】的流 ==》 成功');
                            }
                            catch (deskTopError) {
                                console.error(deskTopError);
                                window.toastr.info('获取【有声应用】的流 ==》 失败，切换成 【无声应用】的流');
                                desktopStream = yield navigator.mediaDevices.getUserMedia({
                                    audio: false,
                                    video: {
                                        //@ts-ignore
                                        mandatory: {
                                            chromeMediaSource: 'desktop',
                                            chromeMediaSourceId: sourceId,
                                            minWidth: screen.width,
                                            maxWidth: screen.width,
                                            minHeight: screen.height,
                                            maxHeight: screen.height,
                                            maxFrameRate: 20
                                        }
                                    }
                                });
                                window.toastr.info('获取【无声应用】的流 ==>成功');
                            }
                        }
                        if (desktopStream == null) {
                            return;
                        }
                        let leftVideo = window.myScreenVideo;
                        // 将捕获的流放到右上角的video中
                        // @ts-ignore
                        leftVideo.srcObject = desktopStream;
                        // @ts-ignore
                        leftVideo.volume = 0.0;
                        // @ts-ignore
                        try {
                            leftVideo.onloadedmetadata = (e) => leftVideo.play();
                        }
                        catch (error) {
                            console.error(error);
                        }
                        layui.layer.closeAll();
                        // (window as any).streamToWebRTC.run(desktopStream);
                        try {
                            let desktopTrack = desktopStream.getVideoTracks()[0];
                            for (let rtcPeerConnection of window.rtcPcMap.values()) {
                                let sender = rtcPeerConnection.getSenders()[2];
                                if (sender) {
                                    console.log(sender);
                                    console.log('sender 替换 视频轨道');
                                    let trackReplacedPromise = yield sender.replaceTrack(desktopTrack);
                                    console.log(trackReplacedPromise);
                                }
                            }
                            ;
                            console.log(desktopTrack.getSettings());
                            let localStream = window.localStream;
                            localStream = new MediaStream([localStream.getTracks()[0], localStream.getTracks()[1], desktopTrack]);
                            window.localStream = localStream;
                        }
                        catch (error) {
                            console.error(error);
                        }
                    }));
                }
                catch (error) {
                    console.error(error);
                }
            }
        }));
    }
}
exports.default = ScreenMeeting;
//# sourceMappingURL=screenMeeting.js.map