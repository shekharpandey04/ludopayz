const commonVar = require('./Utility/Constant').commonVar;
const socketEvents = require('./Utility/Constant').gameplayEvents;
const CreateRoom = require('./CreateRoom');
const Log = require('debug')('matchmaking');

//max players 
let twoPlayers = [];
let fourPlayers = [];

function AddPlayer(object) {
    Log("matchmaking...");
    Log("Player info ")
    let data=object.data
    if (data[commonVar.players] === 2) {
        AddPlayerData(twoPlayers, object, 2);
    }
    if (data[commonVar.players] === 4) {

        AddPlayerData(fourPlayers, object, 4);
    }
}
module.exports=AddPlayer;

function AddPlayerData(playerArray, playerData, maxPlayers) {

    let ID=playerData.data.playerId;
    let username=playerData.data.username;
    for (let i = 0; i < playerArray.length; i++) {
        if(playerArray[i].data.playerId===ID){
            Log(username+" Player already exist in matchmaking");
            return;
        }
    }
    //if accendently player got disconnected or purposefully 
    //remove that player from the array 
    playerData.socket.on(socketEvents.WithDrawMatchMaking,()=>{
        Log(username+" Player WithDraw MatchMaking")
        RemovePlayer(ID,playerArray);
    });
    playerArray.push(playerData);
    if (playerArray.length !== maxPlayers) return;
    //this is a temperary array
    //which will hold the players which are about to
    // join room
    let finalPlayerQue = [];
    
    for (let i = 0; i < playerArray.length; i++) {
        if(playerArray[i].socket["disconnected"]){
            playerArray.splice(i,1);
            Log("player dissconnected "+playerArray[i].socket.id)
            Log("removing player"+playerArray[i].socket.id)
            return;
        }
        finalPlayerQue.push(playerArray[i]);

    }
    CreateRoom(finalPlayerQue);
    //remove players
    twoPlayers.splice(0,maxPlayers);
    
}

function RemovePlayer(ID,array){
    for (let i = 0; i < array.length; i++) {
        if(array[i].data.playerId===ID){
            Log(array[i].data.username+" Player removed")
            array.splice(i,1);
            return;
        }        
    }
}

