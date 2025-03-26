import { addReturnSubmit } from "~/helpers";
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

        const insertSelect =
            this.algorithmControls.querySelector<HTMLSelectElement>(
                "select.insertSelect"
            );
        const insertField =
            this.algorithmControls.querySelector<HTMLInputElement>(
                "input.insertField"
            );
        const insertSubmit =
            this.algorithmControls.querySelector<HTMLInputElement>(
                "input.insertSubmit"
            );
        const deleteSubmit =
            this.algorithmControls.querySelector<HTMLInputElement>(
                "input.deleteSubmit"
            );
        const clearSubmit =
            this.algorithmControls.querySelector<HTMLInputElement>(
                "input.clearSubmit"
            );

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

        this.insertSelect = insertSelect;
        this.insertField = insertField;
        this.insertSubmit = insertSubmit;
        this.deleteSubmit = deleteSubmit;
        this.clearSubmit = clearSubmit;

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
