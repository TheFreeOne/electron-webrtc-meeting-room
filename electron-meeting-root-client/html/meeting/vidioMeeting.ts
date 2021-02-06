import { desktopCapturer } from "electron";

export default class VideoMeeting {
    
    public async run():Promise<MediaStream> {
        try {
            const streamConstraints = {
                audio: true,
                video: true
            };
            let videoStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
            return videoStream;
        } catch (error) {
            console.error(error);
            console.dir(error);
            (window as any).toastr.error('无法获取摄像头<br>请检查麦克风权限和摄像头！！！');
        }
         
    
    }
}