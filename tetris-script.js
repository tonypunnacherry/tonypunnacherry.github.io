const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

var paused = false;

// UI grid generation
const gridContainer = document.getElementById("grid");
for (let i = 0; i < GRID_HEIGHT; i++) {
    const gridRow = document.createElement("DIV");
    gridRow.classList.add("row");
    for (let j = 0; j < GRID_WIDTH; j++) {
        const gridCell = document.createElement("DIV");
        gridCell.classList.add("cell");
        gridRow.appendChild(gridCell);
    }
    gridContainer.appendChild(gridRow);
}

const isLocked = Array.from({length: GRID_HEIGHT}, () => Array(GRID_WIDTH).fill(undefined));

class TetrisTemplate {
    constructor(north, east, south, west) {
        this.orientations = [north, east, south, west];
    }
}

var level = 1;
var lines = 0;

class TetrisBlock {
    constructor() {
        this.init();
    }

    init() {
        this.template = templates[Math.floor(Math.random() * templates.length)];
        this.rotation = Math.floor(Math.random() * this.template.orientations.length);
        const orientation = this.template.orientations[this.rotation];
        // Compute a random x shift
        const xShift = Math.floor(Math.random() * (GRID_WIDTH - orientation.width + 1));
        this.location = shift(orientation.base, xShift, 0);
        // Relative positions of template (0,0)
        this.xPos = xShift;
        this.yPos = 0;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        for (const [x,y] of this.location) {
            // If any future coordinate will collide...
            if (isLocked[y][x] && activeBlock != null) {
                // End game
                this.location = shift(this.location, 0, -1);
                for (const [x,y] of this.location) {
                    if (y >= 0) isLocked[y][x] = this.color;
                }
                display(true);
                return;
            }
        }
    }

    lock(ahead, fix=true) {
        for (const [x,y] of ahead) {
            // If any future coordinate will collide...
            if (outOfBounds(x,y) || isLocked[y][x]) {
                if (!fix) return true;
                // Lock position
                const toRemove = [];
                for (const [x,y] of this.location) {
                    isLocked[y][x] = this.color;
                    // Validate row
                    if (isLocked[y].every(cell => cell != null)) {
                        toRemove.push(y);
                    }
                }
                // Collision detected, replace active block
                this.init();
                for (const row of toRemove) {
                    isLocked.splice(row, 1);
                    isLocked.unshift(Array(GRID_WIDTH).fill(undefined));
                    lines++;
                    if (lines == 1) {
                        lines = 0;
                        level++;
                        speed = Math.max(50, speed - 25);
                    }
                }
                display();
                return true;
            }
        }
        return false;
    }

    tick() {
        const shifted = shiftDown(this.location);
        if (this.lock(shifted)) return;
        // Update position
        this.location = shifted;
        this.yPos++;
        display();
    }

    rotate(rotator) {
        const rotated = rotate(this, rotator);
        if (this.lock(rotated, false)) return;
        this.location = rotated;
        display();
    }

    shift(shifter) {
        const shifted = shifter(this);
        if (this.lock(shifted, false)) return;
        this.location = shifted;
        if (shifter === shiftLeft) this.xPos--;
        else if (shifter === shiftRight) this.xPos++;
        display();
    }
}

const colors = ["#0341AE", "#72CB3B", "#FFD500", "#FF971C", "#FF3213"];

const templates = [
    new TetrisTemplate(
        {base: [[0,0],[1,0],[2,0],[3,0]], down: 1, right: 0, width: 4, height: 1},
        {base: [[0,0],[0,1],[0,2],[0,3]], down: 0, right: 2, width: 1, height: 4},
        {base: [[0,0],[1,0],[2,0],[3,0]], down: 2, right: 0, width: 4, height: 1},
        {base: [[0,0],[0,1],[0,2],[0,3]], down: 0, right: 1, width: 1, height: 4}
    ),
    new TetrisTemplate(
        {base: [[0,0],[0,1],[1,1],[2,1]], down: 0, right: 0, width: 3, height: 2},
        {base: [[0,0],[1,0],[0,1],[0,2]], down: 0, right: 1, width: 2, height: 3},
        {base: [[0,0],[1,0],[2,0],[2,1]], down: 1, right: 0, width: 3, height: 2},
        {base: [[1,0],[1,1],[1,2],[0,2]], down: 0, right: 0, width: 2, height: 3}
    ),
    new TetrisTemplate(
        {base: [[0,0],[0,1],[1,1],[2,1]], down: 0, right: 0, width: 3, height: 2},
        {base: [[0,0],[0,1],[1,2],[0,2]], down: 0, right: 1, width: 2, height: 3},
        {base: [[0,0],[1,0],[2,0],[0,1]], down: 1, right: 0, width: 3, height: 2},
        {base: [[0,0],[1,0],[1,1],[1,2]], down: 0, right: 0, width: 2, height: 3}
    ),
    new TetrisTemplate(
        {base: [[0,0],[1,0],[0,1],[1,1]], down: 0, right: 0, width: 2, height: 2},
        {base: [[0,0],[1,0],[0,1],[1,1]], down: 0, right: 0, width: 2, height: 2},
        {base: [[0,0],[1,0],[0,1],[1,1]], down: 0, right: 0, width: 2, height: 2},
        {base: [[0,0],[1,0],[0,1],[1,1]], down: 0, right: 0, width: 2, height: 2}
    ),
    new TetrisTemplate(
        {base: [[1,0],[2,0],[0,1],[1,1]], down: 0, right: 0, width: 3, height: 2},
        {base: [[0,0],[0,1],[1,1],[1,2]], down: 0, right: 1, width: 2, height: 3},
        {base: [[1,0],[2,0],[0,1],[1,1]], down: 1, right: 0, width: 3, height: 2},
        {base: [[0,0],[0,1],[1,1],[1,2]], down: 0, right: 0, width: 2, height: 3},
    ),
    new TetrisTemplate(
        {base: [[0,0],[1,0],[1,1],[2,1]], down: 0, right: 0, width: 3, height: 2},
        {base: [[1,0],[0,1],[1,1],[0,2]], down: 0, right: 1, width: 2, height: 3},
        {base: [[0,0],[1,0],[1,1],[2,1]], down: 1, right: 0, width: 3, height: 2},
        {base: [[1,0],[0,1],[1,1],[0,2]], down: 0, right: 0, width: 2, height: 3},
    ),
    new TetrisTemplate(
        {base: [[1,0],[0,1],[1,1],[2,1]], down: 0, right: 0, width: 3, height: 2},
        {base: [[0,0],[0,1],[1,1],[0,2]], down: 0, right: 1, width: 2, height: 3},
        {base: [[0,0],[1,0],[2,0],[1,1]], down: 1, right: 0, width: 3, height: 2},
        {base: [[1,0],[0,1],[1,1],[1,2]], down: 0, right: 0, width: 2, height: 3},
    )
]

