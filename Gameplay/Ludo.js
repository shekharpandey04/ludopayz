"use strict";
const socketEvents = require("../Utility/Constant").gameplayEvents;
const commanVar = require("../Utility/Constant").commonVar;
let IO;
const Log = require('debug')('gameplay');

function GetSocket(io) {
    IO = io;
}
class LUDO {
    constructor(gameData, timer, roomName) {
        this.players = [];
        this.ExtraPointsForKilling = 50;
        this.ExtraPointsForWinningAPawn = 100;
        this.ExtraPointsForDoubleChance = 2;
        this.currentPlayer;
        this.pawnIndex;
        this.gameId;
        ///this object contaion Socket obj and Player id,username,
        this.SOCKETS = gameData.playersData;
        this.data = gameData;
        this.miniutsLeft;
        this.secLeft;
        this.isTimeUp = false;
        this.timer = "0:00";
        this.roomName = roomName;
        this.dissconnectedPlayers = [];
        this.reconnectingPlayers = [];
        this.pausedPlayers = [];
        this.isReconnecting = false;
        this.isReconnected = false;
        this.reconnectTime = 10;
    }

    StartGame() {
        Log("gameStarted");
        Log(this.data);
        for (let i = 0; i < this.data.playersData.length; i++) {
            let socket = this.data.playersData[i].socket;
            let player = this.data.playersData[i].data;
            let username = player[commanVar.username];
            let playerId = player[commanVar.playerId];
            this.players.push({
                username: username,
                playerId: playerId,
                score: 0,
                chance: 3,
                pawns: [0, 0, 0, 0],//hold pathpoints on ludo board
                isLastMoveFinished: false//this will use when timer is over
            });
            //Register Events
            this.OnDiceRoll(socket);
            this.OnPawnFinishMoving(socket);
            this.OnPawnMove(socket);
            this.OnPawnKilled(socket);
            this.OnExit(socket);
            this.OnDoubleChance(socket);
            this.OnPawnScearchCompleted(socket);
            this.OnDissconnect(socket);
            this.OnChanceMiss(socket);
            this.OnPlayerPaused(socket);
            this.OnPlayerUnPaused(socket);
            this.OnGameFinshed(socket);
            this.OnSwitchPlayers(socket);
        }
        //this.CountDown(30, 5);
        this.currentPlayer = this.players[0];
        
    }

   
    OnPawnMove(socket) {
        socket.on(socketEvents.OnPawnMove, (pawnInfo) => {
            Log(pawnInfo[commanVar.username] + " pawn moving " + JSON.stringify(pawnInfo))
            let playerId = pawnInfo[commanVar.playerId];
            let pawnNumber = pawnInfo[commanVar.pawnNumber];
            let pawnsSpotNumber = pawnInfo[commanVar.currentpathPoint];
            let currentPlayer = this.GetPlayerInstance(playerId);
            if (currentPlayer === undefined) {
                Log("Player not found while moving");
                return;
            }
            currentPlayer[commanVar.pawns][pawnNumber] = pawnsSpotNumber;
            socket.to(this.roomName).emit(socketEvents.OnPawnMove, pawnInfo)
           
        });
    }

    OnPlayerWon(playerId){
        let playerInstance=this.GetPlayerInstance(playerId);
        
        for (let i = 0; i < playerInstance.pawns.length; i++) {
            if(commanVar.maxPathPoint===playerInstance.pawns[i]){

                continue;
            }
            return;
        }
        //db stuff{add winning prize to the player}
        IO.to(this.roomName).emit("OnPlayerWon",{playerId:playerInstance.playerId});
    }
    OnDiceRoll(socket) {
        socket.on(socketEvents.OnDiceRoll, (diceInfo) => {
            Log(diceInfo[commanVar.username] + " rolled dice got no: " + JSON.stringify(diceInfo))
            socket.to(this.roomName).emit(socketEvents.OnDiceRoll, diceInfo)
        });
    }


    OnPawnFinishMoving(socket) {
        socket.on(socketEvents.OnPawnFinishMoving, (player) => {

            let points = player[commanVar.diceNo];
            this.currentPlayer[commanVar.score] += points;

            this.SendScore();

            if (this.isRoundEnded()) {
                Log("round ended anouncing the winner");
                this.AnounceWinner();
                return;
            }
            Log(player[commanVar.username] + " player finished moving");
            Log("next player " + this.currentPlayer[commanVar.username]);
            this.SwitchPlayers(player)

        });
    }

