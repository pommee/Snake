const express = require('express');
const cors = require('cors');
const fs = require("fs");
const WebSocket = require("ws");

const wss = new WebSocket.Server({port: 8080});
const clients = new Map();
const games = new Map();

const app = express();
app.use(cors())
app.use(express.json());


/*

        app is used for scoreboard
        wss is used for multiplayer

 */

app.get("/getScores", (req, res) => {
    let response = [];
    fs.readFile('scores.json', (err, data) => {
        if (err) throw err;
        let allPlayerGames = [];
        for (let games of JSON.parse(data)) {
            let name = games.name;
            let bestGame = {"game": null};
            for (let index in games.games) {
                let game = games.games[index]
                let gameID = Object.keys(game)[0]
                game = game[Object.keys(game)[0]]
                let userGame = {
                    "player": name,
                    "ID": gameID,
                    "score": game.score,
                    "start": game.start,
                    "moves": game.moves
                }
                if (bestGame.game === null)
                    bestGame = userGame
                else if (game.score > bestGame.score)
                    bestGame = userGame
            }
            allPlayerGames.push(bestGame)
        }
        res.send(allPlayerGames)
    })
})

app.post("/submitScore", (req, res) => {
    fs.readFile('scores.json', (err, data) => {
        if (err) throw err;
        let allData = []
        let body = req.body;
        allData = JSON.parse(data);
        if (allData.length === 0) {
            console.log("NEW PLAYER")
            let user = {
                "name": body.name,
                games: {
                    [uuidv4()]: {
                        "score": body.score,
                        "start": new Date(),
                        "moves": body.playerMoves
                    }
                }
            }
            allData.push(user)
        } else {
            let indexOfPlayer = findIndexOfPlayer(allData, body.name)
            if (indexOfPlayer === undefined) {
                let user = {
                    "name": body.name,
                    games: {
                        [uuidv4()]: {
                            "score": body.score,
                            "start": new Date(),
                            "moves": body.playerMoves
                        }
                    }
                }
                allData.push(user)
            } else
                allData = writeGameToPlayer(indexOfPlayer, body, allData)
        }
        writeToFile(allData)
    });

    res.send(JSON.stringify({
        "response": "test"
    }))
});

function writeGameToPlayer(indexOfPlayer, body, allData) {
    let game = {
        [uuidv4()]: {
            "score": body.score,
            "start": new Date(),
            "moves": body.playerMoves
        }
    }
    let playerObj = [];
    try {
        for (let oldGame of allData[indexOfPlayer].games)
            playerObj.push(oldGame)
    } catch (TypeError) {
        playerObj.push(allData[indexOfPlayer].games)
    }
    playerObj.push(game)
    allData[indexOfPlayer].games = playerObj;
    return allData;
}

function writeToFile(allData) {
    fs.writeFile("scores.json", JSON.stringify(allData), (err) => {
        if (err) console.log(err);
    });
}

function findIndexOfPlayer(arr, name) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].name === name) {
            return i;
        }
    }
}

wss.on("connection", function connection(ws) {
    const id = uuidv4();
    clients.set(id, ws);

    ws.on("message", (messageAsString) => {
        const message = JSON.parse(messageAsString);
        const metadata = clients.get(id);
        message.sender = metadata.id;

        let name = message.name;

        if (message.message === "newGame") {
            let sessionID = uuidv4()
            const player = {"id": id, "name": name, "ready": false, "moves": []}
            let players = [];
            players.push(player)
            const game = {"players": players, sessionID: sessionID}
            games.set(sessionID, {game})
            let message = {
                "name": id,
                "sessionID": sessionID
            }
            ws.send(JSON.stringify(message))
        }
        if (message.message === "join") {
            const game = games.get(message.sessionID)
            const player = {"id": id, "name": message.name, "ready": false, "moves": []}
            let playersList = game.game.players;
            playersList.push(player)
            newUserJoined(games.get(message.sessionID).game.players, message.name)
            let giveID = {
                "flag": "newPlayer",
                "playerUID": id
            }
            ws.send(JSON.stringify(giveID))
        }

        if (message.flag === "ready") {
            if (checkIfBothReady(games.get(message.sessionID).game.players))
                startGame(games.get(message.sessionID).game.players);
            else
                playerReady(games.get(message.sessionID).game.players, message)
        }

        if (message.flag === "move") {
            sendSnakeMoveToOpponent(games.get(message.sessionID).game.players, message.name, message);
        }

        if (message.message === "message") {
            sendMsgToOpponent(games.get(message.sessionID).game.players, message.name, message.value)
        }
    });

    ws.on("close", () => {
        for (let [key] of clients.entries()) {
            if (clients.get(key) === ws) {
                clients.delete(key);
                console.log("Client " + key + " disconnected")
            }
        }
    });
});

// Send message to opponent inside same game
function newUserJoined(players, messageSenderName) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].name !== messageSenderName) {
            let opponent = players[i].id;
            let playerToMsg = clients.get(opponent)
            let msg = {
                "flag": "newPlayer",
                "name": messageSenderName
            }
            playerToMsg.send(JSON.stringify(msg))
        }
    }
}

function sendMsgToOpponent(players, messageSenderName, message) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].name !== messageSenderName) {
            let opponent = players[i].id;
            let playerToMsg = clients.get(opponent)
            let msg = {
                "message": "chat",
                "value": message,
                "name": messageSenderName
            }
            playerToMsg.send(JSON.stringify(msg))
        }
    }
}

function playerReady(players, messageSender) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].name !== messageSender.name) {
            let opponent = players[i].id;
            let playerToMsg = clients.get(opponent)
            let msg = {
                "flag": "ready"
            }
            playerToMsg.send(JSON.stringify(msg))
        } else {
            players[i].ready = true;
        }
    }
}

function checkIfBothReady(players) {
    console.log(players[0].name)
    console.log(players[0].ready)
    console.log(players[1].name)
    console.log(players[1].ready)
    return players[0].ready === true && players[1].ready === true;
}

function startGame(players) {
    let countdownTimer = 3;
    let playerOne = clients.get(players[0].id)
    let playerTwo = clients.get(players[1].id)

    const check = function () {
        if (countdownTimer === 0) {
            let msg = {
                "flag": "startGame"
            }
            playerOne.send(JSON.stringify(msg))
            playerTwo.send(JSON.stringify(msg))
        } else {
            let msg = {
                "flag": "countdown",
                "counter": countdownTimer
            }
            playerOne.send(JSON.stringify(msg))
            playerTwo.send(JSON.stringify(msg))
            countdownTimer--;
            setTimeout(check, 1000); // check again in a second
        }
    };
    check();
}

// Send current snake move to opponent
function sendSnakeMoveToOpponent(players, messageSenderName, message) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].name !== messageSenderName) {
            let opponent = players[i].id;
            let playerToMsg = clients.get(opponent)
            let msg = {
                "flag": "move",
                "snake": message.snake,
                "food": message.food,
            }
            playerToMsg.send(JSON.stringify(msg))
        }
    }
}

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 15486;
app.listen(port, () => console.log(`Listening on port ${port}...`));

// Credit to user "broofa" on stackoverflow.com for this solution, though it was somewhat altered...
// Link - https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}