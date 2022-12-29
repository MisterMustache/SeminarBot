export let pause = true;
let escapePressedOnce = false;      // used only to be able to go back in game after pressing esc in pause menu

export let escapePressedOnceExport = {
    get value() {
        return escapePressedOnce;
    },
    set value(newValue) {
        escapePressedOnce = newValue;
    }
};

const startDiv = document.getElementById("startDiv");
const pauseDiv = document.getElementById("pauseDiv");
const gameDiv = document.getElementById("gameDiv");
const loaderDiv = document.getElementById("loaderDiv");
// const gameCanvas = document.getElementById("gameCanvas");

const startButton = document.getElementById("startButton");
const quitButton = document.getElementById("quitButton");
const resumeButton = document.getElementById('resumeButton');

pauseDiv.style.display = "none";
loaderDiv.style.display = "none";
gameDiv.style.display = "none";

startButton.addEventListener("click", function() {
    // load main.js to start the game
    const script = document.createElement("script");
    script.src = "src/main.js";
    script.type = "module";
    document.body.appendChild(script);

    // display game divs
    startDiv.style.display = "none";
    gameDiv.style.display = "block";
    loaderDiv.style.display = "block";

    pause = false;
    // gameCanvas.requestPointerLock();     // locks pointer, but drops framerate for some reason
});

quitButton.addEventListener("click", function() {
    // simply reload
    location.reload();
});

resumeButton.addEventListener("click", function() {
    pauseDiv.style.display = "none";
    gameDiv.style.display = "block";
    pause = false;
    // gameCanvas.requestPointerLock();
});

document.addEventListener('keydown', function(event) {
    // if game was started and escape button was pressed
    if (gameDiv.style.display === "block" && event.key === 'Escape' && !pause) {
        // if esc was pressed while in game, then get pause menu
        pauseDiv.style.display = "block";
        gameDiv.style.display = "block";
        loaderDiv.style.display = "none";
        pause = true;
        escapePressedOnce = false;
    }
});

document.addEventListener('keyup', function (event) {
    // go back in game after pressing esc while already in pause menu (basically the same as clicking resume)
    if (gameDiv.style.display === "block" && event.key === 'Escape' && pause && escapePressedOnce) {
        resumeButton.click();
    }
    escapePressedOnce = true;
});
