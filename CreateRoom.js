const commonVar = require('./Utility/Constant').commonVar;
const debug = require('debug')('createroom');
const JoinRoom = require('./JoinRoom')
const shortId = require('shortid')
const pawncolourassigner = require('./PawnColourAssigner').Assign

async function CreateRoom(playersData) {
    let roomName = shortId.generate();
    debug(roomName + " room create");
    let result = await JoinRoom(playersData, roomName);
    debug(`room joining ${result.result}`);

    if (result.result === "success") {
        debug("pawns are ready for colour assignment");
        pawncolourassigner(playersData, roomName)
      
    }
}
module.exports = CreateRoom;
