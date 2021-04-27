import {autoUpdater} from "electron-updater";
import log from "electron-log";
import {app,dialog,BrowserWindow,ipcMain,ipcRenderer,remote} from "electron";

const packages =require('../package.json')



export function updateHandle(win:BrowserWindow):void {
    let message = {
        error: '检查更新出错',
        checking: '正在检查更新……',
        updateAva: '检测到新版本，正在下载……',
        updateNotAva: '现在使用的就是最新版本，不用更新',
    };
    // 设置不自动下载
    autoUpdater.autoDownload = false;
 
    autoUpdater.setFeedURL(`http://127.0.0.1:8031/winrelease/`);
    autoUpdater.on('error', function (error) {
        log.error(error);
        console.log(error);
        if(error.message == "net::ERR_CONNECTION_REFUSED"){
            // dialog.showErrorBox("错误","服务器拒绝访问");
        }else {
            // dialog.showErrorBox("错误","未知错误");
        }
 

    });
    autoUpdater.on('checking-for-update', function () {
        log.log("checking-for-update");
        console.log("checking-for-update");
                
    });
    autoUpdater.on('update-available', function (info) {

        log.log("可更新");
        console.log("可更新");
        
        log.log(info);
        console.dir(info);
        
         
        let btnNumver = dialog.showMessageBoxSync(win,{
            type:'info'
            ,message:'有可用更新，是否下载？'
            ,buttons: ['YES','NO']
        })

        if(btnNumver === 0){
            autoUpdater.downloadUpdate();
            console.log('downloadUpdate');
            
        }
        
 
    });
    autoUpdater.on('update-not-available', function (info) {
       
        // dialog.showMessageBox({
        //     type: 'info',
        //     message: '没有更新'
        // });
        log.log("没有有效的更新");
        console.log("没有有效的更新");
        
        log.log(info)
        console.dir(info)
    });



    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {

        let id = win.id;
 

    });

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {

      
        log.log("下载完成");
        console.log("下载完成");
        
        dialog.showMessageBox(win, {
            title: 'question',
            message: '下载完成，现在安装么',
            noLink: true,
            buttons: ['确定', '取消']
        }).then(r  =>{
            if(r.response == 0){
                autoUpdater.quitAndInstall();
                app.quit();
            }
        });

    });

    autoUpdater.checkForUpdates();
}
