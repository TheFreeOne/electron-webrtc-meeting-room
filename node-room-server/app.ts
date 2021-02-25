import express = require('express');

import * as HTTP from 'http';
import * as socket from 'socket.io';
import axios from "axios";

const app: express.Application = express();

let config = require('./config.json');

app.all("*", function (req, res, next) {
    console.log('app.all')
    //设置允许跨域的域名，*代表允许任意域名跨域
    res.header("Access-Control-Allow-Origin", "*");
    //允许的header类型
    res.header("Access-Control-Allow-Headers", "content-type");
    //跨域允许的请求方式
    res.header("Access-Control-Allow-Methods", "DELETE,PUT,POST,GET,OPTIONS,NULL");
    if (req.method.toLowerCase() == 'options')
        res.send(200);  //让options尝试请求快速结束
    else {
        next();
    }
});
const http: HTTP.Server = new HTTP.Server(app);
// const http:HTTP.Server = require('http').Server(app);
const io: socket.Server = require('socket.io')(http);

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
var personInServer = {}
io.on('connection', socket => {



    console.log('a user is connected');
    // 创建或这是加入服务器
    socket.on('create or join', event => {

        let room = event.room;
        console.log('create or join a room', room);
        // 在房间里的人
        let personInRoom = { length: 0 };



        if (io.sockets.adapter.rooms.has(room)) {
            personInRoom = Array.from(io.sockets.adapter.rooms.get(room));
        }
        console.log('personInRoom');

        console.log(personInRoom);

        const clientSize = personInRoom.length;
        console.log(room, 'has', clientSize, 'clients');

        if (clientSize === 0) {
            socket.join(room);
            socket.emit('created', { "room": room, "socketId": socket.id, "personInRoom": Array.from(io.sockets.adapter.rooms.get(room)) });
            socket.broadcast.to(room).emit('new one enter', { "socketId": socket.id });
            socket.emit('new one enter', { "socketId": socket.id });
            personInServer[socket.id] = socket;
        } else if (clientSize <= 2) {
            socket.join(room);
            socket.emit('joined', { "room": room, "socketId": socket.id, "personInRoom": Array.from(io.sockets.adapter.rooms.get(room)) });
            socket.broadcast.to(room).emit('new one enter', { "socketId": socket.id });
            socket.emit('new one enter', { "socketId": socket.id });
            personInServer[socket.id] = socket;
        } else {
            console.log('error joining room');
            socket.emit('full', { "room": room, "socketId": socket.id });
        }




    });
    // 向房间里头的人说新来的已经准备好了
    socket.on('ready', room => {
        socket.broadcast.to(room).emit('ready', { fromSocketId: socket.id });
    });

    socket.on('candidate', event => {
        let toSocketId = event.toSocketId;
        event.fromSocketId = socket.id
        event.toSocketId = toSocketId
        // socket.broadcast.to(event.room).emit('candidate', event);
        personInServer[toSocketId].emit('candidate', event);
    });

    socket.on('offer', event => {
        let toSocketId = event.toSocketId;
        event.sdp.fromSocketId = socket.id;
        // socket.broadcast.to(event.room).emit('offer', event.sdp);
        personInServer[toSocketId] .emit('offer', event.sdp);
    });

    socket.on('answer', event => {
         let toSocketId = event.toSocketId;
        event.sdp.fromSocketId = socket.id
        // socket.broadcast.to(event.room).emit('answer', event.sdp);
        personInServer[toSocketId] .emit('answer', event.sdp);
    });
    // 用户退出房间
    socket.on('out of room', event => {
        socket.broadcast.to(event.room).emit('out of room', event);
        socket.leave(event.room);
        let hasRoom = io.sockets.adapter.rooms.has(event.room)
        if (!hasRoom) {

            axios.get(config.javaLoginServer + "/recycleRoom.json?roomNumber=" + event.room)
                .then(function (res) {

                }).then(error => {

                });




        }
    });
})
