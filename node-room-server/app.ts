import express = require('express');

import * as HTTP from 'http';
import * as socket from 'socket.io';

const app:express.Application = express();

app.all("*",function(req,res,next){
    console.log('app.all')
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin","*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers","content-type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods","DELETE,PUT,POST,GET,OPTIONS,NULL");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else{
        next();
    }
});
const http:HTTP.Server = new HTTP.Server(app);
// const http:HTTP.Server = require('http').Server(app);
const io:socket.Server = require('socket.io')(http);

const port = process.env.PORT || 3004;


app.use(express.static('public'));

// .createServer((req,res)=>{
//
// //设置返回格式 JSON, 解决跨域问题
// // res.setHeader('Content-type', 'application/json');
//
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild");
//     res.setHeader("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
//     res.setHeader("X-Powered-By","3.2.1");
//     res.setHeader("Content-Type", "application/json;charset=utf-8");
//
// //自己的逻辑代码
// })
// @ts-ignore
http.listen(port, () => {
    console.log(`connected to ${port}`);
});

io.on('connection', socket => {


    console.log(socket.id)
    console.log('a user is connected');
    // 创建或这是加入服务器
    socket.on('create or join', event => {
        let room = event.room;
        console.log('create or join a room', room);
        // 在房间里的人
        let  personInRoom = { length: 0 };



        if (io.sockets.adapter.rooms.has(room)) {
            personInRoom = Array.from(io.sockets.adapter.rooms.get(room))
        }
        const clientSize = personInRoom.length;
        console.log(room, 'has', clientSize, 'clients');

        if(clientSize === 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (clientSize === 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            console.log('error joining room');
            socket.emit('full', room);
        }

        console.log(io.sockets.adapter.rooms);

        console.log(io.sockets);


    });

    socket.on('ready', room => {
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', event => {
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', event => {
        socket.broadcast.to(event.room).emit('offer', event.sdp);
    });

    socket.on('answer', event => {
        socket.broadcast.to(event.room).emit('answer', event.sdp);
    });
    // 用户退出房间
    socket.on('out of room',event => {
        socket.broadcast.to(event.room).emit('out of room',event);
    });
})
