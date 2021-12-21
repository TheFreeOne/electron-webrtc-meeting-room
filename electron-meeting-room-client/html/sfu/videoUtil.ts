import { desktopCapturer } from "electron";

export default class VideoUtil {

    constructor(){
        
    }

    public async getStream(): Promise<MediaStream> {

        let defaultWidth = 1280;
        let defaultHeight = 760;

        try{
            let resolution = document.getElementById('video-resolution');
            if(resolution){
                //@ts-ignore
                let value = resolution.value;
                if(value === '1280*768'){
                      defaultWidth = 1280;
                      defaultHeight = 760;
                }else if(value === '1920*1080'){
                    defaultWidth = 1920;
                    defaultHeight = 1080;
                }
            }
        }catch(e){}

        try {
            // https://blog.csdn.net/keith837/article/details/44818841
            const streamConstraints = {

                audio: false,
                // video: true
                // audio: false,
                video: {
                    deviceId: $('#video-select').val(),
                    width: {ideal: defaultWidth,min:320},
                    height: {ideal:defaultHeight,min:240},
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
 