function shift(coordinates, x, y) {
    return coordinates.map(coordinate => [coordinate[0] + x, coordinate[1] + y]);
}

function shiftDown(coordinates) {
    return shift(coordinates, 0, 1);
}

const rotateLeft = function(block) {
    let newRot = block.rotation - 1;
    if (newRot < 0) {
        newRot = 3;
    }
    return newRot;
}

const rotateRight = function(block) {
    let newRot = block.rotation + 1;
    if (newRot > 3) {
        newRot = 0;
    }
    return newRot;
}

const shiftLeft = function(block) {
    return shift(block.location, -1, 0);
}

const shiftRight = function(block) {
    return shift(block.location, 1, 0);
}

function rotate(block, rotator) {
    const oldOrientation = block.template.orientations[block.rotation];
    const newOrientation = block.template.orientations[rotator(block)];
    block.rotation = rotator(block);
    const rotXDiff = newOrientation.right - oldOrientation.right;
    const rotYDiff = newOrientation.down - oldOrientation.down;
    // New offsets
    let newX = block.xPos + rotXDiff;
    let newY = block.yPos + rotYDiff;
    // Wall kick
    if (newX < 0) newX = 0;
    if (newX >= GRID_WIDTH - newOrientation.width) newX = GRID_WIDTH - newOrientation.width;
    if (newY < 0) newY = 0;
    if (newY >= GRID_HEIGHT - newOrientation.height) newY = GRID_HEIGHT - newOrientation.height;
    block.xPos = newX;
    block.yPos = newY;
    return shift(newOrientation.base, newX, newY);
}

var activeBlock = new TetrisBlock();
display();

function display(gameover=false) {
    if (activeBlock == null) return;
    // Loop through all locked
    for (let i = 0; i < GRID_HEIGHT; i++) {
        const rowDiv = gridContainer.getElementsByClassName("row")[i];
        for (let j = 0; j < GRID_WIDTH; j++) {
            const cellDiv = rowDiv.getElementsByClassName("cell")[j];
            if (isLocked[i][j] != null) {
                cellDiv.style.backgroundColor = isLocked[i][j];
            } else {
                cellDiv.style.backgroundColor = "";
            }
        }
    }
    // Display active block
    for (const coord of activeBlock.location) {
        const rowDiv = gridContainer.getElementsByClassName("row")[coord[1]];
        if (rowDiv == null) continue;
        const cellDiv = rowDiv.getElementsByClassName("cell")[coord[0]];
        if (cellDiv == null) continue;
        cellDiv.style.backgroundColor = activeBlock.color;
    }
    document.getElementById("level").innerText = level;
    if (gameover) {
        activeBlock=undefined;
        document.getElementById("pause_screen").style.display="none";
        setTimeout(() => {
            document.getElementById("end_screen").style.display="block";
        }, 1000);
    }
}

function outOfBounds(x, y) {
    return x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT;
}

var speed = 550;

const iterate = () => {
    if (paused) return;
    if (activeBlock == null) {
        clearInterval(tickLoop);
        return;
    }
    activeBlock.tick();
    tickLoop = setTimeout(iterate, speed);
};
var tickLoop = setTimeout(iterate, speed);

var cooldown = false;
var pressed = {};

document.addEventListener("keydown", function(event) {
    pressed[event.key] = true;
    if (pressed[" "] && activeBlock != null) {
        paused = !paused;
        if (!paused) document.getElementById("pause_screen").style.display="none";
        else document.getElementById("pause_screen").style.display="block";
    }
    if (activeBlock == null || paused) return;
    if ((pressed["z"] || pressed["Z"]) && !cooldown) {
        activeBlock.rotate(rotateLeft);
        cooldown = true;
        setTimeout(() => {
            cooldown = false;
        }, 100);
    } else if ((pressed["x"] || pressed["X"]) && !cooldown) {
        activeBlock.rotate(rotateRight);
        cooldown = true;
        setTimeout(() => {
            cooldown = false;
        }, 100);
    }
    if (pressed["ArrowDown"]) {
        activeBlock.tick();
    }
    if (pressed["ArrowLeft"]) {
        activeBlock.shift(shiftLeft);
    } else if (pressed["ArrowRight"]) {
        activeBlock.shift(shiftRight);
    }
});

document.addEventListener("keyup", function(event) {
    pressed[event.key] = false;
});