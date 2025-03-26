import { addReturnSubmit } from "~/helpers";
import { AVLQuiz } from "~/quizzes/AVL-quiz";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class AVLQuizAlgorithmControl extends EngineAlgorithmControl {
    insertField: HTMLInputElement;
    createLeft: HTMLInputElement;
    createRight: HTMLInputElement;
    moveParent: HTMLInputElement;
    moveLeft: HTMLInputElement;
    moveRight: HTMLInputElement;
    rotateLeft: HTMLInputElement;
    rotateRight: HTMLInputElement;
    markNode: HTMLInputElement;
    copyToMark: HTMLInputElement;
    deleteNode: HTMLInputElement;
    restartQuiz: HTMLInputElement;
    engine: AVLQuiz;

    constructor(container: HTMLElement, engine: AVLQuiz) {
        super(container);

        this.engine = engine;

        const insertField =
            container.querySelector<HTMLInputElement>("input.insertField");
        const createLeft =
            container.querySelector<HTMLInputElement>("input.createLeft");
        const createRight =
            container.querySelector<HTMLInputElement>("input.createRight");
        const moveParent =
            container.querySelector<HTMLInputElement>("input.moveParent");
        const moveLeft =
            container.querySelector<HTMLInputElement>("input.moveLeft");
        const moveRight =
            container.querySelector<HTMLInputElement>("input.moveRight");
        const rotateLeft =
            container.querySelector<HTMLInputElement>("input.rotateLeft");
        const rotateRight =
            container.querySelector<HTMLInputElement>("input.rotateRight");
        const markNode =
            container.querySelector<HTMLInputElement>("input.markNode");
        const copyToMark =
            container.querySelector<HTMLInputElement>("input.copyToMark");
        const deleteNode =
            container.querySelector<HTMLInputElement>("input.deleteNode");
        const restartQuiz =
            container.querySelector<HTMLInputElement>("input.restartQuiz");

        if (!insertField) {
            throw new Error("Could not find insert field");
        }
        if (!createLeft) {
            throw new Error("Could not find create left field");
        }
        if (!createRight) {
            throw new Error("Could not find create right field");
        }
        if (!moveParent) {
            throw new Error("Could not find move parent field");
        }
        if (!moveLeft) {
            throw new Error("Could not find move left field");
        }
        if (!moveRight) {
            throw new Error("Could not find move right field");
        }
        if (!rotateLeft) {
            throw new Error("Could not find rotate left field");
        }
        if (!rotateRight) {
            throw new Error("Could not find rotate right field");
        }
        if (!markNode) {
            throw new Error("Could not find mark node field");
        }
        if (!copyToMark) {
            throw new Error("Could not find copy to mark field");
        }
        if (!deleteNode) {
            throw new Error("Could not find delete node field");
        }
        if (!restartQuiz) {
            throw new Error("Could not find restart quiz field");
        }

        this.insertField = insertField;
        this.createLeft = createLeft;
        this.createRight = createRight;
        this.moveParent = moveParent;
        this.moveLeft = moveLeft;
        this.moveRight = moveRight;
        this.rotateLeft = rotateLeft;
        this.rotateRight = rotateRight;
        this.markNode = markNode;
        this.copyToMark = copyToMark;
        this.deleteNode = deleteNode;
        this.restartQuiz = restartQuiz;

        this.initialize();
    }

    initialize() {
        addReturnSubmit(this.insertField, "ALPHANUM");

        this.createLeft.addEventListener("click", () =>
            this.engine.submit(this.engine.insertLeft, this.insertField)
        );

        this.createRight.addEventListener("click", () =>
            this.engine.submit(this.engine.insertRight, this.insertField)
        );

        this.moveParent.addEventListener("click", () =>
            this.engine.execute(this.engine.moveParent, [])
        );

        this.moveLeft.addEventListener("click", () =>
            this.engine.execute(this.engine.moveChild, ["left"])
        );

        this.moveRight.addEventListener("click", () =>
            this.engine.execute(this.engine.moveChild, ["right"])
        );

        this.rotateLeft.addEventListener("click", () =>
            this.engine.execute(this.engine.rotateCurrent, ["left"])
        );

        this.rotateRight.addEventListener("click", () =>
            this.engine.execute(this.engine.rotateCurrent, ["right"])
        );

        this.markNode.addEventListener("click", () =>
            this.engine.execute(this.engine.markNode, [])
        );

        this.copyToMark.addEventListener("click", () =>
            this.engine.execute(this.engine.copyToMark, [])
        );

        this.deleteNode.addEventListener("click", () =>
            this.engine.execute(this.engine.deleteCurrent, [])
        );

        this.restartQuiz.addEventListener("click", () =>
            this.engine.resetAll()
        );
    }
}
