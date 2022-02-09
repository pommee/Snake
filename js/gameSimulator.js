let canvas;
let ctx;

snakeLength = 8;
let snakeBody = [];
let direction = 'right';
let currentPosition = {"x": 50, "y": 50};
let gridSize = 10;
let foodCords;
let interval = setInterval(moveSnake, 100);

function start() {
    canvas = document.querySelector('.canvas');
    ctx = canvas.getContext('2d');
    ctx.fillStyle = "white";
    canvas.width = 1200;
    canvas.height = 800;
    spawnFood()
}

function moveSnake() {
    let move = Math.floor(Math.random() * 10);
    if (move > 8) {
        let dir = Math.floor(Math.random() * 10);
        if (dir > 2)
            direction = 'right';
        if (dir > 4)
            direction = 'left';
        if (dir > 6)
            direction = 'down';
        if (dir > 8)
            direction = 'up';
    }
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
    ctx.fillRect(currentPosition['x'], currentPosition['y'], gridSize, gridSize);
    snakeBody.push([currentPosition['x'], currentPosition['y']]);
    ctx.fillStyle = "white";
    ctx.fillRect(currentPosition['x'], currentPosition['y'], gridSize, gridSize);
    checkIfEat()
    checkBorder()
    if (snakeBody.length > snakeLength) {
        var itemToRemove = snakeBody.shift();
        ctx.clearRect(itemToRemove[0], itemToRemove[1], gridSize, gridSize);
    }
}

function checkIfEat() {
    if (currentPosition["x"] === foodCords["x"] && currentPosition["y"] === foodCords["y"]) {
        spawnFood()
        snakeLength++;
    }
}

function spawnFood() {
    let spawnPoint = {
        "x": Math.floor(Math.random() * (canvas.width / gridSize)) * gridSize,
        "y": Math.floor(Math.random() * (canvas.height / gridSize)) * gridSize
    };
    if (!(checkCollision(spawnPoint.x, currentPosition["x"], spawnPoint.y, currentPosition["y"]))) {
        ctx.fillStyle = "green";
        ctx.fillRect(spawnPoint["x"], spawnPoint["y"], gridSize, gridSize);
        foodCords = spawnPoint;
    }
}

function checkBorder() {
    if (currentPosition["x"] === canvas.width) {
        currentPosition["x"] = 0;
    } else if (currentPosition["x"] === 0) {
        currentPosition["x"] = canvas.width;
    } else if (currentPosition["y"] === canvas.height) {
        currentPosition["y"] = 0;
    } else if (currentPosition["y"] === 0) {
        currentPosition["y"] = canvas.height;
    }
}

function checkCollision(x1, x2, y1, y2) {
    if (x1 === x2 && y1 === y2) {
        return true;
    } else {
        return false;
    }
}