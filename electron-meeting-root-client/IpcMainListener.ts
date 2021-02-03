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
                parent: this._mainWindow,
                // modal: true,
                autoHideMenuBar:true,
                maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
                maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
                show: false,
                useContentSize: true,
                webPreferences: {
                    nodeIntegration: true,
                    enableRemoteModule: false
                }
            });
            this._meetingWindow.loadFile('./html/meeting/meeting.html');
            this._meetingWindow.webContents.openDevTools()
            this._meetingWindow.on('ready-to-show',()=>{
                this._meetingWindow.show();
                this._meetingWindow.webContents.send(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS,roomNumber,actionType);
            });
        });
    }

    constructor(mainWindow:BrowserWindow){
        this._mainWindow = mainWindow;
        this.startListen();
    }
    
}