    OnSwitchPlayers(socket) {
        socket.on(socketEvents.OnSwitchPawns, (data) => {
            this.SwitchPlayers(data);
        })
    }

    SwitchPlayers(player) {
        if(player[commanVar.diceNo]!==6)
        this.currentPlayer = this.GetNextPlayerIndex(player[commanVar.playerId]);
        Log(`changing player current player is ${player[commanVar.username]}`);
        //sent to all players 
        IO.to(this.roomName).emit(socketEvents.OnPlayerSwitch, {
            nextPlayerId: this.currentPlayer[commanVar.playerId],
            nextUsername: this.currentPlayer[commanVar.username],
        })
    }

    isRoundEnded() {
        if (this.isTimeUp) {
            Log("round ;finished seeking winner")
            this.currentPlayer[commanVar.isLastMoveFinished] = true;
            for (let i = 0; i < this.players.length; i++) {
                if (!this.players[i].isLastMoveFinished) {
                    return false;
                }
            }

            return true;
        }
        return false;
    }


    AnounceWinner() {
        let hightScore = 0;
        //find high score
        this.players.forEach(player => {
            if (player[commanVar.score] > hightScore) {
                hightScore = player[commanVar.score];
            }
        });
        let winnerId = null;
        this.players.forEach(player => {
            if (player[commanVar.score] === hightScore) {
                winnerId = player[commanVar.playerId];
                IO.to(this.roomName).emit(socketEvents.OnSomeoneWon, { playerId: winnerId });
                return;
            }
        });

    }


    OnPawnKilled(socket) {
        socket.on(socketEvents.OnPawnKill, (data) => {
            let points = data[commanVar.diceNo];
            let killedPawnPlayer = data[commanVar.killedPawnPlayer];
            for (let i = 0; i < this.players.length; i++) {
                if (killedPawnPlayer === this.players[i][commanVar.playerId]) {
                    //deduct points
                    this.players[i][commanVar.score] = this.players[i][commanVar.score] < this.ExtraPointsForKilling ? 0 :
                        this.players[i][commanVar.score] - this.ExtraPointsForKilling;
                    Log("Deducted Points ");
                    Log("current Points of " + this.players[i][commanVar.username] + " is " + this.players[i][commanVar.score]);
                }
            }
            //update score
            this.currentPlayer[commanVar.score] += points + this.ExtraPointsForKilling;
            this.SendScore();

            Log("pawn killed " + data[commanVar.pawnColour]
                + " pawn number " + data[commanVar.pawnNumber]);

            //sent to all players 
            socket.to(this.roomName).emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
            //send back to the last player
            socket.emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
        });
    }


    OnPawnScearchCompleted(socket) {
        socket.on(socketEvents.ScearchCompleted, (data) => {
            let points = data[commanVar.diceNo];

            //update score
            this.currentPlayer[commanVar.score] += points + this.ExtraPointsForWinningAPawn;
            this.SendScore();

            Log("pawn " + data[commanVar.pawnColour] + "completed the scearch,"
                + "pawn number " + data[commanVar.pawnNumber]);

            //sent to all players 
            socket.to(this.roomName).emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
            //send back to the last player
            socket.emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
        });
    }



    SendScore() {
        IO.to(this.roomName).emit(socketEvents.UpdateScore, { data: this.players });
    }



    OnExit(socket) {
        socket.on(socketEvents.OnExit, (player) => {
            this.RemovePlayer(player, socket);
        });
    }


