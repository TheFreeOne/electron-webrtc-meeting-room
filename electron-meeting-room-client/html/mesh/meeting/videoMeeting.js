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
class VideoMeeting {
    getStream() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // https://blog.csdn.net/keith837/article/details/44818841
                const streamConstraints = {
                    audio: false,
                    // video: true
                    // audio: false,
                    video: {
                        deviceId: $('#video-select').val(),
                        width: { ideal: 1280, min: 320 },
                        height: { ideal: 760, min: 240 },
                        frameRate: { ideal: 20, min: 10, max: 60 }
                        // echoCancellation: true,
                        // sampleRate:30,
                        // groupId: $('#video-select').val() as ConstrainDOMString
                        // optional: [{ deviceId: $('#video-select').val() }]
                    }
                };
                // @ts-ignore
                let videoStream = yield navigator.mediaDevices.getUserMedia(streamConstraints);
                console.log(videoStream.getVideoTracks()[0].getSettings());
                return videoStream;
            }
            catch (error) {
                console.error(error);
                console.dir(error);
                window.toastr.error('无法获取摄像头<br>请检查麦克风权限和摄像头！！！');
            }
        });
    }
}
exports.default = VideoMeeting;
//# sourceMappingURL=videoMeeting.js.map