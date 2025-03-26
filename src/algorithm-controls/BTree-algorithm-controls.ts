import { BTree } from "~/trees/BTree";
import { CollectionAlgorithmControl } from "./collection-algorithm-controls";

export class BTreeAlgorithmControl extends CollectionAlgorithmControl {
    maxDegree: HTMLSelectElement;
    engine: BTree;

    constructor(container: HTMLElement, engine: BTree) {
        super(container, engine);

        this.engine = engine;

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

        this.maxDegree.addEventListener("change", () =>
            this.engine.confirmResetAll()
        );
    }
}
