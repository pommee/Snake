const express = require('express');
const cors = require('cors');
const fs = require("fs");

const app = express();
app.use(cors())
app.use(express.json());

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
                else if (game[Object.keys(game)[0]].score > bestGame[Object.keys(bestGame)[0]].score)
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