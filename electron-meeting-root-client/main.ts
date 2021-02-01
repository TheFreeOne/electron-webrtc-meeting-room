import { app, BrowserWindow, screen } from 'electron';

app. allowRendererProcessReuse = false;
let mainWindow: BrowserWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        title: '主窗口',
        width: 1366,
        height: 768,
        
        minWidth: 800,
        minHeight: 600,
        maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
        maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
        show: false,
        useContentSize: true,  // 这两个属性，完全去除边框
        // frame: false,         // 这两个属性，完全去除边框
        webPreferences: {
            nodeIntegration: true,
           
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile('./index.html');
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.webContents.openDevTools({mode:'right'});



 







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
