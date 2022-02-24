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
snakeLength = 3;
let snakeBody = [];
let direction = 'right';
let currentPosition = {"x": 50, "y": 50};
let gridSize = 10;
let foodCords;
let interval;
let startCounter = 0;
let score = 0;
let playerName;
let startTime;
let playerMoves = [];

function start() {
    startTime = new Date();
    playerName = document.querySelector("#name").value;
    document.querySelector(".gameMenu").style.visibility = "hidden";
    interval = setInterval(moveSnake, 100);
    canvas = document.querySelector('.canvas');
    ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 200;
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

document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

let xDown = null;
let yDown = null;

function getTouches(evt) {
    return evt.touches ||
        evt.originalEvent.touches;
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
};

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;

    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
            if (!(direction === "right")) {
                direction = "left"
            }
        } else {
            if (!(direction === "left")) {
                direction = "right"
            }
        }
    } else {
        if (yDiff > 0) {
            if (!(direction === "down")) {
                direction = "up"
            }
        } else {
            if (!(direction === "up")) {
                direction = "down"
            }
        }
    }
    xDown = null;
    yDown = null;
}

function moveSnake() {
    switch (direction) {
        case 'up':
            currentPosition['y'] = currentPosition['y'] - gridSize;
            drawSnake();
            break;
        case 'down':
            currentPosition['y'] = currentPosition['y'] + gridSize;
            drawSnake();
            break;
        case 'left':
            currentPosition['x'] = currentPosition['x'] - gridSize;
            drawSnake();
            break;
        case 'right':
            currentPosition['x'] = currentPosition['x'] + gridSize;
            drawSnake();
            break;
    }
}

function drawSnake() {
    snakeBody.push([currentPosition['x'], currentPosition['y']]);
    ctx.fillStyle = "white";
    ctx.fillRect(currentPosition['x'], currentPosition['y'], gridSize - .5, gridSize - .5);
    playerMoves.push([currentPosition['x'], currentPosition['y']]);
    if (startCounter >= 3) {
        for (let i = 0; i < snakeLength; i++) {
            // Snake has eaten itself
            if (snakeBody[i][0] === currentPosition["x"] && snakeBody[i][1] === currentPosition["y"] || checkBorder()) {
                submitScore()
                document.querySelector(".gameOver").style.visibility = "visible";
                clearInterval(interval);
            }
        }
    } else
        startCounter++;
    checkIfEat()
    if (snakeBody.length > snakeLength) {
        var itemToRemove = snakeBody.shift();
        ctx.clearRect(itemToRemove[0], itemToRemove[1], gridSize, gridSize);
    }
}

function checkIfEat() {
    if (currentPosition["x"] === foodCords["x"] && currentPosition["y"] === foodCords["y"]) {
        spawnFood()
        snakeLength++;
        score++;
        document.querySelector("#score").innerHTML = "Score: " + score;
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
        return true;
    } else if (currentPosition["x"] === -10) {
        return true;
    } else if (currentPosition["y"] === canvas.height + 10) {
        return true;
    } else if (currentPosition["y"] === -10) {
        return true;
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

function submitScore() {
    if (score > 1) {
        fetch('http://localhost:15486/submitScore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "name": playerName,
                "score": score,
                "start": startTime,
                "playerMoves": playerMoves
            })
        })
            .then((response) => response.json())
            .then((data) => {
                    console.log(data)
                }
            )
            .catch((error) => {
                console.error('Error:', error);
            });
    }
}