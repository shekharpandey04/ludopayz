const commonVar = {
    playerId: "playerId",
    pawnColour: "pawnColour",
    balance: "balance",
    roundId: "roundId",
    score: "score",
    players: "players",
    socket: "socket",
    roomName: "roomName",
    username:"username",
    diceNo:"diceNo",
    pawnNumber:"pawnNumber",
    pawnColour:"pawnColour",
    currentpathPoint:"currentpathPoint",
    killedPawnPlayer:"killedPawnPlayer",
    chance:"chance",
    pawnsSpotNumber:"pawnsSpotNumber",
    pawnNumber:"pawnNumber",
    pawns:"pawns",
    isLastMoveFinished:"isLastMoveFinished",
    maxPathPoint:58
}

const gameplayEvents = {
    OnDiceRoll                          : "OnDiceRoll",
    OnPawnMove                          : "OnPawnMove",
    OnPawnKill                          : "OnPawnKill",
    OnPlayerSwitch                      : "OnPlayerSwitch",
    OnPlayerWin                         : "OnPlayerWin",
    OnPawnReachedDestination            : "OnPawnReachedDestination",
    OnPlayerLeft                        : "OnPlayerLeft",
    OnPawnFinishMoving                  : "OnPawnFinishMoving",
    OnMatchMaking                       : "OnMatchMaking",
    OnMatchMakingComplete               : "OnMatchMakingComplete",
    OnGameStart                         : "OnGameStart",
    OnExit                              : "OnExit",
    YouWon                              : "YouWon",
    RemovePlayer                        : "RemovePlayer",
    OnDisconnect                        : "disconnect",
    OnDoubleChance                      : "OnDoubleChance",
    UpdateScore                         : "UpdateScore",
    RemovePlayer                        : "RemovePlayer",
    ScearchCompleted                    : "ScearchCompleted",
    Timer                               : "Timer",
    OnChanceMiss                        : "OnChanceMiss",
    UpdateLife                          : "UpdateLife",
    OnSomeoneWon                        : "OnSomeoneWon",
    OnLost                              : "OnLost",
    Reconnecting                        : "Reconnecting",
    ReconnectingTimeUP                  : "ReconnectingTimeUP",
    OnFailToReconnect                   : "OnFailToReconnect",
    OnReconnectingRequest               : "OnReconnectingRequest",
    OnReconnected                       : "OnReconnected",
    OnPlayerUnPaused                    : "OnPlayerUnPaused",
    OnPlayerPaused                      : "OnPlayerPaused",
    OnPlayerWentOffline                 : "OnPlayerWentOffline",
    PausedPlayerDisconnected            : "PausedPlayerDisconnected",
    OnGameRejoiningRequest              : "OnGameRejoiningRequest",
    OnGameRejoinedSuccessfully          : "OnGameRejoinedSuccessfully",
    OnGameFinshed                       : "OnGameFinshed",
    OnRoomKeyGenerated                  : "OnRoomKeyGenerated",
    OnPrivateRoomNotFound               : "OnPrivateRoomNotFound",
    OnPrivateRoomRequest                : "OnPrivateRoomRequest",
    OnJoinPrivateRoomRequested          : "OnJoinPrivateRoomRequested",
    OnLeavingPrivateRoomBeforJoining    : "OnLeavingPrivateRoomBeforJoining",
    OnMasterLeft                        : "OnMasterLeft",
    OnSwitchPawns                       : "OnSwitchPawns",
    WithDrawMatchMaking                 : "WithDrawMatchMaking",
}

const pawn = {
    red: 0,
    green: 1,
    yellow: 2,
    blue: 3,
}
module.exports = { gameplayEvents, commonVar, pawn }