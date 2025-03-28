import { addReturnSubmit, querySelector } from "~/helpers";
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

        this.insertField = querySelector<HTMLInputElement>(
            "input.insertField",
            container
        );
        this.createLeft = querySelector<HTMLInputElement>(
            "input.createLeft",
            container
        );
        this.createRight = querySelector<HTMLInputElement>(
            "input.createRight",
            container
        );
        this.moveParent = querySelector<HTMLInputElement>(
            "input.moveParent",
            container
        );
        this.moveLeft = querySelector<HTMLInputElement>(
            "input.moveLeft",
            container
        );
        this.moveRight = querySelector<HTMLInputElement>(
            "input.moveRight",
            container
        );
        this.rotateLeft = querySelector<HTMLInputElement>(
            "input.rotateLeft",
            container
        );
        this.rotateRight = querySelector<HTMLInputElement>(
            "input.rotateRight",
            container
        );
        this.markNode = querySelector<HTMLInputElement>(
            "input.markNode",
            container
        );
        this.copyToMark = querySelector<HTMLInputElement>(
            "input.copyToMark",
            container
        );
        this.deleteNode = querySelector<HTMLInputElement>(
            "input.deleteNode",
            container
        );
        this.restartQuiz = querySelector<HTMLInputElement>(
            "input.restartQuiz",
            container
        );

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
