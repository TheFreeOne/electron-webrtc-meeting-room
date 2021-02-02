import { desktopCapturer } from "electron";

export default class ScreenMeeting {
    public run() {
        desktopCapturer.getSources({ types: ['screen'] }).then(async sources => {
            console.log(sources);
            (window as any).desktopCapturer = desktopCapturer

            //screen:0:0
            for (const source of sources) {
                if (source.id === 'screen:0:0') {
                    try {
                        const desktopStream = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                                //@ts-ignore
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: 'screen:0:0',
                                    minWidth: 1280,
                                    maxWidth: 1280,
                                    minHeight: 720,
                                    maxHeight: 720
                                }
                            }
                        }).catch(deskTopError => {
                            console.error(deskTopError);
                        });

                        (window as any).desktopStream = desktopStream;

                    } catch (e) {

                    }
                    return
                }
            }

        });
    }
}