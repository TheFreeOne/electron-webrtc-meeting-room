
 [windows平台安装](https://mediasoup.discourse.group/t/mediasoup-unable-to-install-in-windows/551/4)
   
    npm i --ignore-scripts
    cd node_modules/mediasoup
    python ./worker/scripts/configure.py --format=msvs -R mediasoup-worker
    cd worker

打开 vs2019 打开'mediasoup-worker.sln' 编译 ：选择 Release|Win32 菜单栏 - 生成 - 生成解决方案

##### 如果提示MSVSVersion.py keyError:${MSBuild.exe的路径}
那么找到报错的地方versions[str(name)] -> versions[str('2017')]

##### 无法找到 Visual Studio 2010 的生成工具(平台工具集 =“v100”) 
使用visual studio  2017/2019 打开项目，点击菜单栏-项目-重定目标解决方案，然后会提示修改版本，然后只修改版本

##### Release|x64不是..
MSBuild mediasoup-worker.sln /p:Configuration=Release /p:plat(忘记了)

