const express = require('express');
const path = require('path');
const matchmaking = require('./MatchMaking');
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 3000
const Log = require('debug')('server');
const io = require("socket.io")(http);
const socketEvents = require("./Utility/Constant").gameplayEvents;
const commonVar = require("./Utility/Constant").commonVar;
const sendSocket = require("./Gameplay/Ludo").GetSocket;
const CreatePrivateRoom=require('./PrivateRoom').CreatePrivateRoom;
const JoinPrivateRoom=require('./PrivateRoom').JoinPrivateRoom;
const SendConnectionRequest = require('./PawnColourAssigner').SendRequestConnection

sendSocket(io);
app.get("/servertesting", (req, res) => {
  res.sendFile(path.join(__dirname + '/test.html'));
});

io.on("connection", (socket) => {
  Log("someone connected " + socket.id)
  OnMatchMaking(socket)
  OnPrivateRoomRequest(socket)
  OnJoinPrivateRoomRequested(socket)
  OnDisconnected(socket)
  ReConnected(socket)
});

function OnDisconnected(socket){
  socket.on("disconnect", () => {
    let id=socket.username!==undefined?socket.username:socket.id;
    Log("someone disconnect " + id)
  });
}

function OnMatchMaking(socket) {
  socket.on(socketEvents.OnMatchMaking, (data) => {
    socket.playerId=data[commonVar.playerId];
    socket.username=data[commonVar.username];
    let obj={
      socket:socket,
      data:data
    }
    Log(data[commonVar.username]+" requested making ");
   Log(data)
    matchmaking(obj);
  });
  
}

function OnPrivateRoomRequest(socket){
  socket.on(socketEvents.OnPrivateRoomRequest, (data) => {
    Log("Private room request");
    socket.playerId=data[commonVar.playerId];
    socket.username=data[commonVar.username];
    let obj={
      socket:socket,
      data:data
    }
    CreatePrivateRoom(obj);
  });
}
function OnJoinPrivateRoomRequested(socket){
  socket.on(socketEvents.OnJoinPrivateRoomRequested, (data) => {
    Log("join Private room request");
    socket.playerId=data[commonVar.playerId];
    socket.username=data[commonVar.username];
    let obj={
        socket:socket,
        data:data,
        roomName:data[commonVar.roomName]
    };
   
   JoinPrivateRoom(obj);
  });
}
function ReConnected(socket){
  socket.on(socketEvents.OnGameRejoiningRequest, (data) => {
    Log("Got reconnection request "+data[commonVar.username]);
    socket.username=data.username;
    let obj={
      socket:socket,
      playerId:data[commonVar.playerId],
      username:data[commonVar.username],
      roomName:data[commonVar.roomName]
    }
   SendConnectionRequest(obj);
  });
}
http.listen(port, () => {
  Log("Server listening on port =>", port);
})