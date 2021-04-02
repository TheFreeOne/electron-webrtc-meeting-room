import {app, BrowserWindow, globalShortcut, screen, session} from 'electron';
import IpcMainListener from './IpcMainListener';
import * as log from 'electron-log';
// const log = require('electron-log');

let mainWindow: BrowserWindow;
let ipcMainListener:IpcMainListener;

 // 日志文件等级，默认值：false
 log.transports.file.level = 'debug';
 // 日志控制台等级，默认值：false
 log.transports.console.level = 'debug';
 // 日志文件名，默认：main.log
 log.transports.file.fileName = 'main.log';
 // 日志格式，默认：[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}
 log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}';
 // 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
 log.transports.file.maxSize = 1048576;
 // 日志文件位置：C:\Users\%USERPROFILE%\AppData\Roaming\Electron\logs
 // 完整的日志路径：log.transports.file.file，优先级高于 appName、fileName
 log.transports.file.file = './electron-webrtc-log.log';


function createWindow() {
    mainWindow = new BrowserWindow({
        title: '会议室',
        width: 340,
        height: 490,
        minWidth: 80,
        minHeight: 60,
        icon: 'icon.ico',
        resizable:true,
        
        maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
        maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
        show: false,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        }
        
    });

    mainWindow.loadFile('./html/login/login.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.show();
        ipcMainListener = new IpcMainListener(mainWindow);

        // 注册调试快捷键
        globalShortcut.register('CommandOrControl+Alt+O', function () {
            BrowserWindow.getFocusedWindow().webContents.openDevTools();
        });
        log.debug('创建了一个窗口');
    });

    mainWindow.on('closed',()=>{
        app.quit();
    });
}

app.on('ready', () => {
    createWindow();
    
    session.fromPartition("default").setPermissionRequestHandler((webContents, permission, callback) => {
        let allowedPermissions = ["audioCapture"]; 
        // Full list here: https://developer.chrome.com/extensions/declare_permissions#manifest
        console.log('setPermissionRequestHandler ');
        
        if (allowedPermissions.includes(permission)) {
            callback(true); // Approve permission request
        } else {
            console.error(
                `The application tried to request permission for '${permission}'. This permission was not whitelisted and has been blocked.`
            );
    
            callback(false); // Deny
        }
    });
    
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on('will-quit', function () {
    globalShortcut.unregisterAll();
})


