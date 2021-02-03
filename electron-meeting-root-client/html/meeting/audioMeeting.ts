import { desktopCapturer } from "electron";


export default class AudioMeeting {


    public async run() {

        let audioStream = null;

        try {
            // 麦克风声音
            audioStream = await navigator.mediaDevices.getUserMedia({
                video: false, audio: true
                // video: false, audio: {
                //     echoCancellation: true,
                //     noiseSuppression: true,
                //     sampleRate: 44100
                // }
            });

        } catch (voiceError) {
            ; (window as any).toastr.error('获取麦克风出错');
            console.log('voiceError');
            if (voiceError.message == 'Requested device not found') {
                ; (window as any).toastr.error('没有找到麦克风设备');
            } else {
                console.error(voiceError);
            }
            
            ;(window as any).toastr.info('切换为获取系统声音');
            //@ts-ignore
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            // 屏幕画面&系统声音
            let sources = await desktopCapturer.getSources({ types: ['screen'] });

            (window as any).desktopCapturer = desktopCapturer

            //screen:0:0
            for (const source of sources) {
                // 一般只获取主屏幕的音频
                if (source.id.startsWith('screen:')) {
                    try {
                        console.log('source.id', source.id);

                        // @ts-ignore
                        const desktopAudioStream = await navigator.mediaDevices.getUserMedia({
                            audio: {
                                //@ts-ignore
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id
                                }
                            },
                            video: {
                                //@ts-ignore
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id
                                }
                            }
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if (deskTopError.message == 'Requested device not found') {
                                layui.layer.msg('没有找到相关设备')
                            } else if (deskTopError.message == 'Permission denied') {
                                (window as any).toastr.info('没有获取屏幕画面&系统声音权限');
                            }
                        });

                        (window as any).desktopAudioStream = desktopAudioStream;
                        // @ts-ignore
                        return desktopAudioStream.getAudioTracks()[0];
                    } catch (e) {
                        console.dir(e);
                    }

                }
            }



        }







        // WebAudioApi


    }
}
