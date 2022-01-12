"use strict";
const socketEvents = require("./Utility/Constant").gameplayEvents;
const commonVar = require("./Utility/Constant").commonVar;
const Log = require('debug')('privateroom');
const CreateRoom = require('./CreateRoom');
const shortId = require('shortid')
const twoPlayers = {};
const fourPlayers = {};
const PrivateRooms = [];

function CreatePrivateRoom(data) {

    let roomName = shortId.generate();
    data[commonVar.socket].emit(socketEvents.OnRoomKeyGenerated, { roomName })
    let clinets=[];
    clinets.push(data)
    PrivateRooms.push({
        clinets,//all players
        players: data.data[commonVar.players],//max players
        roomName,
    })
    Log("Private room " + roomName + " created");
    //Destroy room if master Left
    data.socket.on(socketEvents.OnDisconnect,()=>{
        OnMasterLeft(roomName,data.data[commonVar.username]);
    });
    data.socket.on(socketEvents.OnMasterLeft,(d)=>{
        Log("Master left");
        OnMasterLeft(roomName,data.data[commonVar.username]);
    });
}

function JoinPrivateRoom(data) {

    for (let i = 0; i < PrivateRooms.length; i++) {
        if (data[commonVar.roomName] === PrivateRooms[i][commonVar.roomName]) {
            //add one move variable to the data i.e Players
            data.data.players = PrivateRooms[i].players;
            PrivateRooms[i].clinets.push(data);
            AddListner_OnPlayerLeftWhileJoining(data);
            let isRoomFull =
                PrivateRooms[i].clinets.length === PrivateRooms[i].players;
            if (isRoomFull) {
                ValidateJoinedPlayers(PrivateRooms[i].clinets)
                return;
            }
        }
    }
    Log(data[commonVar.roomName] + " Room not found")
    data.socket.emit(socketEvents.OnPrivateRoomNotFound,{msg:"room not found"});
}

function ValidateJoinedPlayers(players) {
    Log("validating players-");
    players.forEach(__player => {
        if (__player[commonVar.socket].disconnected) {
            Log(__player.data[commonVar.username] + " disconnected ")
            return;
        }
    });

CreateRoom(players)
    Log("Everone is ready to join the game")
}
//remove player if player exit or disconnect
function AddListner_OnPlayerLeftWhileJoining(player) {

    player.socket.on(socketEvents.OnLeavingPrivateRoomBeforJoining, () => {
       RemovePlayer(player.data);
    })
    player.socket.on(socketEvents.OnDisconnect, () => {
       RemovePlayer(player.data);
    })
}

function RemovePlayer(data){
    Log(`Leave room ${data[commonVar.roomName]} before joining requested `+data[commonVar.username]);
    let isRoomStillAlive = false;
    let roomIndex=0;
    for (let i = 0; i < PrivateRooms.length; i++) {
        if (data[commonVar.roomName] === PrivateRooms[i][commonVar.roomName]) {
            isRoomStillAlive = true;
            roomIndex=i;
        }
    }
    if (!isRoomStillAlive) {
        Log(data[commonVar.roomName] + "Room not found");
        return;            
    }

    Log(PrivateRooms)
    Log(`roomindex is ${roomIndex} `);
    for (let j = 0; j < PrivateRooms[roomIndex].clinets.length; j++) {
        if (PrivateRooms[roomIndex].clinets[j].data[commonVar.playerId]
             === data[commonVar.playerId]) {
            {
                PrivateRooms[roomIndex].clinets.splice(j,1);
                Log(data[commonVar.username]+" removed successfully from room "
                +PrivateRooms[roomIndex][commonVar.roomName]);
                return;
            }
        }

    }
}
function OnMasterLeft(roomName,username) {
    for (let i = 0; i < PrivateRooms.length; i++) {
       if(PrivateRooms[i][commonVar.roomName]===roomName){
           PrivateRooms.slice(i,1);
           Log(username+" Master disconnected")
           Log(roomName+" room destroyied");
       }
    }
}
module.exports = { CreatePrivateRoom, JoinPrivateRoom };