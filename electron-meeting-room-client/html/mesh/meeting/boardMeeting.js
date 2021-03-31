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
const ChannelConstant_1 = require("../../../util/ChannelConstant");
class BoardMeeting {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let uuid = electron_1.ipcRenderer.sendSync(ChannelConstant_1.default.CREATE_BOARD_WINODW);
            let sources = yield electron_1.desktopCapturer.getSources({ types: ['window'] });
            let source = sources.find(s => {
                return s.name == uuid;
            });
            let boardStream = yield navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    //@ts-ignore
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: source.id,
                    }
                }
            });
            return boardStream;
        });
    }
}
exports.default = BoardMeeting;
//# sourceMappingURL=boardMeeting.js.map