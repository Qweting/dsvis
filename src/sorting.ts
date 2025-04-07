import { SortingAlgorithmControls } from "./algorithm-controls/sorting-algorithm-controls";
import { Engine, SubmitFunction } from "./engine";
import { initialiseEngine, querySelector, RecordOfEngines } from "./helpers";
import { InsertionSort } from "./sorting/InsertionSort";
import { MergeSort } from "./sorting/MergeSort";
import { QuickSort } from "./sorting/QuickSort";
import { SelectionSort } from "./sorting/SelectionSort";

let right: number = 0;
let down: number = 0;
let zoom: number = 1;
let scrollSpeed: number = 1;

export interface Sorter extends Engine {
    sort: SubmitFunction;
    insert: SubmitFunction;
}

const SORTING_CLASSES = {
    SelectionSort: SelectionSort,
    InsertionSort: InsertionSort,
    MergeSort: MergeSort,
    QuickSort: QuickSort,
} as const satisfies RecordOfEngines<Sorter>;

const { engine: SortEngine, isBaseEngine } = initialiseEngine<Sorter>(
    "#sortingContainer",
    SORTING_CLASSES
);

if (!isBaseEngine) {
    SortEngine.algorithmControls = new SortingAlgorithmControls(
        SortEngine.container,
        SortEngine
    );
}

const zoomInButton = querySelector(".zoomIn");
zoomInButton.addEventListener("click", () => zoomIn(true, SortEngine));

const zoomOutButton = querySelector(".zoomOut");
zoomOutButton.addEventListener("click", () => zoomIn(false, SortEngine));

const scrollSpeedElement = querySelector<HTMLInputElement>(".scrollSpeed");
scrollSpeedElement.addEventListener("change", (event: Event) => {
    scrollSpeed = Number((event.target as HTMLInputElement).value);
    (event.target as HTMLInputElement).blur();
});

const moveLeftButton = querySelector(".moveLeft");
moveLeftButton.addEventListener("click", () => goRight(false, SortEngine));

const moveRightButton = querySelector(".moveRight");
moveRightButton.addEventListener("click", () => goRight(true, SortEngine));

const moveUpButton = querySelector(".moveUp");
moveUpButton.addEventListener("click", () => goDown(false, SortEngine));

const moveDownButton = querySelector(".moveDown");
moveDownButton.addEventListener("click", () => goDown(true, SortEngine));

addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
        goDown(true, SortEngine);
    } else if (event.key === "ArrowUp") {
        goDown(false, SortEngine);
    } else if (event.key === "ArrowRight") {
        goRight(true, SortEngine);
    } else if (event.key === "ArrowLeft") {
        goRight(false, SortEngine);
    }
});

function goRight(goingRight: boolean, engine: Engine) {
    if (goingRight) {
        right += scrollSpeed;
    } else if (right > 0) {
        right -= scrollSpeed;
    }
    engine.drawViewbox(right, down, zoom);
}
function goDown(goingDown: boolean, engine: Engine) {
    if (goingDown) {
        down += scrollSpeed;
    } else if (down > 0) {
        down -= scrollSpeed;
    }
    engine.drawViewbox(right, down, zoom);
}
function zoomIn(zoomingIn: boolean, engine: Engine) {
    if (zoomingIn && zoom > 0.2) {
        zoom -= 0.1;
    } else if (zoom < 3) {
        zoom += 0.1;
    }
    engine.drawViewbox(right, down, zoom);
}
