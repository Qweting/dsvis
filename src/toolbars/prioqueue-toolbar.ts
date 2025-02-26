export class PrioQueueToolbar {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    deleteSubmit: HTMLInputElement;
    clearSubmit: HTMLInputElement;
    constructor(container: HTMLElement) {
        const insertSelect = container.querySelector<HTMLSelectElement>(
            "select.insertSelect"
        );
        const insertField =
            container.querySelector<HTMLInputElement>("input.insertField");
        const insertSubmit =
            container.querySelector<HTMLInputElement>("input.insertSubmit");
        const deleteSubmit =
            container.querySelector<HTMLInputElement>("input.deleteSubmit");
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
    }
}
