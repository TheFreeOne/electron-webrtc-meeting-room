import { desktopCapturer } from "electron";

export default class VideoMeeting {
    
    public async run():Promise<MediaStream> {
        try {
            const streamConstraints = {
                audio: false,
                video: true
            };
            let videoStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
            return videoStream;
        } catch (error) {
            console.error(error);
            console.dir(error);
        }
         
    
    }
}