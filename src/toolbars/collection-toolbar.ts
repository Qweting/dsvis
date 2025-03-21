export class CollectionToolbar {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    findField: HTMLInputElement;
    findSubmit: HTMLInputElement;
    deleteField: HTMLInputElement;
    deleteSubmit: HTMLInputElement;
    printSubmit: HTMLInputElement;
    clearSubmit: HTMLInputElement;
    
    constructor(container: HTMLElement) {
        const insertSelect = container.querySelector<HTMLSelectElement>(
            "select.insertSelect"
        );
        const insertField =
            container.querySelector<HTMLInputElement>("input.insertField");
        const insertSubmit =
            container.querySelector<HTMLInputElement>("input.insertSubmit");
        const findField =
            container.querySelector<HTMLInputElement>("input.findField");
        const findSubmit =
            container.querySelector<HTMLInputElement>("input.findSubmit");
        const deleteField =
            container.querySelector<HTMLInputElement>("input.deleteField");
        const deleteSubmit =
            container.querySelector<HTMLInputElement>("input.deleteSubmit");
        const printSubmit =
            container.querySelector<HTMLInputElement>("input.printSubmit");
        const clearSubmit =
            container.querySelector<HTMLInputElement>("input.clearSubmit");
        

        if (!insertSelect) {
            throw new Error("Missing insert select");
        }
        if (!insertField) {
            throw new Error("Missing insert field");
        }
        if (!insertSubmit) {
            throw new Error("Missing insert submit");
        }
        if (!findField) {
            throw new Error("Missing find field");
        }
        if (!findSubmit) {
            throw new Error("Missing find submit");
        }
        if (!deleteField) {
            throw new Error("Missing delete field");
        }
        if (!deleteSubmit) {
            throw new Error("Missing delete submit");
        }
        if (!printSubmit) {
            throw new Error("Missing print submit");
        }
        if (!clearSubmit) {
            throw new Error("Missing clear submit");
        }

        this.insertSelect = insertSelect;
        this.insertField = insertField;
        this.insertSubmit = insertSubmit;
        this.findField = findField;
        this.findSubmit = findSubmit;
        this.deleteField = deleteField;
        this.deleteSubmit = deleteSubmit;
        this.printSubmit = printSubmit;
        this.clearSubmit = clearSubmit;
    }
}
