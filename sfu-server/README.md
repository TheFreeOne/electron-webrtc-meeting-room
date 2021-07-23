
 [windows平台安装](https://mediasoup.discourse.group/t/mediasoup-unable-to-install-in-windows/551/4)

    npm i --ignore-scripts
    cd node_modules/mediasoup
    python ./worker/scripts/configure.py --format=msvs -R mediasoup-worker
    cd worker
    msbuild

运行msbuild

或

打开 vs2019 打开'mediasoup-worker.sln' 编译 ：选择 Release|Win32 菜单栏 - 生成 - 生成解决方案

##### 如果提示MSVSVersion.py keyError:${MSBuild.exe的路径}
那么找到报错的地方versions[str(name)] -> versions[str('2017')]

##### 无法找到 Visual Studio 2010 的生成工具(平台工具集 =“v100”) 
使用visual studio  2017/2019 打开项目，点击菜单栏-项目-重定目标解决方案，然后会提示修改版本，然后只修改版本

##### Release|x64不是..
MSBuild mediasoup-worker.sln /p:Configuration=Release /p:plat(忘记了)

#### [centos 编译报gcc版本过低]
    可参考https://www.cnblogs.com/jixiaohua/p/11732225.html

#### 客户端与服务器websocket交互流程(省略返回)

```sequence

client ->> server : createRoom 创建房间
client ->> server : join 加入房间
client ->> server : getRouterRtpCapabilities 获取编码器和解码器
client ->> server : createWebRtcTransport 携带参数rtpCapabilities，表示创建一个生产通道
client ->> server : createWebRtcTransport 不携带参数rtpCapabilities，表示创建一个消费通道
client ->> server : getProducers 获取房间中的生产者



```

 