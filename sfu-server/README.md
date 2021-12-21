#### mediasoup 3.7.0 windows 编译

 [windows平台安装](https://mediasoup.discourse.group/t/mediasoup-unable-to-install-in-windows/551/4)

    npm i --ignore-scripts
    cd node_modules/mediasoup
    python ./worker/scripts/configure.py --format=msvs -R mediasoup-worker
    cd worker
    msbuild

运行msbuild

或

打开 vs2019 打开'mediasoup-worker.sln' 编译 ：选择 Release|Win32 

菜单栏 - 生成 - 生成解决方案 

菜单栏 - 生成 - 批生成 Relase

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

####  mediasoup 3.9.0 windows 编译

最好提前安装好 meson

> 按这里装https://blog.csdn.net/wo198711203217/article/details/105032057   x86_64-posix-sjlj这个版本

1. 编辑node_module/worker/Makefile，去掉 47行 `ifeq ($(wildcard $(PIP_DIR)),)` 到与其匹配的`endif`中的 `#` 开头的注释，因为这些注释可能在windows下被错误地识别
执行
```
D:\lqq\git\electron-webrtc-meeting-room\sfu-server\node_modules\mediasoup> node npm-scripts.js worker:build
```
接下来可能输出
```
  ......
  Source dir: D:\lqq\git\electron-webrtc-meeting-room\sfu-server\node_modules\mediasoup\worker
  Build dir: D:\out\Release // 目录是错误地，到时候需要放到worker下面
```
##### err1 
```
meson.build:147:0: ERROR: could not get https://www.openssl.org/source/openssl-1.1.1l.tar.gz is the internet available?
```

> 认为下载，修改名字一直后移动到``D:\lqq\git\electron-webrtc-meeting-room\sfu-server\node_modules\mediasoup\worker\subprojects\packagecache`

编辑
D:\lqq\git\electron-webrtc-meeting-room\sfu-server\node_modules\mediasoup\worker\subprojects\openssl.wrap
修改openssl的下载地址
提前下载，并用nginx代理 到下载地文件夹，
 下载一边之后 查看 D:\out\Release\meson-logs\meson-log.txt 将 actual 的文件hash替换  openssl.warp中的source_hash

 

参考
 ```

[wrap-file]
directory = openssl-1.1.1l
source_url = http://127.0.0.1:18000/openssl-1.1.1l.tar.gz
source_filename = openssl-1.1.1l.zip
source_hash = 12e87ea1e5d60da771551117457e40d908bf13e4c071f06a1bf71fa13a7199ed
patch_filename = openssl_1.1.1l-2_patch.zip
patch_url =  http://127.0.0.1:18000/get_patch
patch_hash = 852521fb016fa2deee8ebf9ffeeee0292c6de86a03c775cf72ac04e86f9f177e

[provide]
libcrypto = libcrypto_dep
libssl = libssl_dep
openssl = openssl_dep


 ```

 ##### crypto\aes\aes_cbc.c文件不存在
 将openssl-1.1.1l中所有文件拷贝到 与openssl中meson.build同一层级

 #### undefined reference to `_Unwind_Resume'

  -Wl,-Bdynamic -lgcc_s  