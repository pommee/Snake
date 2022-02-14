let playerName;
let sessionID;
let socket;
let playerUID;


function newGame() {

    connect()
    playerName = document.querySelector("#playerName").value;

    socket.onopen = function () {
        let message = {
            "message": "newGame",
            "name": playerName
        }
        socket.send(JSON.stringify(message));
    };

    listenForMessage()
}

function listenForMessage() {
    socket.onmessage = function (event) {
        const data = (JSON.parse(event.data))
        if (data.hasOwnProperty("sessionID")) {
            sessionID = data.sessionID;
        }
        if (data.hasOwnProperty("name")) {
            playerUID = data.name;
        }

        // If opponent sends a message
        if (data.hasOwnProperty("message")) {
            if (data.hasOwnProperty("value")) {
                document.querySelector("#chatMessages").value += data.name + ": " + data.value + "\n";
            }
        }

        //If user joined then set their playerUID
        if (data.hasOwnProperty("flag")) {
            if (data.hasOwnProperty("playerUID")) {
                if (playerUID === undefined) {
                    playerUID = data.playerUID;
                }
            }
            if (data.hasOwnProperty("counter")) {
                document.querySelector("#chatMessages").value += "Game starts in: " + data.counter + "\n";
            }
            if (data.flag === "startGame") {
                document.querySelector("#chatMessages").value += "Game live!" + "\n";
                start()
            }
            if (data.flag === "move") {
                drawOpponent(data)
            }
        }
        let sessionIDCopy = document.querySelector("#inviteID");
        sessionIDCopy.onclick = function () {
            document.execCommand("copy");
        }

        sessionIDCopy.addEventListener("copy", function (event) {
            event.preventDefault();
            if (event.clipboardData) {
                event.clipboardData.setData("text/plain", sessionIDCopy.textContent.replace("Session ID: ", ""));
            }
        });
        document.querySelector(".menu").style.visibility = "hidden";
        document.querySelector(".playingField").style.visibility = "visible";
        document.querySelector("#inviteID").innerHTML = "Session ID: " + sessionID;
    }
}

function readyUp() {
    let msg = {
        "flag": "ready",
        "sessionID": sessionID,
        "name": playerName,
        "playerUID": playerUID
    }
    socket.send(JSON.stringify(msg))
}

function sendMove() {
    let snake = [currentPosition["x"], currentPosition["y"], gridSize, gridSize];
    let msg = {
        "sessionID": sessionID,
        "name": playerName,
        "playerUID": playerUID,
        "flag": "move",
        "snake": snake,
        "food": foodCords
    }
    socket.send(JSON.stringify(msg))
}

function sendMessage() {
    var key = window.event.keyCode;

    if (key === 13) {
        let msg = {
            "sessionID": sessionID,
            "message": "message",
            "value": document.querySelector("#chat").value,
            "name": playerName,
            "playerUID": playerUID
        }
        document.querySelector("#chatMessages").value += playerName + ": " + document.querySelector("#chat").value + "\n";
        document.querySelector("#chat").value = "";
        console.log(msg)
        socket.send(JSON.stringify(msg))
    }
}

function joinGame() {

    testIfConnectionAlive()
    connect()
    playerName = document.querySelector("#playerName").value;
    sessionID = document.querySelector("#sessionID").value;

    socket.onopen = function (event) {
        let message = {
            "message": "join",
            "sessionID": sessionID,
            "name": playerName
        }
        socket.send(JSON.stringify(message));
    };

    document.querySelector(".menu").style.visibility = "hidden";
    document.querySelector(".playingField").style.visibility = "visible";
    document.querySelector("#inviteID").innerHTML = "Session ID: " + sessionID;

    listenForMessage()
}

function connect() {
    if (socket === undefined) {
        socket = new WebSocket("ws://localhost:8080", "protocolOne");
        localStorage.setItem('socket', socket);
    }
}

function testIfConnectionAlive() {
    const connection = localStorage.getItem('socket');
    if (connection.readyState === WebSocket.CLOSED) {
        console.log("DISCONNECTED")
    } else
        console.log("Connected")
}

/*
           *----------------------------------- Documentation ------------------------------------*
           | canvas          - Reference to canvas on HTML page                                   |
           | ctx             - Context of the canvas                                              |
           | snakeLength     - Length of snake                                                    |
           | direction       - Which way is the snake headed                                      |
           | currentPosition - x & y cords of snake head                                          |
           | gridSize        - Size of "grid"                                                     |
           | foodCords       - x & y cords of food on canvas                                      |
           | interval        - How often the game-field updates per second                        |
           | startCounter    - To prevent initial start of game to be lost (Snake eats itself...) |
           | score           - Game score, += 1 each time the snake eats food                     |
           *--------------------------------------------------------------------------------------*
 */
let canvas;
let ctx;


let opponentCanvas;
let opponentCtx;
let opponentScore = 0;
let opponentCurrentPosition = {"x": 50, "y": 50}
let opponentSnakeBody = [];
opponentSnakeLength = 3;
let opponentFoodCors;

snakeLength = 3;
let snakeBody = [];
let direction = 'right';
let currentPosition = {"x": 50, "y": 50};
let gridSize = 10;
let foodCords;
let interval;
let startCounter = 0;
let score = 0;

