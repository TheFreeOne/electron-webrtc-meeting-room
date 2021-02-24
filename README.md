# electron-webrtc-meeting-room

#### 介绍

使用electron提供webrtc，java和node提供相关交互的视频会议室

#### 开发步骤

- [x] 新建文件夹
- [x] 创建java服务器
  - [x] 实现登陆
  - [x] 返回token
  - [x] 登陆服务器回收房间号
- [x] 分离房间服务器
- [x] 开发electron客户端
  - [ ] electron客户端支持多人房间
  - [ ] 会议结束相关事件
  - [x] electron客户端支持讲话X
  - [x] electron客户端支持桌面/应用演示模式
  - [X] electron客户端支持白板
  - [x] electron客户端支持摄像头获取

#### 使用 
 - 运行 前 
   - 台式机需要安装摄像头，可以使用虚拟摄像头e2eSoft VCam
   - 需要提前开放电脑的麦克风权限和摄像头权限
 - 启动登陆服务器
   -   进入java-login-server 找到sql文件创建数据库并在application.properties配置相关参数
 - 启动房间服务器
   - 安装nodejs 和 typescript
   - 进入node-room-server,执行`npm install `下载依赖，执行`npm run start`开启房间服务器
 - 启动客户端
   - 进入electron-meeting-root-client，找到config.json文件，配置登陆服务器和房间服务器的地址，
   - `npm run start `启动客户端
   - 你可以在单机情况下使用单个客户端打开同一个会议室的两个会议窗口
   - 两个客户端在非局域网下需要去config.json中修改iceServers的stun/turn 服务器
   - 本人的stun/turn服务器是使用docker的zolochevska/turn-server