    async RemovePlayer(player, socket) {
        let removedPlayer = this.RemovePlayerFromArray(player[commanVar.playerId]);
        if (removedPlayer === null) {
            Log(player[commanVar.username] + " Player not found");
            return;
        } else {
            Log(player[commanVar.username] + " Player removed");
            socket.emit(socketEvents.OnLost);
        }
        Log("Remaining Players :");
        //remove the player from every screens
        socket.to(this.roomName).emit(socketEvents.RemovePlayer, { playerId: removedPlayer.playerId });
        for (let i = 0; i < this.SOCKETS.length; i++) {
            if (this.SOCKETS[i].data[commanVar.playerId] === removedPlayer[commanVar.playerId]) {
                this.SOCKETS.splice(i, 1);
            }
        }
        //won if only one player is left in the game
        if (this.players.length === 1) {
            /**
             * dont remove this sleep it will help frontend side 
             * to show Popup properly, this dely will help when 
             * someplayer pause and then kill the app
             */
            Log(this.players);
            //won players
            let playerId = this.players[0][commanVar.playerId];
            let username = this.players[0][commanVar.username];
            let leftplayer = socket.username
            await this.sleep(100);
            Log(username + " player won the game");
            IO.to(this.roomName).emit(socketEvents.YouWon, { playerId, username, leftplayer });
        }
        socket.leave(this.roomName);
        this.RemoveGameplayListners(socket);
    }


    OnDissconnect(socket) {
        socket.on(socketEvents.OnDisconnect, () => {
            Log(socket.username + " disconnected");
            let player = { playerId: socket[commanVar.playerId], username: socket[commanVar.username] };
            this.RemovePlayer(player, socket)
            return;
            if (this.SOCKETS.length === 0) {
                Log("everyone left ");
                return;
            }
            let _dissconnectedPlayer;
            //remove player for the global scope
            for (let i = 0; i < this.SOCKETS.length; i++) {
                let ID = this.SOCKETS[i].socket.id;
                if (socket.id === ID) {
                    _dissconnectedPlayer = this.SOCKETS[i].data;

                    /**
                     * find player in @param pausedPlayers array
                     * if found the the player left the game
                     */
                    for (let i = 0; i < this.pausedPlayers.length; i++) {
                        if (this.pausedPlayers[i] !== _dissconnectedPlayer[commanVar.playerId]) continue;
                        Log(this.pausedPlayers[i] + " player Left the game");
                        this.RemovePlayer(_dissconnectedPlayer, socket);
                        //remove paused player
                        this.pausedPlayers.splice(i, 1);
                        this.dissconnectedPlayers.push(_dissconnectedPlayer[commanVar.playerId]);
                        IO.to(this.roomName).emit(socketEvents.PausedPlayerDisconnected, {
                            playerId: _dissconnectedPlayer[commanVar.playerId],
                            username: _dissconnectedPlayer[commanVar.username],
                        })
                        return;

                    }


                    this.reconnectingPlayers.push(_dissconnectedPlayer[commanVar.playerId]);
                    this.DisconnectedTimer(_dissconnectedPlayer)
                }
            }



            /**
             * if  @param _dissconnectedPlayer found in 
             * @param this.pausedPlayers the cosider that player
             * as Left
             */

            if (_dissconnectedPlayer === undefined || _dissconnectedPlayer === null) {
                Log("player Dissconnected and notfound player not found");
                return;
            }
            Log("Player is Dissconnected :" + _dissconnectedPlayer[commanVar.username]);
            // this.RemovePlayerFromArray(dissconnectedPlayer[commanVar.playerId]);
            Log("trying to connect " + _dissconnectedPlayer[commanVar.username] + " players");
            IO.to(this.roomName).emit(socketEvents.Reconnecting,
                {
                    playerId: _dissconnectedPlayer[commanVar.playerId],
                    username: _dissconnectedPlayer[commanVar.username]
                })


            if (this.SOCKETS.length === 1) {
                this.SOCKETS[0].socket
                    .emit(socketEvents.YouWon, { msg: _dissconnectedPlayer.username });
                this.SOCKETS[0].socket.leave(this.roomName);
            }


            //remove the player from every screens
            // socket.to(this.roomName).emit(socketEvents.RemovePlayer, { playerId: removedPlayer.playerId });
        });
    }

