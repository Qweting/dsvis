import { addReturnSubmit, Engine } from "./engine";
import { SelectionSort } from "./sorting/SelectionSort";
import { InsertionSort } from "./sorting/InsertionSort";
import { MergeSort } from "./sorting/MergeSort";
import { QuickSort } from "./sorting/QuickSort";
import { Sort } from "./sorting/sort";
let right : number = 0;
let down : number= 0;
let zoom : number = 1;
let scrollSpeed : number = 1;
const PRIOQUEUES = {
    SelectionSort: SelectionSort,
    InsertionSort: InsertionSort,
    MergeSort: MergeSort,
    QuickSort: QuickSort,
} as const;

initialisePrioQueues("#prioqueuesContainer");

function initialisePrioQueues(containerID: string) {
    const algoSelector = document.querySelector<HTMLSelectElement>(
        `${containerID} .algorithmSelector`
    );

    if (!algoSelector) {
        throw new Error("Could not find algo selector");
    }

    let algo = new URL(window.location.href).searchParams.get("algorithm");
    if (!(algo && /^[\w.]+$/.test(algo) && algo in PRIOQUEUES)) {
        algo = "";
    }

    const algoClass = algo as keyof typeof PRIOQUEUES | "";
    algoSelector.value = algo;

    const PrioQueue = algoClass ? PRIOQUEUES[algoClass] : Sort;
    const PQEngine = new PrioQueue(containerID);
    PQEngine.initialise();

    algoSelector.addEventListener("change", () => {
        const searchParams = new URLSearchParams();

        if (algoSelector.value in PRIOQUEUES) {
            searchParams.set("algorithm", algoSelector.value);
        } else {
            searchParams.delete("algorithm");
        }

        if (PQEngine.DEBUG) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });

    const container = PQEngine.container;
    const tools = getSortingToolbar(container);

    const zoomInButton = document.querySelector(".zoomIn");
    if (zoomInButton) {
        zoomInButton.addEventListener("click", () => zoomIn(true, PQEngine));
    }
    const zoomOutButton = document.querySelector(".zoomOut");
    if (zoomOutButton) {
        zoomOutButton.addEventListener("click", () => zoomIn(false, PQEngine));
    }
    const scrollSpeedElement = document.querySelector(".scrollSpeed");
    if (scrollSpeedElement) {
        scrollSpeedElement.addEventListener("change", (event) => {
            scrollSpeed = Number((event.target as HTMLInputElement).value);
            (event.target as HTMLInputElement).blur();
        });
    }
    const moveLeftButton = document.querySelector(".moveLeft");
    if (moveLeftButton) {
        moveLeftButton.addEventListener("click", () => goRight(false, PQEngine));
    }
    const moveRightButton = document.querySelector(".moveRight");
    if (moveRightButton) {
        moveRightButton.addEventListener("click", () => goRight(true, PQEngine));
    }
    const moveUpButton = document.querySelector(".moveUp");
    if (moveUpButton) {
        moveUpButton.addEventListener("click", () => goDown(false, PQEngine));
    }
    const moveDownButton = document.querySelector(".moveDown");
    if (moveDownButton) {
        moveDownButton.addEventListener("click", () => goDown(true, PQEngine));
    }
    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });

    addReturnSubmit(tools.insertField, "ALPHANUM+", () =>
        PQEngine.submit("insert", tools.insertField)
    );
    tools.insertSubmit.addEventListener("click", () =>
        PQEngine.submit("insert", tools.insertField)
    );
    tools.sortSubmit.addEventListener("click", () =>
        PQEngine.submit("sort", null)
    );
    tools.clearSubmit.addEventListener("click", () =>
        PQEngine.confirmResetAll()
    );
    addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            goDown(true, PQEngine);
        } else if (event.key === "ArrowUp") {
            goDown(false, PQEngine);
        } else if (event.key === "ArrowRight") {
            goRight(true, PQEngine);
        } else if (event.key === "ArrowLeft") {
            goRight(false, PQEngine);
        }
    });
}

function goRight(goingRight : boolean, PQEngine : Sort) {
    if (goingRight) {
        right += scrollSpeed;
    } else if (right > 0) {
        right -= scrollSpeed;
    }
    PQEngine.drawViewbox(right, down, zoom);
}
function goDown(goingDown : boolean, PQEngine : Sort) {
    if (goingDown) {
        down += scrollSpeed;
    } else if (down > 0) {
        down -= scrollSpeed;
    }
    PQEngine.drawViewbox(right, down, zoom);
}
function zoomIn(zoomingIn : boolean, PQEngine : Sort) {
    if (zoomingIn && zoom > 0.2) {
        zoom -= 0.1;
    } else if (zoom < 3) {
        zoom += 0.1;
    }
    PQEngine.drawViewbox(right, down, zoom);
}

function getSortingToolbar(container: HTMLElement) {
    const insertSelect = container.querySelector<HTMLSelectElement>(
        "select.insertSelect"
    );
    const insertField =
        container.querySelector<HTMLInputElement>("input.insertField");
    const insertSubmit =
        container.querySelector<HTMLInputElement>("input.insertSubmit");
    const deleteSubmit =
        container.querySelector<HTMLInputElement>("input.deleteSubmit");
    const clearSubmit =
        container.querySelector<HTMLInputElement>("input.clearSubmit");
    const psuedoCode =
        container.querySelector<HTMLDivElement>("input.psuedoCode");
    const sortSubmit =
        container.querySelector<HTMLInputElement>("input.sortSubmit");

    if (!insertSelect) {
        throw new Error("Missing insert select");
    }
    if (!insertField) {
        throw new Error("Missing insert field");
    }
    if (!insertSubmit) {
        throw new Error("Missing insert submit");
    }
    if (!deleteSubmit) {
        throw new Error("Missing delete submit");
    }
    if (!clearSubmit) {
        throw new Error("Missing clear submit");
    }
    if (!psuedoCode) {
        throw new Error("Missing clear submit");
    }
    if (!sortSubmit) {
        throw new Error("Missing clear submit");
    }

    return {
        insertSelect,
        insertField,
        insertSubmit,
        deleteSubmit,
        clearSubmit,
        psuedoCode,
        sortSubmit,
    };
}