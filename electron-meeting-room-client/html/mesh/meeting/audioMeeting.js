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
class AudioMeeting {
    /**
     * 获取系统声音
     */
    getMicrophoneStream() {
        return __awaiter(this, void 0, void 0, function* () {
            let audioStream = null;
            let constraints = {
                video: false,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                    channelCount: { ideal: 2, min: 1 },
                    deviceId: $('#voice-select').val()
                }
            };
            // 麦克风声音
            audioStream = yield navigator.mediaDevices.getUserMedia(constraints);
            let emptyStream = yield this.getEmptyStream();
            // 链家两个视频轨道
            audioStream.addTrack(emptyStream);
            audioStream.addTrack(emptyStream.clone());
            console.log(emptyStream.getSettings());
            return audioStream;
            // 可选的方式获取麦克风
            // audioStream = await navigator.mediaDevices.getUserMedia({
            //     video: false, audio: {
            //         // @ts-ignore
            //         optional: [{ deviceId: $('#voice-select').val() }]
            //     }
            // });
        });
    }
    getSystemStream() {
        return __awaiter(this, void 0, void 0, function* () {
            let sources = yield electron_1.desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
            for (const source of sources) {
                // 一般只获取主屏幕的音频
                if (source.id.startsWith('screen:')) {
                    try {
                        console.log('source.id', source.id);
                        // @ts-ignore
                        const desktopAudioStream = yield navigator.mediaDevices.getUserMedia({
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
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id,
                                    minWidth: 2,
                                    maxWidth: 2,
                                    minHeight: 2,
                                    maxHeight: 2,
                                    maxFrameRate: 2
                                }
                            }
                        });
                        if (desktopAudioStream.getVideoTracks().length > 0) {
                            desktopAudioStream.getVideoTracks()[0].enabled = false;
                            desktopAudioStream.addTrack(desktopAudioStream.getVideoTracks()[0].clone());
                        }
                        return desktopAudioStream;
                    }
                    catch (e) {
                        console.dir(e);
                    }
                }
            }
        });
    }
    /**
     * 获取空的流
     */
    getEmptyStream() {
        return __awaiter(this, void 0, void 0, function* () {
            let sources = yield electron_1.desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
            for (const source of sources) {
                // 一般只获取主屏幕的音频
                if (source.id.startsWith('screen:')) {
                    try {
                        console.log('source.id', source.id);
                        // @ts-ignore
                        const desktopAudioStream = yield navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                                //@ts-ignore
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id,
                                    minWidth: 2,
                                    maxWidth: 2,
                                    minHeight: 2,
                                    maxHeight: 2,
                                    maxFrameRate: 2
                                }
                            }
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if (deskTopError.message == 'Requested device not found') {
                                window.toastr.info('没有找到系统声音的相关设备');
                            }
                            else if (deskTopError.message == 'Permission denied') {
                                window.toastr.info('没有获取屏幕画面&系统声音权限');
                            }
                            else {
                                window.toastr.info('无法获取空流');
                            }
                        });
                        // 生成一个3个轨道，1个音频2个视频
                        if (desktopAudioStream.getVideoTracks().length > 0) {
                            desktopAudioStream.getVideoTracks()[0].enabled = false;
                            return desktopAudioStream.getVideoTracks()[0].clone();
                        }
                        else {
                            window.toastr.info('无法获取空流');
                        }
                    }
                    catch (e) {
                        console.dir(e);
                        window.toastr.info('无法获取空流');
                    }
                }
            }
        });
    }
}
exports.default = AudioMeeting;
//# sourceMappingURL=audioMeeting.js.map