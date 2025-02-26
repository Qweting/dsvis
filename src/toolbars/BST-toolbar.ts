import { EngineToolbar } from "./engine-toolbar";

export class BSTToolbar extends EngineToolbar {
    showNullNodes: HTMLInputElement;

    constructor(container: HTMLElement) {
        super(container);

        this.generalControls.insertAdjacentHTML(
            "beforeend",
            `<span class="formgroup"><label>
                <input class="showNullNodes" type="checkbox"/> Show null nodes
            </label></span>`
        );

        const showNullNodes = container.querySelector<HTMLInputElement>(
            "input.showNullNodes"
        );

        if (!showNullNodes) {
            throw new Error("Could not find show null nodes input");
        }

        this.showNullNodes = showNullNodes;
    }
}
