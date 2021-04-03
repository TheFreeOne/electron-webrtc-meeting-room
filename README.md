# electron-webrtc-meeting-room

#### 介绍


使用electron提供webrtc，java和node提供相关交互的音视频会议室  

可用作语音通话，视频聊天

使用sfu架构和~~mesh架构(目前支持9人房间，MESH-P2P模式，人多会卡)~~

如果是内网玩一下，需要启动：java-login-server、node-room-server、客户端(会议模式MESH-P2P模式)

如果是外网，需要启动：java-login-server、sfu-server、客户端(会议模式SFU服务器模式)

> 兴趣使然的小例子，如果觉得还行，请点个Star，如果觉得不行，请在Issues添加你的意见或建议

#### 未来

 - [X] SFU架构 
 
#### 相关技术

 - 登陆服务器 springboot
 
 - 房间服务器 nodejs + typescript
 
 - 客户端 electron + typescript
 
#### 使用 

 - 运行 前 
 
   - 台式机需要安装摄像头，可以使用虚拟摄像头e2eSoft VCam，如果只是看一下效果，可是使用屏幕流
   
   - 需要提前开放电脑的麦克风权限和摄像头权限
   
 - 启动登陆服务器
 
   - 进入java-login-server 找到sql文件创建数据库并在application.properties配置相关参数
   
   - springboot方式启动项目，注意端口
   
 - 房间服务器（二选一，或者两者都用）
 
     - mesh架构: p2p2p2p2p(内网环境不需要sturnserver|turnserver，外网需要额外的sturnserver|turnserver)
     
       - 安装nodejs 和 typescript
       
       - 修改config.json的登陆服务器的地址用于回收房间号
       
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

#### 关于turnserver
   本人的stun/turn服务器是使用docker的zolochevska/turn-server

#### 说明

   node-room-server 原来源 https://github.com/harcop/webrtc-demo.git
   
   sfu-server 原来源 https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms.git
   
#### 参考资料
 - 房间服务器和webrtc https://github.com/harcop/webrtc-demo.git
 - 音频可视化 https://www.jq22.com/jquery-info22983
 - 服务器 https://zhuanlan.zhihu.com/p/56428846
 - Licode—基于webrtc的SFU/MCU实现 https://www.jianshu.com/p/dcc5ba06b49f
 - webrtc mediasoup sfu服务器https://github.com/Dirvann/mediasoup-sfu-webrtc-video-rooms.git
