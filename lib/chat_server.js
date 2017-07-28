const socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var nameUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    //启动socket
    io = socketio.listen(server);
    io.set('log level',1);
    //定义每个用户连接的处理逻辑
    io.sockets.on('connection',function (socket) {
        //赋予用户一个访客名
        guestNumber = assignGuestName(socket,guestNumber,nickNames,nameUsed);
        //用户加入聊天室
        joinRoom(socket,'Lobby');
        handleMessageBroadcasting(socket,nickNames);
        handleNameChangeAttempts(socket,nickNames,nameUsed);
        handleRoomJoining(socket);
        //用户请求时，向其提供已经被占用的聊天室列表
        socket.on('roomsp',function () {
            socket.emit('rooms', io.of('/').adapter.rooms);
        });
        handleClientDisconnection(socket,nickNames,nameUsed);
    })
};
// 分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed) {
    var name = 'Guest' + guestNumber; //生成新昵称
    nickNames[socket.id] = name;
    socket.emit('nameResult',{        //通知用户新昵称
        success:true,
        name:name
    });
    namesUsed.push(name);
    return guestNumber +1;
}

function joinRoom(socket,room) {
    room = room+'-Room';
    socket.join(room);    //让用户进入房间
    currentRoom[socket.id] = room;
    socket.emit('joinResult',{room:room});      //通知用户
    socket.broadcast.to(room).emit('message',{  //通知其他用户
        text:nickNames[socket.id] + 'has joined'+ room+ '.',
    });
    var usersInRoom = io.of('/').in(room).clients;
    if(usersInRoom.length>1){
        var usersInRoomSummary = "Users currently in "+room+':';
        for(var index in UsersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(userSocketId != socket.id){
                if(index>0){
                    usersInRoomSummary += ',';
                }
                usersInRoomSummary += nickNames[userSocketId];
            }
        }
        usersInRoomSummary += '.';
        socket.emit('message',{text:usersInRoomSummary});
    }
}

function handleNameChangeAttempts(socket,nickNames,namesUsed) {
    socket.on('nameAttempt',function (name) {
        if(name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: "Names cannot begin with 'GUest'."
            });
        }else {
            if(namesUsed.indexOf(name) === -1) {
                //获取用户当前昵称信息
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete namesUsed[previousNameIndex];
                socket.emit('nameResult',{
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text: previousName + 'is now known as'+ name + '.'
                });
            }else {
                socket.emit('nameResult',{
                    success: false,
                    message: 'That name is already in use.'
                });
            }
        }
    });
}

function handleMessageBroadcasting(socket) {
    socket.on('message',function (message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id] +':'+ message.text
        });
    });
}

function handleRoomJoining(socket) {
    socket.on('join',function (room) {
        socket.leave(currentRoom[socket.id]);
         joinRoom(socket,room.newRoom);
    })
}

function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        var nameIndex = nameUsed.indexOf(nickNames[socket.id]);
        delete nameUsed[nameIndex];
        delete nickNames[socket.id];
    })
}
