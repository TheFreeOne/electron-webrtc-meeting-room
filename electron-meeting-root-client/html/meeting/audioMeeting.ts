export default class AudioMeeting {
    public  async run() {
        // 屏幕画面&系统声音
        // @ts-ignore
        let desktopStream: MediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        // 麦克风声音
        let voiceStream: MediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        console.log('desktopStream');
        console.log(desktopStream);
        console.log('voiceStream');
        console.log(voiceStream);
        
    }
}
 