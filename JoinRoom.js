"use strict";
const debug = require("debug")("joinroom");
const commontVar = require("./Utility/Constant").commonVar;

async function JoinRoom(data, roomName) {

    return (new Promise(function(myResolve, myReject) {
        let maxPlayers=data.length;
        for (let i = 0; i < maxPlayers; i++) {
            debug("player socket id " + data[i].socket.id+" join room requested!");
            let isPlayerGotDisconnected = !data[i].socket.connected;
            if (isPlayerGotDisconnected) {
                myReject();
                break;
            }
            data[i].socket.join(roomName, () => {
                debug(`user ${data[i].socket.id} joined room ${roomName}`);
            });
        }
        myResolve({ result: "success", roomName: roomName });
    }));
}
module.exports = JoinRoom