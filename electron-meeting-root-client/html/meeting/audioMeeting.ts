import { desktopCapturer } from "electron";


export default class AudioMeeting {

    /**
     * 一开始会尝试获取麦克风流，失败后改成获取电脑系统声音
     */
    public async getStream(): Promise<MediaStream> {

        let audioStream = null;

        //@ts-ignore
        let canvasCaptureMediaStreamTrack = document.createElement('canvas').captureStream().getVideoTracks()[0] as MediaStreamTrack;
        canvasCaptureMediaStreamTrack.enabled = false;

        // https://www.cnblogs.com/olivers/p/12609427.html

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


            //@ts-ignore
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            // 屏幕画面&系统声音
            let sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });

            (window as any).desktopCapturer = desktopCapturer;

            //screen:0:0
            for (const source of sources) {
                // 一般只获取主屏幕的音频
                if (source.id.startsWith('screen:')) {
                    try {
                        console.log('source.id', source.id);

                        // @ts-ignore
                        const desktopAudioStream = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                                //@ts-ignore
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: source.id,
                                    minWidth: 2,
                                    maxWidth: 2,
                                    minHeight: 2,
                                    maxHeight: 2

                                }
                            }
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if (deskTopError.message == 'Requested device not found') {
                                (window as any).toastr.info('没有找到系统声音的相关设备')
                            } else if (deskTopError.message == 'Permission denied') {
                                (window as any).toastr.info('没有获取屏幕画面&系统声音权限');
                            }
                        });

                        // 生成一个3个轨道，1个音频2个视频 

                        if ((desktopAudioStream as MediaStream).getVideoTracks().length > 0) {

                            ((desktopAudioStream as MediaStream).getVideoTracks()[0] as MediaStreamTrack).enabled = false;
                            (audioStream as MediaStream).addTrack((desktopAudioStream as MediaStream).getVideoTracks()[0]);
                            (audioStream as MediaStream).addTrack((desktopAudioStream as MediaStream).getVideoTracks()[0].clone());
                           
                        }

                    } catch (e) {
                        console.dir(e);
                    }

                }
            }

           
            return audioStream;
        } catch (voiceError) {
            ; (window as any).toastr.error('获取麦克风出错');
            console.log('voiceError');
            if (voiceError.message == 'Requested device not found') {
                ; (window as any).toastr.error('没有找到麦克风设备');
            } else {
                console.error(voiceError);
            }

            ; (window as any).toastr.info('切换为获取系统声音');
            //@ts-ignore
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            // 屏幕画面&系统声音
            let sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 }  });

            (window as any).desktopCapturer = desktopCapturer;

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
                                    chromeMediaSourceId: source.id,
                                    minWidth: 2,
                                    maxWidth: 2,
                                    minHeight: 2,
                                    maxHeight: 2
                                }
                            }
                        }).catch(deskTopError => {
                            console.dir(deskTopError);
                            if (deskTopError.message == 'Requested device not found') {
                                (window as any).toastr.info('没有找到系统声音的相关设备')
                            } else if (deskTopError.message == 'Permission denied') {
                                (window as any).toastr.info('没有获取屏幕画面&系统声音权限');
                            }
                        });

                        // 生成一个3个轨道，1个音频两个视频，依次是，麦克风 摄像头 ,应用
                        (window as any).desktopAudioStream = desktopAudioStream;

                        if ((window as any).desktopAudioStream.getVideoTracks().length > 0) {
                            // (window as any).desktopAudioStream.removeTrack((window as any).desktopAudioStream.getVideoTracks()[0]);
                            ((window as any).desktopAudioStream.getVideoTracks()[0] as MediaStreamTrack).enabled = false;
                            (desktopAudioStream as MediaStream).addTrack((desktopAudioStream as MediaStream).getVideoTracks()[0].clone());
                        }

               
                        return (window as any).desktopAudioStream;
                    } catch (e) {
                        console.dir(e);
                    }

                }
            }



        }







        // WebAudioApi


    }
}
