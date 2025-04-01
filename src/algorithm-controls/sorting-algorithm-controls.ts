import { addReturnSubmit, querySelector } from "~/helpers";
import { Sorter } from "~/sorting";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class SortingAlgorithmControls extends EngineAlgorithmControl {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    sortSubmit: HTMLInputElement;
    pseudoCode: HTMLDivElement;
    clearSubmit: HTMLInputElement;
    engine: Sorter;

    constructor(container: HTMLElement, engine: Sorter) {
        super(container);
        this.engine = engine;

        this.insertSelect = querySelector<HTMLSelectElement>(
            "select.insertSelect",
            container
        );
        this.insertField = querySelector<HTMLInputElement>(
            "input.insertField",
            container
        );
        this.insertSubmit = querySelector<HTMLInputElement>(
            "input.insertSubmit",
            container
        );
        this.clearSubmit = querySelector<HTMLInputElement>(
            "input.clearSubmit",
            container
        );
        this.pseudoCode = querySelector<HTMLDivElement>(
            "div.pseudoCode",
            container
        );
        this.sortSubmit = querySelector<HTMLInputElement>(
            "input.sortSubmit",
            container
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

        this.sortSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.sort, null)
        );

        this.clearSubmit.addEventListener("click", () =>
            this.engine.confirmResetAll()
        );
    }
}
