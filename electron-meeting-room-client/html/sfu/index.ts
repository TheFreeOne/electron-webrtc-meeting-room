import RoomClient from './RoomClient';
import ChannelConstant from  "../../util/ChannelConstant";
import $ = require('jquery');
import toastr = require('toastr');
const {ipcRenderer} = require("electron");

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


//@ts-ignore
const socket = io(window.config.nodeRoomServer, { path: '/socket.io' });
ipcRenderer.on(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS, async (event, _roomNumber, _actionType) => {
  console.log(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS)
  //@ts-ignore
  document.getElementById("roomidInput").value = _roomNumber;
  roomNumber = _roomNumber;
  joinRoom( 'bob' + Math.round(Math.random() * 1000) , roomNumber);
});


let producer = null;
//@ts-ignore


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

let rc = null

function joinRoom(name, room_id) {
  if (rc && rc.isOpen()) {
    console.log('already connected to a room')
  } else {
    //@ts-ignore
    rc = new RoomClient(localMedia, remoteVideos, remoteAudios, window.mediasoupClient, socket, room_id, name, roomOpen)

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
  control.className = ''
  //@ts-ignore
  // reveal(videoMedia)
}
/**
 * 隐藏元素
 * @param elem
 */
function hide(elem) {
  // elem.className = 'hidden'
  $(elem).hide();
}

/**
 *
 * @param elem 显示元素
 */
function reveal(elem) {
  // elem.className = ''
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
    let el = null
    if ('audioinput' === device.kind) {
      //@ts-ignore
      el = audioSelect
    } else if ('videoinput' === device.kind) {
      //@ts-ignore
      el = videoSelect
    }
    if(!el) return

    let option = document.createElement('option')
    option.value = device.deviceId
    option.innerText = device.label
    el.appendChild(option)
  })
)
export = {}
