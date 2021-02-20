import { BrowserWindow, ipcMain,screen} from "electron";
import ChannelConstant from "./util/ChannelConstant";

export default class IpcMainListener{

    private _token;

    private _nickname;

    private _mainWindow:BrowserWindow;

    private _meetingWindow:BrowserWindow ;



    public startListen(){

        // 登陆成功
        ipcMain.on(ChannelConstant.LOGIN_SUCCESS,(event,data)=>{
            this._token = data.token;
            this._nickname = data.nickname;
            this._mainWindow.loadFile('index.html');

        });

        // 获取token
        ipcMain.on(ChannelConstant.GET_TOKEN,(event)=>{
            event.returnValue = this._token;
        });

        // 获取昵称
        ipcMain.on(ChannelConstant.GET_NICKNAME,(event)=>{
            event.returnValue = this._nickname;
        });

        // 创建会议窗口
        ipcMain.on(ChannelConstant.CREATE_MEETING_WINDOW,(event,roomNumber,actionType)=>{
            this._meetingWindow = new BrowserWindow({
                title: '会议室--会议中：'+roomNumber,
                width: 830,
                height: 560,
                minWidth: 830,
                minHeight: 560,
                icon: 'icon.ico',
                // parent: this._mainWindow,
                // modal: true,
                autoHideMenuBar:true,
                maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
                maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
                show: false,
                useContentSize: true,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: true,
                    webSecurity:false
                }
            });
            this._meetingWindow.loadFile('./html/meeting/meeting.html');
            this._meetingWindow.webContents.openDevTools()
            this._meetingWindow.on('ready-to-show',()=>{
                this._meetingWindow.show();
                this._meetingWindow.webContents.send(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS,roomNumber,actionType);
            });
        });

        ipcMain.on(ChannelConstant.CREATE_BOARD_WINODW,(event)=>{
            let uuid = this.generateUUID();
            let boardWindow = new BrowserWindow({
                title: uuid,
                width: 830,
                height: 560,
                minWidth: 830,
                minHeight: 560,
                icon:  '/icon.ico',
                // parent:this._mainWindow,
                // modal:true,
                autoHideMenuBar: true,
                show: true,
                frame: true,
                useContentSize: true,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: false,
                    webSecurity: false
                }
            });
            boardWindow.loadFile("./html/whiteboard/board.html");
            boardWindow.on('ready-to-show',()=>{
                event.returnValue = uuid;
            });
                

        });
    }

    constructor(mainWindow:BrowserWindow){
        this._mainWindow = mainWindow;
        this.startListen();
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    }

}
