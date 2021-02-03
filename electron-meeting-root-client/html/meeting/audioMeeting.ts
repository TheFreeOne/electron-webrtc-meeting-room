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
                console.error(source.id)
                if (source.id.startsWith('screen:')) {
                    try {
                        // @ts-ignore
                        const desktopAudioStream = await navigator.mediaDevices.getDisplayMedia({
                            audio: {
                                echoCancellation: true,
                                noiseSuppression: true,
                                sampleRate: 44100
                              },
                            video: true
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if(deskTopError.message == 'Requested device not found'){
                                layui.layer.msg('没有找到相关设备')
                            }else if(deskTopError.message == 'Permission denied'){
                                (window as any).toastr.info('没有获取屏幕画面&系统声音权限');
                            }
                        });

                        (window as any).desktopAudioStream = desktopAudioStream;

                    } catch (e) {
                        console.dir(e);
                    }
                    return
                }
            }

        });
        // 麦克风声音
        navigator.mediaDevices.getUserMedia({ video: false, audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          } }).then(voiceStream => {
            console.log('voiceStream');
            console.log(voiceStream);
        }).catch(voiceError => {
            console.log('voiceError');
            if(voiceError.message == 'Requested device not found'){
                layui.layer.msg('没有找到麦克风设备')
            }
           
        });

        // WebAudioApi
         

    }
}
