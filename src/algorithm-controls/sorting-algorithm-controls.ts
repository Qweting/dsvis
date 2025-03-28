import { Sort } from "~/sorting/sort";
import { EngineAlgorithmControl } from "./engine-algorithm-controls"
import { addReturnSubmit } from "~/helpers";

export class SortingAlgorithmControls extends EngineAlgorithmControl{
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    sortSubmit: HTMLInputElement;
    psuedoCode: HTMLDivElement;
    clearSubmit: HTMLInputElement;
    engine: Sort;
    constructor(container: HTMLElement, engine: Sort) {
        super(container);
        this.engine = engine;

        const insertSelect = container.querySelector<HTMLSelectElement>(
            "select.insertSelect"
        );
        const insertField =
            container.querySelector<HTMLInputElement>("input.insertField");
        const insertSubmit =
            container.querySelector<HTMLInputElement>("input.insertSubmit");
        const clearSubmit =
            container.querySelector<HTMLInputElement>("input.clearSubmit");
        const psuedoCode =
            container.querySelector<HTMLDivElement>("div.psuedoCode");
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
        if (!clearSubmit) {
            throw new Error("Missing clear submit");
        }
        if (!sortSubmit) {
            throw new Error("Missing sort submit");
        }
        if (!psuedoCode) {
            throw new Error("Missing psuedo code");
        }

        this.insertSelect = insertSelect;
        this.insertField = insertField;
        this.insertSubmit = insertSubmit;
        this.sortSubmit = sortSubmit;
        this.clearSubmit = clearSubmit;
        this.psuedoCode = psuedoCode;

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