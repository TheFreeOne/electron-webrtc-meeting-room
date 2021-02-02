import { desktopCapturer } from "electron";

export default class AudioMeeting {
    public async run() {
        //@ts-ignore
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        // 屏幕画面&系统声音
        // @ts-ignore
        desktopCapturer.getSources({ types: ['screen'] }).then(async sources => {
            console.log(sources);
            (window as any).desktopCapturer = desktopCapturer

            //screen:0:0
            for (const source of sources) {
                if (source.id === 'screen:0:0') {
                    try {
                        const desktopAudioStream = await navigator.mediaDevices.getUserMedia({
                            audio: true,
                            video: false
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if(deskTopError.message == 'Requested device not found'){
                                layui.layer.msg('没有找到相关设备')
                            }
                        });

                        (window as any).desktopAudioStream = desktopAudioStream;

                    } catch (e) {

                    }
                    return
                }
            }

        });
        // 麦克风声音
        navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then(voiceStream => {
            console.log('voiceStream');
            console.log(voiceStream);
        }).catch(voiceError => {
            console.log('voiceError');
            if(voiceError.message == 'Requested device not found'){
                layui.layer.msg('没有找到相关设备')
            }
           
        });

    }
}
