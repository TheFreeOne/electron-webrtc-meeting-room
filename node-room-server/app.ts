const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);


const port = process.env.PORT || 3004;

app.use(express.static('public'));

http.listen(port, () => {
    console.log(`connected to ${port}`);
})

io.on('connection', socket => {
    console.log('a user is connected');
    // 创建或这是加入服务器
    socket.on('create or join', event => {
        let room = event.room;
        console.log('create or join a room', room);
        let  myRoom = { length: 0 };
        if (io.sockets.adapter.rooms.has(room)) {
            myRoom = Array.from(io.sockets.adapter.rooms.get(room))
        }
        const numClients = myRoom.length;
        console.log(room, 'has', numClients, 'clients');

        if(numClients === 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients === 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            console.log('error joining room');
            socket.emit('full', room);
        }
    })

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
