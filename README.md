# electron-webrtc-meeting-room

#### 介绍

sfu/mesh的服务端+electron客户端的webrtc音视频会议室方案

> sfu-server 基于 mediasoup，右侧发行版已经为windows编译

> 浏览器使用webrtc需要https，配置麻烦，electron比较简单

> 如果在体验之后觉得还行，请麻烦点个star，觉得不行，可以在issues或者下方评论留下建议或意见

> clone 的时候 添加` --depth 1` 只克隆最近一次 commit

#### 相关技术

| 模块                         |                      说明  |
|------------------------------|---------------------------|
| node-room-server             | webrtc信令服务器           |
| sfu-server                   | 流中转服务器               |
| electron-meeting-room-client | electron写的客户端         |


 
#### 强烈建议在页面右侧下载最新发行版快速体验)

#### 下载源码体验
   
 - 房间服务器（二选一，或者两者都用）
 
     - mesh方案: (内网环境不需要sturnserver|turnserver，外网需要额外的sturnserver|turnserver)
     
       - 安装nodejs 和 typescript
       
       - 进入node-room-server,执行`npm install `下载依赖，执行`npm run start`开启房间服务器
       
     - sfu 架构: 服务器中转 
     
       - 安装nodejs 和 typescript
       
       - 进入sfu-server，编辑`config.js`设置`announcedIp`为客户端能访问到的IP地址，执行`npm install`下载依赖，执行`npm run start`开启房间服务器
       
       - 若你的电脑是windows，可能会出现mediasoup编译失败的情况，可以 阅读sfu-server/README.md按照里头的流程来
     
 - 启动客户端(sfu模式不需要sturnserver|turnserver)
 
   - `npm install `下载依赖`npm run start `启动客户端，或者下载发行版
   - 设置中修改相关信息

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
