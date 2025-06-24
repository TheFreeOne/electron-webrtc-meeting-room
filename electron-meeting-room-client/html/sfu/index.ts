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
    "onclick": undefined,
    "showDuration": 300,
    "hideDuration": 1000,
    "timeOut": 5000,
    "extendedTimeOut": 1000,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};
var roomNumber :any;
(window as any).toastr = toastr;
(window as any).RoomClient = RoomClient;
(window as any).$ = $;
// 人员 人员id，人员名称
var personMap = new Map<string,string>();

//@ts-ignore
const socket = io(window.config.sfuServer, { path: '/socket.io' });

ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber, _actionType,_nickname,_password) => {
  console.log(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS)
  //@ts-ignore
  document.getElementById("roomidInput").value = _roomNumber;
  roomNumber = _roomNumber;
  let nickname = _nickname || 'bob' + Math.round(Math.random() * 1000);
  console.log('nickname',nickname);
  
  joinRoom( nickname , roomNumber,_password);
});


let producer = null;
// socketIo 同步设置
socket.request = function request(type: any, data = {}) {
  return new Promise((resolve, reject) => {
    socket.emit(type, data, (data: any) => {
      if (data.error) {
        reject(data.error)
      } else {
        resolve(data)
      }
    })
  })
}

let roomClient: RoomClient | null = null;

/**
 * 加入房间
 * @param name 以此参数为加入房间时的昵称
 * @param roomId 房间号
 * @param password 房间的密码
 */
function joinRoom(name: any, roomId: any, password: any) {
  if (roomClient && roomClient.isOpen()) {
    console.log('already connected to a room')
  } else {
    //@ts-ignore
    roomClient = new RoomClient(localMedia, remoteVideos,  window.mediasoupClient, socket, roomId, name,password, roomOpen)
    addListeners()
  }

}

/**
 * 加入之后一些操作
 */
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
  control.className = 'layui-form'
  //@ts-ignore
  // reveal(videoMedia)
}
/**
 * 隐藏元素
 * @param elem
 */
function hide(elem:any) {
  $(elem).hide();
}

/**
 * 显示元素
 * @param elem 
 */
function reveal(elem:any) {
  $(elem).show();
}


function addListeners() {
  roomClient?.on(RoomClient.EVENTS.startScreen, () => {
    //@ts-ignore
    hide(startScreenButton)
    //@ts-ignore
    reveal(stopScreenButton)
  })

  roomClient?.on(RoomClient.EVENTS.stopScreen, () => {
    //@ts-ignore
    hide(stopScreenButton)
    //@ts-ignore
    reveal(startScreenButton)

  })

  roomClient?.on(RoomClient.EVENTS.stopAudio, () => {
    //@ts-ignore
    hide(stopAudioButton)
    //@ts-ignore
    reveal(startAudioButton)

  })
  roomClient?.on(RoomClient.EVENTS.startAudio, () => {
    //@ts-ignore
    hide(startAudioButton)
    //@ts-ignore
    reveal(stopAudioButton)
  })

  roomClient?.on(RoomClient.EVENTS.startVideo, () => {
    //@ts-ignore
    hide(startVideoButton)
    //@ts-ignore
    reveal(stopVideoButton)
  })
  roomClient?.on(RoomClient.EVENTS.stopVideo, () => {
    //@ts-ignore
    hide(stopVideoButton)
    //@ts-ignore
    reveal(startVideoButton)
  })
  roomClient?.on(RoomClient.EVENTS.exitRoom, () => {
    //@ts-ignore
    hide(control)
    //@ts-ignore
    reveal(login)
    //@ts-ignore
    // hide(videoMedia)
  })
}

//  加载可支持的设备
navigator.mediaDevices.enumerateDevices().then(devices => {

  // 2022-05-17 添加系统声音
  let audioDefaultOption = document.createElement('option');
  audioDefaultOption.value = 'system';
  audioDefaultOption.innerText = '系统声音';
  // @ts-ignore
  audioSelect.appendChild(audioDefaultOption);

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
    layui.form.render('select')
  })
});
// 复制文本
const copyRoomNumberButton = document.getElementById('copyRoomNumberButton')
if(copyRoomNumberButton) {
  copyRoomNumberButton.onclick = function(){
    clipboard.writeText(roomNumber as string, 'clipboard');
    layui.layer.msg('复制房间号成功');
  }
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
// layui事件监听
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
  (window as any).mainBodyFull = false
  $('#control-panel-max-min').on('click', (e) => {
    console.log(`$('#control').css('height')`, $('#main-body').css('height'))
    console.log(`(window as any).mainBodyFull`, (window as any).mainBodyFull)
    if ((window as any).mainBodyFull) {
      // 恢复
      $('#main-body').addClass('main-body-height')
      $('#control-panel-max-min').css('transform', 'rotate(90deg)')
    } else {
      // 最大化
      $('#main-body').removeClass('main-body-height')
      $('#control-panel-max-min').css('transform', 'rotate(-90deg)')
    }
    (window as any).mainBodyFull = !(window as any).mainBodyFull
  })

  // 使用layui监听音量显示开关
  form.on('switch(audioWaveStatus)', function (data) {
    // 显示
    if (data.elem.checked) {
      $('.main-content').first().removeClass('layui-col-xs12').addClass('layui-col-xs10')
      $('.left-content').first().show()
    } else {
      // 右侧不显示
      $('.left-content').first().hide()
      $('.main-content').first().removeClass('layui-col-xs10').addClass('layui-col-xs12')
    }
  });

})


function videoMax(e:any){
  console.log(e);
 
    $(e).toggleClass('video-max')
 
}

//@ts-ignore
window.videoMax = videoMax ;
export = {}
