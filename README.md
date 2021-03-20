# electron-webrtc-meeting-room

#### 介绍
使用electron提供webrtc，java和node提供相关交互的视频会议室  
使用mesh架构，目前支持9人房间，因为是mesh架构，所以人多会卡

#### 未来
 - [ ] SFU架构 
#### 相关技术
 - 登陆服务器 springboot
 - 房间服务器 nodejs + typescript
 - 客户端 electron + typescript
#### 使用 
 - 运行 前 
   - 台式机需要安装摄像头，可以使用虚拟摄像头e2eSoft VCam
   - 需要提前开放电脑的麦克风权限和摄像头权限
 - 启动登陆服务器
   - 进入java-login-server 找到sql文件创建数据库并在application.properties配置相关参数
   - springboot方式启动项目，注意端口
 - 启动房间服务器
   - 安装nodejs 和 typescript
   - 修改config.json的登陆服务器的地址用于回收房间号
   - 进入node-room-server,执行`npm install `下载依赖，执行`npm run start`开启房间服务器
 - 启动客户端
   - 进入electron-meeting-root-client，找到config.json文件，配置登陆服务器和房间服务器的地址，
   - `npm run start `启动客户端
   - 你可以在单机情况下使用单个客户端打开同一个会议室的两个会议窗口
   - 两个客户端在非局域网下需要去config.json中修改iceServers的stun/turn 服务器
   - 本人的stun/turn服务器是使用docker的zolochevska/turn-server
#### 参考资料
 - 房间服务器和webrtc https://github.com/harcop/webrtc-demo.git
 - 音频可视化 https://www.jq22.com/jquery-info22983
 - 服务器 https://zhuanlan.zhihu.com/p/56428846
 - Licode—基于webrtc的SFU/MCU实现 https://www.jianshu.com/p/dcc5ba06b49f
 - https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms.git
