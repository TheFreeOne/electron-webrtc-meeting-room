import { BrowserWindow, ipcMain } from "electron";
import ChannelConstant from "./util/ChannelConstant";

export default class IpcMainListener{

    private _token;

    private _nickname;

    private _mainWindow:BrowserWindow;

    

    public startListen(){
        ipcMain.on(ChannelConstant.LOGIN_SUCCESS,(event,data)=>{
            this._token = data.token;
            this._nickname = data.nickname;
            this._mainWindow.loadFile('index.html');
            
        });
    }

    constructor(mainWindow:BrowserWindow){
        this._mainWindow = mainWindow;
        this.startListen();
    }
    
}