
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
/* exported initialisePrioQueues, PQEngine */
///////////////////////////////////////////////////////////////////////////////

let PQEngine = null;
let right = 0;
let down = 0;
let zoom = 1;
let scrollSpeed = 5;

function initialisePrioQueues(containerID) {
    const algoSelector = document.querySelector(`${containerID} .algorithmSelector`);
    algoSelector.addEventListener("change", () => {
        if (algoSelector.value) {
            const params = {algorithm: algoSelector.value};
            if (PQEngine.DEBUG) params.debug = PQEngine.DEBUG;
            const url = `${window.location.pathname}?${new URLSearchParams(params)}`;
            window.history.replaceState("", "", url);
        }
        window.location.reload();
    });

       

    let algoClass = new URL(window.location).searchParams.get("algorithm");
    if (!(algoClass && /^[\w.]+$/.test(algoClass) && algoClass in DSVis))
        algoClass = "";
    algoSelector.value = algoClass;
    const PrioQueue = algoClass ? DSVis[algoClass] : DSVis.Engine;
    PQEngine = new PrioQueue(containerID);
    PQEngine.initialise();

    const container = PQEngine.Container;
    const tools = PQEngine.Toolbar;
    tools.insertSelect = container.querySelector(".insertSelect");
    tools.insertField = container.querySelector(".insertField");
    tools.insertSubmit = container.querySelector(".insertSubmit");
    tools.sortSubmit = container.querySelector(".sortSubmit");
    tools.clearSubmit = container.querySelector(".clearSubmit");
    tools.psuedoCode = container.querySelector(".psuedoCode");
    

    document.querySelector(".zoomIn").addEventListener("click", () => zoomIn(true));
    document.querySelector(".zoomOut").addEventListener("click", () => zoomIn(false));
    document.querySelector(".scrollSpeed").addEventListener("change", (event) => {scrollSpeed = Number(event.target.value);event.target.blur();});
    document.querySelector(".moveLeft").addEventListener("click", () => goRight(false));
    document.querySelector(".moveRight").addEventListener("click", () => goRight(true));
    document.querySelector(".moveUp").addEventListener("click", () => goDown(false));
    document.querySelector(".moveDown").addEventListener("click", () => goDown(true));
    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });

    
    DSVis.addReturnSubmit(tools.insertField, "ALPHANUM+", () => PQEngine.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => PQEngine.submit("insert", tools.insertField));
    tools.sortSubmit.addEventListener("click", () => PQEngine.submit("sort", " "));
    tools.clearSubmit.addEventListener("click", () => PQEngine.confirmResetAll());
    addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {goDown(true);}
        else if (event.key === "ArrowUp") {goDown(false);}
        else if (event.key === "ArrowRight") {goRight(true);}
        else if (event.key === "ArrowLeft") {goRight(false);}
    });
}

function goRight(goingRight) {
    if(goingRight) {
    right+=scrollSpeed;
    } else if (right > 0) {
        right-=scrollSpeed;
    }
    PQEngine.drawViewbox(right, down, zoom)
}
function goDown(goingDown) {
    if(goingDown) {
    down+=scrollSpeed;
    } else if (down > 0) {
        down-=scrollSpeed;
    }
    PQEngine.drawViewbox(right, down, zoom)
}
function zoomIn(zoomingIn) {
    if(zoomingIn && zoom > 0.2) {
        zoom-=0.1;
    } else if(zoom < 3) {
        zoom+=0.1;
    }
    PQEngine.drawViewbox(right, down, zoom)
}