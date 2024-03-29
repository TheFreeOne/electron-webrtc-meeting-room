import { ipcRenderer } from "electron";
const { desktopCapturer } = require("@electron/remote");
import ChannelConstant from "../../../util/ChannelConstant";

export default class BoardMeeting {
    public async run() {

        let uuid = ipcRenderer.sendSync(ChannelConstant.CREATE_BOARD_WINODW);


        let sources = await desktopCapturer.getSources({ types: ['window'] });

        let source = sources.find((s: { name: any; }) =>{
            return s.name == uuid;
        });
        let boardStream = await navigator.mediaDevices.getUserMedia({
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



    }


}
