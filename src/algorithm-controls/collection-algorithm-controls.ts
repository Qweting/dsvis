import { Collection } from "~/collections";
import { addReturnSubmit, querySelector } from "~/helpers";
import { EngineAlgorithmControl } from "./engine-algorithm-controls";

export class CollectionAlgorithmControl extends EngineAlgorithmControl {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    findField: HTMLInputElement;
    findSubmit: HTMLInputElement;
    deleteField: HTMLInputElement;
    deleteSubmit: HTMLInputElement;
    printSubmit: HTMLInputElement;
    clearSubmit: HTMLInputElement;
    engine: Collection;

    constructor(container: HTMLElement, engine: Collection) {
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
        this.findField = querySelector<HTMLInputElement>(
            "input.findField",
            container
        );
        this.findSubmit = querySelector<HTMLInputElement>(
            "input.findSubmit",
            container
        );
        this.deleteField = querySelector<HTMLInputElement>(
            "input.deleteField",
            container
        );
        this.deleteSubmit = querySelector<HTMLInputElement>(
            "input.deleteSubmit",
            container
        );
        this.printSubmit = querySelector<HTMLInputElement>(
            "input.printSubmit",
            container
        );
        this.clearSubmit = querySelector<HTMLInputElement>(
            "input.clearSubmit",
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

        this.insertSubmit.addEventListener("click", () => {
            this.engine.submit(this.engine.insert, this.insertField);
        });

        addReturnSubmit(this.findField, "ALPHANUM", () =>
            this.engine.submit(this.engine.find, this.findField)
        );

        this.findSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.find, this.findField)
        );

        addReturnSubmit(this.deleteField, "ALPHANUM", () =>
            this.engine.submit(this.engine.delete, this.deleteField)
        );

        this.deleteSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.delete, this.deleteField)
        );

        this.printSubmit.addEventListener("click", () =>
            this.engine.submit(this.engine.print, null)
        );

        this.clearSubmit.addEventListener("click", () =>
            this.engine.confirmResetAll()
        );
    }
}
