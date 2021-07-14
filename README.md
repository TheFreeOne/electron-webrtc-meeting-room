# electron-webrtc-meeting-room

#### 介绍


使用electron提供webrtc，node提供相关交互的音视频会议室  

可用作语音通话，视频聊天

实现了sfu方案(一个服务器和多个终端，服务器压力大)和mesh架构 MESH方案（多个终端之间两两进行连接，形成一个网状结构，几乎没服务器什么事，房间的人一多就看自己电脑性能了） 

如果是想体验 SFU方案(一个服务器和多个终端)，需要启动 sfu-server、客户端(会议模式默认SFU服务器模式)  

如果是想体验 MESH方案（多个终端之间两两进行连接，形成一个网状结构），需要启动：node-room-server、客户端(会议模式改成MESH-P2P模式)，此情况想外网网文，需要sturnserver|turnserver


#### 相关技术

 | 模块  | 说明  |
|---|---|
| node-room-server  | webrtc房间服务器  |
| sfu-server  | mediasoup为基础的sfu服务器  |
| electron-meeting-room-client | electron写的客户端， |

> 浏览器使用webrtc需要https，配置麻烦，electron比较简单

 
#### 下载源码体验( 强烈建议在页面右侧下载最新发行版快速体验)

 - 运行 前 
 
   - 台式机需要安装摄像头，可以使用虚拟摄像头e2eSoft VCam，如果只是看一下效果，可是使用屏幕流
   
   - 需要提前开放电脑的麦克风权限和摄像头权限，不然点发言会没声音
   
   
 - 房间服务器（二选一，或者两者都用）
 
     - mesh方案: p2p2p2p2p(内网环境不需要sturnserver|turnserver，外网需要额外的sturnserver|turnserver)
     
       - 安装nodejs 
       
       - 进入node-room-server,执行`npm install `下载依赖，执行`npm run start`开启房间服务器
       
     - sfu架构: 服务器中转
     
       - 安装nodejs 和 typescript
       
       - 进入sfu-server，编辑`config.js`设置`announcedIp`为客户端能访问到的IP地址，执行`npm install`下载依赖，执行`npm run start`开启房间服务器
       
       - 若你的电脑是windows，可能会出现mediasoup编译失败的情况，可以按照以下方式解决
       
         - 第一种，将node_modules/mediasoup回滚，这是因为我已经编译好了
         
         - 第二种，阅读sfu-server/README.md按照里头的流程来
     
 - 启动客户端(sfu模式不需要sturnserver|turnserver)
 
   - `npm install `下载依赖`npm run start `启动客户端，或者下载发行版

   ![登陆](https://images.gitee.com/uploads/images/2021/0403/182506_85891f2e_1927643.png "client01.png")

   ![设置](https://images.gitee.com/uploads/images/2021/0403/182523_896244c2_1927643.png "client02.png")

   ![单机演示页面](https://images.gitee.com/uploads/images/2021/0403/182544_3fe56e5e_1927643.png "client04.png")

  ![输入图片说明](https://images.gitee.com/uploads/images/2021/0414/165352_0c82a2bc_1927643.png "QQ20210414165306.png")

#### 关于turnserver

   本人的stun/turn服务器是使用docker的zolochevska/turn-server

#### 说明

   node-room-server 原来源 https://github.com/harcop/webrtc-demo.git
   
   sfu-server 原来源 https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms.git
   
   android 来源 https://github.com/haiyangwu/mediasoup-demo-android.git

   > 感觉就像用了别人和发动机和轮子，自己写的车身拼出来的东西
   
#### 参考资料
 - 房间服务器和webrtc https://github.com/harcop/webrtc-demo.git
 - 音频可视化 https://www.jq22.com/jquery-info22983
 - 服务器 https://zhuanlan.zhihu.com/p/56428846
 - Licode—基于webrtc的SFU/MCU实现 https://www.jianshu.com/p/dcc5ba06b49f
 - webrtc mediasoup sfu服务器https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms.git
