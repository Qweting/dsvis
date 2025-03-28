import { addReturnSubmit, initialiseEngine } from "./helpers";
import { SelectionSort } from "./sorting/SelectionSort";
import { InsertionSort } from "./sorting/InsertionSort";
import { MergeSort } from "./sorting/MergeSort";
import { QuickSort } from "./sorting/QuickSort";
import { Engine } from "./engine";
let right: number = 0;
let down: number = 0;
let zoom: number = 1;
let scrollSpeed: number = 1;
const SORTING_CLASSES = {
    SelectionSort: SelectionSort,
    InsertionSort: InsertionSort,
    MergeSort: MergeSort,
    QuickSort: QuickSort,
} as const;

const SortEngine = initialiseEngine("#sortingContainer", SORTING_CLASSES);

const zoomInButton = document.querySelector(".zoomIn");
if (zoomInButton) {
    zoomInButton.addEventListener("click", () => zoomIn(true, SortEngine));
}
const zoomOutButton = document.querySelector(".zoomOut");
if (zoomOutButton) {
    zoomOutButton.addEventListener("click", () => zoomIn(false, SortEngine));
}
const scrollSpeedElement = document.querySelector<HTMLInputElement>(".scrollSpeed");
if (scrollSpeedElement) {
    scrollSpeedElement.addEventListener("change", (event: Event) => {
        scrollSpeed = Number((event.target as HTMLInputElement).value);
        (event.target as HTMLInputElement).blur();
    });
}
const moveLeftButton = document.querySelector(".moveLeft");
if (moveLeftButton) {
    moveLeftButton.addEventListener("click", () => goRight(false, SortEngine));
}
const moveRightButton = document.querySelector(".moveRight");
if (moveRightButton) {
    moveRightButton.addEventListener("click", () => goRight(true, SortEngine));
}
const moveUpButton = document.querySelector(".moveUp");
if (moveUpButton) {
    moveUpButton.addEventListener("click", () => goDown(false, SortEngine));
}
const moveDownButton = document.querySelector(".moveDown");
if (moveDownButton) {
    moveDownButton.addEventListener("click", () => goDown(true, SortEngine));
}

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

function goRight(goingRight: boolean, SortEngine: Engine) {
    if (goingRight) {
        right += scrollSpeed;
    } else if (right > 0) {
        right -= scrollSpeed;
    }
    SortEngine.drawViewbox(right, down, zoom);
}
function goDown(goingDown: boolean, SortEngine: Engine) {
    if (goingDown) {
        down += scrollSpeed;
    } else if (down > 0) {
        down -= scrollSpeed;
    }
    SortEngine.drawViewbox(right, down, zoom);
}
function zoomIn(zoomingIn: boolean, SortEngine: Engine) {
    if (zoomingIn && zoom > 0.2) {
        zoom -= 0.1;
    } else if (zoom < 3) {
        zoom += 0.1;
    }
    SortEngine.drawViewbox(right, down, zoom);
}
