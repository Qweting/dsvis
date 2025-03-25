import { EngineToolbar } from "./engine-toolbar";

export class BTreeToolbar extends EngineToolbar {
    maxDegree: HTMLSelectElement;

    constructor(container: HTMLElement) {
        super(container);

        this.algorithmControls.insertAdjacentHTML(
            "beforeend",
            `<span class="formgroup"><label>
                Max degree:
                <select class="maxDegree disableWhenRunning">
                <option value="3">2/3-tree</option>
                <option value="4">2/3/4-tree</option>
                <option value="5">Max degree 5</option>
                <option value="6">Max degree 6</option>
                </select>
            </label></span>`
        );

        const maxDegree =
            container.querySelector<HTMLSelectElement>("select.maxDegree");

        if (!maxDegree) {
            throw new Error("Could not find max degree select element");
        }

        this.maxDegree = maxDegree;
    }
}