    async DisconnectedTimer(ID) {

        for (let i = 0; i < this.reconnectTime; i++) {
            /**find in 
             * @param  this.reconnectingPlayers 
             *   arrya if not found then the player is already connected
             * */
            let isPlayerReconnected = true;
            for (let j = 0; j < this.reconnectingPlayers.length; i++) {
                //if the player is still in reconnecting array the players is still disconnected
                if (ID[commanVar.playerId] === this.reconnectingPlayers[j]) {
                    isPlayerReconnected = false;
                    break;
                }

            }
            if (isPlayerReconnected) {
                Log(ID[commanVar.username] + " Player reconnected")
                return;
            }

            await this.sleep()
        }
        this.dissconnectedPlayers.push(ID[commanVar.playerId]);
        Log("failed to reconnect Player " + ID[commanVar.username])
        IO.to(this.roomName).
            emit(socketEvents.OnFailToReconnect, { playerId: ID[commanVar.playerId] });
    }

    OnReconnect(data) {

        for (let i = 0; i < this.dissconnectedPlayers.length; i++) {
            if (data[commanVar.playerId] === this.dissconnectedPlayers[i][commanVar.playerId]) {
                data[commanVar.socket].emit(socketEvents.ReconnectingTimeUP);
                Log("Failed to reconnect player " + data[commanVar.username]);
                Log("Reconnecting timer UP");
                return;
            }
        }

        for (let i = 0; i < this.reconnectingPlayers.length; i++) {
            if (data[commanVar.playerId] === this.reconnectingPlayers[i]) {
                Log(data[commanVar.username] + " Reconnected")
                this.isReconnecting = false;
                this.reconnectingPlayers.splice(i, 1);//remove player
                break;

            }
        }

        for (let i = 0; i < this.SOCKETS.length; i++) {
            if (data[commanVar.playerId] === this.SOCKETS[i].data[commanVar.playerId]) {
                this.SOCKETS[i].socket = data[commanVar.socket];
                Log(data.username + " Player added into data successfully")
                data[commanVar.socket].join(this.roomName, () => {
                    data[commanVar.socket].to(this.roomName).emit(socketEvents.OnReconnected, {
                        playerId: data[commanVar.playerId]
                    });
                });
                return;
            }
        }
        Log(data.username + " player not found");
    }

    OnPlayerPaused(socket) {
        socket.on(socketEvents.OnPlayerPaused, (ID) => {
            Log(ID[commanVar.username] + " Player paused");
            this.pausedPlayers.forEach((player) => {
                //make sure the player is not already in the list
                if (player === ID[commanVar.playerId]) {
                    return;
                }
            })

            //tell everyone player is paused
            socket.to(this.roomName).emit(socketEvents.OnPlayerWentOffline,
                { playerId: ID[commanVar.playerId], username: ID[commanVar.username] });
            this.pausedPlayers.push(ID[commanVar.playerId]);
            this.PauseCoundown(ID, socket);

        })
    }

    async PauseCoundown(ID, socket) {
        //remove player after sometime
        for (let i = 0; i < this.reconnectTime; i++) {
            let isPlayerStillinPausedMode = false;
            //if the player missing from the array it means the player is already reconnected
            for (let j = 0; j < this.pausedPlayers.length; j++) {
                //player is still in paused mode
                if (this.pausedPlayers[j] === ID[commanVar.playerId]) {
                    Log(ID[commanVar.username] + " player still is in paused mode");
                    isPlayerStillinPausedMode = true;
                    break;
                }

            }
            //if player reconnected the stop the timer
            if (!isPlayerStillinPausedMode) {
                Log(ID[commanVar.username] + " player probably unpaused")
                return;//the player is already reconnected no need to remove the player 
            }

            await this.sleep();
        }

        this.RemovePlayer(ID, socket);
    }

    OnPlayerUnPaused(socket) {
        socket.on(socketEvents.OnPlayerUnPaused, (ID) => {
            Log(ID[commanVar.username] + " Player Unpaused");
            for (let i = 0; i < this.pausedPlayers.length; i++) {
                if (this.pausedPlayers[i] === ID[commanVar.playerId]) {
                    Log(ID[commanVar.username] + " paused player removed form array")
                    socket.to(this.roomName).emit(socketEvents.OnPlayerUnPaused,
                        { playerId: ID[commanVar.playerId], username: ID[commanVar.username] });
                    this.pausedPlayers.splice(i, 1);
                    return;
                }
            }
            Log(ID[commanVar.username] + " Player not found IN Paused array")
        })
    }


    OnDoubleChance(socket) {
        socket.on(socketEvents.OnDoubleChance, () => {
            //update score
            this.currentPlayer[commanVar.score] += 6 + this.ExtraPointsForDoubleChance;

            this.SendScore();

            //send back to the last player
            socket.emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
        });
    }


