### electron-meeting-room-client

> 可以在运行webrtc的时候而不是使用https，如果你想使用https,请自行研究。

使用typescript和electron编写的客户端

### 可能出现的错误

#### 1.`npm install `正常，运行出现`Electron failed to install correctly, please delete node_modules/electron and try installing again`

原因：可能是使用淘宝的镜像地址的原因，使用`npm install `下载electron会下载不完全

解决方法：安装`cnpm`并使用`cnpm install `

#### 如何使用

##### 下载已编译好的版本

在码云上，主项目右侧找到发行版，下载已经编译好的版本

##### 自己编译

1. 电脑上安装nodejs > 10 
2. 使用nodejs安装typescript
3. 运行`npm i `安装依赖
4. 运行`npm start`启动项目




