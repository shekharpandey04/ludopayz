"use strict"
const socketEvents = require('./Utility/Constant').gameplayEvents;
const ludo = require('./Gameplay/Ludo');
const commonVar = require('./Utility/Constant').commonVar;
const pawn = require('./Utility/Constant').pawn;
const Log = require('debug')('pawncolourassigner');

const GameData={};
function Assign(playersData, roomname) {

    let maxPlayers = playersData.length;
    let twoPlayesPawnColours = [0, 2];
    let players = [];

    for (let i = 0; i < maxPlayers; i++) {
        let pawnColour = maxPlayers === 2 ? twoPlayesPawnColours[i] : i;//randomly assigning pawn colour to players
        let player = {
            pawnColour,
            playerId: playersData[i].data[commonVar.playerId],
            username: playersData[i].data[commonVar.username],
        };
        let colour;
        for (const [key, value] of Object.entries(pawn)) {
            if (value === pawnColour) colour = key;
        }
        Log("player " + player.playerId + " got " + colour + " colour number");
        playersData[i].data.pawnColour
        players.push(player);
    }
    //this data will sent to frontend 
    //and will help to setup and start the game
    let frontendData = {
        roomname,
        players,
    }
    for (let i = 0; i < maxPlayers; i++) {
        playersData[i].socket.emit(socketEvents.OnMatchMakingComplete, frontendData)
    }

    //this data will be used by the server
    let serverData = {
        roomname,
        playersData
    }
    var game = new ludo(serverData, 8, roomname);
    game.StartGame();
}

function  SendRequestConnection(data) {
    if(GameData[data[commonVar.roomName]]===null || GameData[data[commonVar.roomName]]===undefined){
        Log("round is over");
        return;
    }
    GameData[data[commonVar.roomName]].OnReconnect(data);
}
module.exports = {Assign, SendRequestConnection};

