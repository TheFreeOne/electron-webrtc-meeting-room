import { desktopCapturer } from "electron";

export default class VideoMeeting {
    
    public async getStream():Promise<MediaStream> {
        try {
            const streamConstraints = {

                audio: false,
                // video: true
                // audio: false,
                video: {
                    // echoCancellation: true,
                    // sampleRate:30,
                    // groupId: $('#video-select').val() as ConstrainDOMString
                    optional: [{ deviceId: $('#video-select').val() }]
                }
            };
            // @ts-ignore
            let videoStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
            return videoStream;
        } catch (error) {
            console.error(error);
            console.dir(error);
            (window as any).toastr.error('无法获取摄像头<br>请检查麦克风权限和摄像头！！！');
        }
         
    }
}