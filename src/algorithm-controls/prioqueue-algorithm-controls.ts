import { addReturnSubmit, querySelector } from "~/helpers";
import { Prioqueue } from "~/prioqueues";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class PrioQueueAlgorithmControl extends EngineAlgorithmControl {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    deleteSubmit: HTMLInputElement;
    clearSubmit: HTMLInputElement;
    engine: Prioqueue;
    constructor(container: HTMLElement, engine: Prioqueue) {
        super(container);

        this.engine = engine;

        this.insertSelect = querySelector<HTMLSelectElement>(
            "select.insertSelect",
            this.algorithmControls
        );
        this.insertField = querySelector<HTMLInputElement>(
            "input.insertField",
            this.algorithmControls
        );
        this.insertSubmit = querySelector<HTMLInputElement>(
            "input.insertSubmit",
            this.algorithmControls
        );
        this.deleteSubmit = querySelector<HTMLInputElement>(
            "input.deleteSubmit",
            this.algorithmControls
        );
        this.clearSubmit = querySelector<HTMLInputElement>(
            "input.clearSubmit",
            this.algorithmControls
        );

        this.initialize();
    }

    initialize() {
        this.insertSelect.addEventListener("change", () => {
            this.insertField.value = this.insertSelect.value;
            this.insertSelect.value = "";
        });

        addReturnSubmit(this.insertField, "ALPHANUM+", () =>
            this.engine.submit(this.engine.insert, this.insertField)
        );

        this.insertSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.insert, this.insertField)
        );

        this.deleteSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.deleteMin, null)
        );

        this.clearSubmit.addEventListener("click", () =>
            this.engine.confirmResetAll()
        );
    }
}
