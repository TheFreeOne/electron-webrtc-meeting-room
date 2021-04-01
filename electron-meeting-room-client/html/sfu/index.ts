import RoomClient from './RoomClient';
import ChannelConstant from  "../../util/ChannelConstant";
import $ = require('jquery');
import toastr = require('toastr');
import { clipboard,ipcRenderer } from 'electron';

console.log(toastr);

toastr.options = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": true,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};
var roomNumber ;
(window as any).toastr = toastr;
(window as any).RoomClient = RoomClient;
(window as any).$ = $;
// 人员 人员id，人员名称
var personMap = new Map<string,string>();

//@ts-ignore
const socket = io(window.config.sfuServer, { path: '/socket.io' });

ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber, _actionType) => {
  console.log(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS)
  //@ts-ignore
  document.getElementById("roomidInput").value = _roomNumber;
  roomNumber = _roomNumber;
  joinRoom( 'bob' + Math.round(Math.random() * 1000) , roomNumber);
});


let producer = null;

socket.request = function request(type, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data) => {
      if (data.error) {
        reject(data.error)
      } else {
        resolve(data)
      }
    })
  })
}

let rc = null;

function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log('already connected to a room')
  } else {
    //@ts-ignore
    rc = new RoomClient(localMedia, remoteVideos,  window.mediasoupClient, socket, room_id, name, roomOpen)
    addListeners()
  }

}
//@ts-ignore
function roomOpen() {
  //@ts-ignore
  login.className = 'hidden'
  //@ts-ignore
  reveal(startAudioButton)
  //@ts-ignore
  hide(stopAudioButton)
  //@ts-ignore
  reveal(startVideoButton)
  //@ts-ignore
  hide(stopVideoButton)
  //@ts-ignore
  reveal(startScreenButton)
  //@ts-ignore
  hide(stopScreenButton)
  //@ts-ignore
  reveal(exitButton)
  //@ts-ignore
  control.className = 'layui-from'
  //@ts-ignore
  // reveal(videoMedia)
}
/**
 * 隐藏元素
 * @param elem
 */
function hide(elem) {
  $(elem).hide();
}

/**
 *
 * @param elem 显示元素
 */
function reveal(elem) {
  $(elem).show();
}


function addListeners() {
  rc.on(RoomClient.EVENTS.startScreen, () => {
    //@ts-ignore
    hide(startScreenButton)
    //@ts-ignore
    reveal(stopScreenButton)
  })

  rc.on(RoomClient.EVENTS.stopScreen, () => {
    //@ts-ignore
    hide(stopScreenButton)
    //@ts-ignore
    reveal(startScreenButton)

  })

  rc.on(RoomClient.EVENTS.stopAudio, () => {
    //@ts-ignore
    hide(stopAudioButton)
    //@ts-ignore
    reveal(startAudioButton)

  })
  rc.on(RoomClient.EVENTS.startAudio, () => {
    //@ts-ignore
    hide(startAudioButton)
    //@ts-ignore
    reveal(stopAudioButton)
  })

  rc.on(RoomClient.EVENTS.startVideo, () => {
    //@ts-ignore
    hide(startVideoButton)
    //@ts-ignore
    reveal(stopVideoButton)
  })
  rc.on(RoomClient.EVENTS.stopVideo, () => {
    //@ts-ignore
    hide(stopVideoButton)
    //@ts-ignore
    reveal(startVideoButton)
  })
  rc.on(RoomClient.EVENTS.exitRoom, () => {
    //@ts-ignore
    hide(control)
    //@ts-ignore
    reveal(login)
    //@ts-ignore
    // hide(videoMedia)
  })
}

// Load mediaDevice options
navigator.mediaDevices.enumerateDevices().then(devices =>
  devices.forEach(device => {
    let el = null;
    if ('audioinput' === device.kind) {
      //@ts-ignore
      el = audioSelect;
    } else if ('videoinput' === device.kind) {
      //@ts-ignore
      el = videoSelect;
    }
    if(!el) return

    let option = document.createElement('option');
    option.value = device.deviceId;
    option.innerText = device.label;
    el.appendChild(option);
  })
);
// 复制文本
document.getElementById('copyRoomNumberButton').onclick = function(){
  clipboard.writeText(roomNumber, 'clipboard');
  layui.layer.msg('复制房间号成功');
}
/**
 *
 * @param audioStream 绘制音频声波
 */
function drawAudioWave(audioStream:MediaStream) {
  //part1: 画布
  let canvas = document.getElementById("audio-wave-canvas");
  let context = (canvas as any).getContext("2d");


  let WIDTH = (canvas as any).width;
  let HEIGHT = (canvas as any).height;



  //part3: 分析器
  let audioContext = new AudioContext();//音频内容
  let src = audioContext.createMediaStreamSource(audioStream);
  let analyser = audioContext.createAnalyser();

  src.connect(analyser);
  // analyser.connect(AudCtx.destination);   // 屏蔽之后不会播放声音
  analyser.fftSize = 128;//快速傅里叶变换, 必须为2的N次方

  let bufferLength = analyser.frequencyBinCount;// = fftSize * 0.5

  //part4: 变量
  let barWidth = (WIDTH / bufferLength) - 1;//间隔1px
  let barHeight;

  let dataArray = new Uint8Array(bufferLength);//8位无符号定长数组

  //part5: 动态监听
  function renderFrame() {
      requestAnimationFrame(renderFrame);//方法renderFrame托管到定时器，无限循环调度，频率<16.6ms/次

      // context.fillStyle = "#000";//黑色背景
      context.fillStyle = "gray";//黑色背景
      context.fillRect(0, 0, WIDTH, HEIGHT);//画布拓展全屏,动态调整

      analyser.getByteFrequencyData(dataArray);//获取当前时刻的音频数据

      //part6: 绘画声压条
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
          let data = dataArray[i];//int,0~255

          let percentV = data / 255;//纵向比例
          let percentH = i / bufferLength;//横向比例

          barHeight = HEIGHT * percentV;

          //gbk,0~255
          let r = 255 * percentV;//值越大越红
          let g = 255 * percentH;//越靠右越绿
          // let b = 50;
          let b = 128;

          context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
          context.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + 1;//间隔1px
      }
  }

  renderFrame();
}

(window as any).drawAudioWave = drawAudioWave;

layui.use(['form'],()=>{
  let form = layui.form;
  form.render();

  $('#startVideoButton').on('click',()=>{
    if($('#stopScreenButton').is(':visible')){
      $('#stopScreenButton').trigger('click');
    }
  });

  $('#startScreenButton').on('click',()=>{
    if($('#stopVideoButton').is(':visible')){
      $('#stopVideoButton').trigger('click');
    }
  });

})
export = {}