    //this function will run if the player ignores his/her turn
    //which will reduce his/her chance and a life
    //there are only three lifes
    //once the three life is finished
    //the player will be eliminated
    OnChanceMiss(socket) {
        socket.on(socketEvents.OnChanceMiss, (player) => {
            Log(player[commanVar.username] + " player ignores its turn")
            let playerInstance = this.GetPlayerInstance(player[commanVar.playerId]);
            if (playerInstance === null || playerInstance === undefined) {
                Log(player[commanVar.username] + "player not found probably left the game");
                return;
            }
            playerInstance[commanVar.chance] -= 1;
            Log(playerInstance);
            if (playerInstance[commanVar.chance] < 0) {
                Log(player[commanVar.username] + " player lost the")
                this.RemovePlayer(player, socket);
                return;
            }
            IO.to(this.roomName).emit(socketEvents.UpdateLife,
                {
                    playerId: playerInstance[commanVar.playerId],
                    chances: playerInstance[commanVar.chance]
                });

            //swith player
            this.currentPlayer = this.GetNextPlayerIndex(player[commanVar.playerId]);
            Log(player[commanVar.username] + " player missed its chance");
            Log("next player " + this.currentPlayer[commanVar.username]);

            //sent to all players 
            IO.to(this.roomName).emit(socketEvents.OnPlayerSwitch, {
                nextPlayerId: this.currentPlayer[commanVar.playerId],
                nextUsername: this.currentPlayer[commanVar.username],
            })
        });
    }

    //helper functions
    GetNextPlayerIndex(ID) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i][commanVar.playerId] === ID) {
                if (i === this.players.length - 1) {
                    return this.players[0];
                }
                ++i;
                return this.players[i]
            }
        }
        return null;
    }


    GetPlayerInstance(ID) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i][commanVar.playerId] === ID) {
                return this.players[i]
            }
        }
        Log(ID + " Player not found");
        return null;
    }


    RemovePlayerFromArray(ID) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i][commanVar.playerId] === ID) {
                let removedPlayer = this.players[i];
                this.players.splice(i, 1);

                if (this.players.length === 0) {
                    Log("Everone left")
                    this.isTimeUp = true;
                }

                return removedPlayer;
            }
        }

        return null;
    }


    RemoveGameplayListners(socket) {
        socket.removeAllListeners(socketEvents.OnDiceRoll);
        socket.removeAllListeners(socketEvents.OnPawnFinishMoving);
        socket.removeAllListeners(socketEvents.OnPawnKilled);
        socket.removeAllListeners(socketEvents.OnDoubleChance);
        socket.removeAllListeners(socketEvents.OnExit);
        socket.removeAllListeners(socketEvents.OnPawnMove);
        socket.removeAllListeners(socketEvents.OnDissconnect);
        socket.leave(this.roomName);
    }
    //helper  s
    //------------------TIMER------------------------
    async CountDown(sec = 30, min = 1) {
        let timer;
        let miniutsLeft;
        let secLeft;
        while (min > -1) {
            if (this.isTimeUp) {
                break;
            }
            miniutsLeft = min;
            secLeft = sec;
            if (sec.toString().split.Length == 1)
                timer = `${min}:0${sec}`;
            else
                timer = `${min}:${sec}`;
            await this.sleep(1000);
            if (sec < 1) {
                sec = 60;
                min--;
            }
            sec--;
            Log("Timer :" + timer);
            IO.to(this.roomName).emit(socketEvents.Timer, { timer });
        }
        timer = "0:00";
        this.isTimeUp = true;
    }
    sleep(ms = 1000) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    OnGameFinshed(socket) {
        socket.on(socketEvents.OnGameFinshed, () => {
            Log(socket.username + " won the game");
            for (let i = 0; i < this.SOCKETS.length; i++) {
                this.RemoveGameplayListners(this.SOCKETS[i].socket);
            }
            // this.isTimeUp=true;
            // delete this.SOCKETS;
            // delete this.players;
        });
    }
    //------------------TIMER------------------------
}

module.exports = LUDO;
module.exports.GetSocket = GetSocket;