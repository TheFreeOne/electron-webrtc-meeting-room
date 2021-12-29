import { desktopCapturer } from "electron";

export default class VideoMeeting {

    public async getStream(): Promise<MediaStream> {
        try {
            // https://blog.csdn.net/keith837/article/details/44818841
            const streamConstraints = {

                audio: false,
                // video: true
                // audio: false,
                video: {
                    deviceId: $('#video-select').val(),
                    width: {ideal: 1280,min:320},
                    height: {ideal:760,min:240},
                    frameRate:{ideal: 20,min:10,max:60}
                    // echoCancellation: true,
                    // sampleRate:30,
                    // groupId: $('#video-select').val() as ConstrainDOMString
                    // optional: [{ deviceId: $('#video-select').val() }]
                }
            };
            // @ts-ignore
            let videoStream = await navigator.mediaDevices.getUserMedia(streamConstraints);
            console.log(videoStream.getVideoTracks()[0].getSettings());
            
            return videoStream;
        } catch (error) {
            console.error(error);
            console.dir(error);
            (window as any).toastr.error('无法获取摄像头<br>请检查麦克风权限和摄像头！！！');
        }

    }
}