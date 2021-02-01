import {app, BrowserWindow, globalShortcut, screen} from 'electron';
import IpcMainListener from './util/IpcMainListener';

let mainWindow: BrowserWindow;
let ipcMainListener:IpcMainListener;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: '会议室',
        width: 1366,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
        maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
        show: false,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile('./index.html');
    mainWindow.once('ready-to-show', () => {

        // 注册调试快捷键
        globalShortcut.register('CommandOrControl+Alt+P', function () {
            BrowserWindow.getFocusedWindow().webContents.openDevTools();
        });

        // 新建登陆窗口
        let loginWindow = new BrowserWindow({
            title: '会议室--登陆',
            width: 340,
            height: 450,
            parent:mainWindow,
            show: false,
            resizable: false,
            autoHideMenuBar:true,
            useContentSize: true,
            webPreferences: {
                nodeIntegration: true,
                enableRemoteModule: false
            }
        });

        loginWindow.loadFile('./html/login/login.html');
        loginWindow.on("ready-to-show",()=>{
            loginWindow.show();
        });

        ipcMainListener = new IpcMainListener(mainWindow,loginWindow);
    });
}

app.on('ready', () => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on('will-quit', function () {
    globalShortcut.unregisterAll();
})
