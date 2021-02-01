import { BrowserWindow, ipcMain,screen} from "electron";
import ChannelConstant from "./util/ChannelConstant";

export default class IpcMainListener{

    private _token;

    private _nickname;

    private _mainWindow:BrowserWindow;

    private _meetingWindow:BrowserWindow ;

    

    public startListen(){
        ipcMain.on(ChannelConstant.LOGIN_SUCCESS,(event,data)=>{
            this._token = data.token;
            this._nickname = data.nickname;
            this._mainWindow.loadFile('index.html');

        });

        ipcMain.on(ChannelConstant.GET_TOKEN,(event)=>{
            event.returnValue = this._token;
        });

        ipcMain.on(ChannelConstant.CREATE_MEETING_WINDOW,(event,roomNumber)=>{
            this._meetingWindow = new BrowserWindow({
                title: '会议室--会议中：'+roomNumber,
                width: 1366,
                height: 768,
                minWidth: 1366,
                minHeight: 768,
                icon: 'icon.ico',
                parent: this._mainWindow,
                modal: true,
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
                this._meetingWindow.webContents.send(ChannelConstant.CREATE_MEETING_WINDOW_SUCCESS,roomNumber);
            });
        });
    }

    constructor(mainWindow:BrowserWindow){
        this._mainWindow = mainWindow;
        this.startListen();
    }
    
}