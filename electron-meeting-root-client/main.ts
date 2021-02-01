import {app, BrowserWindow, globalShortcut, screen} from 'electron';
import IpcMainListener from './IpcMainListener';

let mainWindow: BrowserWindow;
let ipcMainListener:IpcMainListener;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: '会议室',
        width: 340,
        height: 400,
        minWidth: 80,
        minHeight: 60,
        icon: 'icon.ico',
        maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
        maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
        show: false,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: false
        }
        
    });

    mainWindow.loadFile('./html/login/login.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.show();
        ipcMainListener = new IpcMainListener(mainWindow);

        // 注册调试快捷键
        globalShortcut.register('CommandOrControl+Alt+P', function () {
            BrowserWindow.getFocusedWindow().webContents.openDevTools();
        });

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
