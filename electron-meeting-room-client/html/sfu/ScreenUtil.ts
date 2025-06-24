import { NativeImage, screen as electronScreen } from "electron";
import $ = require('jquery');
const { desktopCapturer } = require("@electron/remote");

export default class ScreenUtil {

    /**
     * getScreenStream
     */
    public async getScreenStream() {

        // let defaultWidth = 1280;
        // let defaultHeight = 760;

        // try{
        //     let resolution = document.getElementById('video-resolution');
        //     if(resolution){
        //         //@ts-ignore
        //         let value = resolution.value;
        //         if(value === '1280*768'){
        //               defaultWidth = 1280;
        //               defaultHeight = 760;
        //         }else if(value === '1920*1080'){
        //             defaultWidth = 1920;
        //             defaultHeight = 1080;
        //         }
        //     }
        // }catch(e){
        //     console.error(e)
        // }
        let _desktopStream;
        let sources = await desktopCapturer.getSources({ types: ['screen'], fetchWindowIcons: false });
        for (let source of sources ) {
            
            if (source.id.startsWith('screen:')) {
                console.log("准备获取【屏幕】的流");
 
                _desktopStream = await navigator.mediaDevices.getUserMedia(
                    {
                        audio: false,
                        video: {
                            // @ts-ignore
                            mandatory: {
                                chromeMediaSource: 'screen',
                                // chromeMediaSource: 'desktop',
                                chromeMediaSourceId: source.id,
                                minFrameRate: 30,
                                maxFrameRate: 30,
                                // minRate: 60,
                                minWidth: window.screen.width,
                                maxWidth: window.screen.width,
                                minHeight: window.screen.height,
                                maxHeight: window.screen.height
                              }
                        }
                    }
                );

                (window as any).toastr.info("获取【屏幕】成功");

                console.log(_desktopStream)
                return _desktopStream;
            }

        }
    }
}