function start() {
    interval = setInterval(moveSnake, 100);
    canvas = document.querySelector('.canvas');
    opponentCanvas = document.querySelector('.canvasOpponent');
    ctx = canvas.getContext("2d");
    opponentCtx = opponentCanvas.getContext("2d");
    canvas.width = 200;
    canvas.height = 200;
    opponentCanvas.width = 200;
    opponentCanvas.height = 200;
    spawnFood()
}

// Arrow key pressed, new pos gets set and drawSnake gets called
document.onkeydown = function (event) {
    let keyCode;
    if (event == null) {
        keyCode = window.event.keyCode;
    } else {
        keyCode = event.keyCode;
    }

    switch (keyCode) {
        case 37:
            if (!(direction === "right")) {
                direction = "left"
                break;
            } else {
                break;
            }
        case 38:
            if (!(direction === "down")) {
                direction = "up";
                break;
            } else
                break;
        case 39:
            if (!(direction === "left")) {
                direction = "right";
                break;
            } else
                break;
        case 40:
            if (!(direction === "up")) {
                direction = "down";
                break;
            } else
                break;
        default:
            break;
    }
}

function moveSnake() {
    switch (direction) {
        case 'up':
            currentPosition["y"] = currentPosition["y"] - gridSize;
            drawSnake();
            break;
        case 'down':
            currentPosition["y"] = currentPosition["y"] + gridSize;
            drawSnake();
            break;
        case 'left':
            currentPosition["x"] = currentPosition["x"] - gridSize;
            drawSnake();
            break;
        case 'right':
            currentPosition["x"] = currentPosition["x"] + gridSize;
            drawSnake();
            break;
    }
}

function drawSnake() {
    snakeBody.push([currentPosition["x"], currentPosition["y"]]);
    ctx.fillStyle = "white";
    ctx.fillRect(currentPosition["x"], currentPosition["y"], gridSize, gridSize);
    if (startCounter >= 3) {
        for (let i = 0; i < snakeLength; i++) {
            if (snakeBody[i][0] === currentPosition["x"] && snakeBody[i][1] === currentPosition["y"]) {
                document.querySelector(".gameOver").style.visibility = "visible";
                clearInterval(interval);
            }
        }
    } else
        startCounter++;
    checkIfEat(currentPosition["x"], currentPosition["y"], foodCords["x"], foodCords["y"], false)
    checkBorder()
    if (snakeBody.length > snakeLength) {
        var itemToRemove = snakeBody.shift();
        ctx.clearRect(itemToRemove[0], itemToRemove[1], gridSize, gridSize);
    }
    sendMove()
}

function drawOpponent(opponentSnake) {
    opponentCurrentPosition["x"] = opponentSnake.snake[0];
    opponentCurrentPosition["y"] = opponentSnake.snake[1];
    opponentSnakeBody.push([opponentCurrentPosition["x"], opponentCurrentPosition["y"]])

    opponentFoodCors = [opponentSnake.food["x"], opponentSnake.food["y"]];
    opponentCtx.fillStyle = "green";
    opponentCtx.fillRect(opponentSnake.food["x"], opponentSnake.food["y"], gridSize, gridSize);

    opponentCtx.fillStyle = "white";
    opponentCtx.fillRect(opponentCurrentPosition["x"], opponentCurrentPosition["y"], gridSize, gridSize);
    if (opponentSnakeBody.length > opponentSnakeLength) {
        var itemToRemove = opponentSnakeBody.shift();
        opponentCtx.clearRect(itemToRemove[0], itemToRemove[1], gridSize, gridSize);
    }
    checkIfEat(opponentCurrentPosition["x"], opponentCurrentPosition["y"], opponentFoodCors["x"], opponentFoodCors["y"], true)
}

// Check if player snake or opponent has eaten
function checkIfEat(curPosX, curPosY, foodCordX, foodCordY, opponentMove) {
    if (curPosX === foodCordX && curPosY === foodCordY) {
        if (opponentMove) {
            console.log("OPPONENT JUST ATE")
            opponentSnakeLength++;
            opponentScore++;
            document.querySelector("#opponentScore").innerHTML = "Score: " + opponentScore;
        } else {
            spawnFood()
            snakeLength++;
            score++;
            document.querySelector("#playerScore").innerHTML = "Score: " + score;
        }
    }
}

// Generate food with random x & y coordinates
function spawnFood() {
    let spawnPoint = {
        "x": Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        "y": Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
    if (!(isFoodInSnake(spawnPoint["x"], spawnPoint["y"]))) { // If food does not spawn in snake then place it down
        ctx.fillStyle = "green";
        ctx.fillRect(spawnPoint["x"], spawnPoint["y"], gridSize, gridSize);
        foodCords = spawnPoint;
    } else {
        spawnFood()
    }
}

// Check if snake has reached border, and if so then teleport to other side
function checkBorder() {
    if (currentPosition["x"] === canvas.width) {
        currentPosition["x"] = -10;
    } else if (currentPosition["x"] === -10) {
        currentPosition["x"] = canvas.width;
    } else if (currentPosition["y"] === canvas.height + 10) {
        currentPosition["y"] = -10;
    } else if (currentPosition["y"] === -10) {
        currentPosition["y"] = canvas.height;
    }
}

// Return if food is spawned inside snake
function isFoodInSnake(x, y) {
    for (let i = 0; i < snakeBody.length; i++) {
        if (snakeBody[i][0] === x && snakeBody[i][1] === y) {
            return true
        }
    }
    return false;
}

// Check if snake has eaten itself
function checkCollision(x1, x2, y1, y2) {
    if (x1 === x2 && y1 === y2) {
        return true;
    } else {
        return false;
    }
}