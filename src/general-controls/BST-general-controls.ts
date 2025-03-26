import { BST } from "~/trees/BST";
import { EngineGeneralControls } from "./engine-general-controls";

export class BSTGeneralControls extends EngineGeneralControls {
    showNullNodes: HTMLInputElement;
    engine: BST;

    constructor(container: HTMLElement, engine: BST) {
        super(container, engine);

        this.engine = engine;

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

        this.showNullNodes.addEventListener("change", () =>
            this.toggleNullNodes(null)
        );

        this.toggleNullNodes(true);
    }

    toggleNullNodes(show: boolean | null): void {
        if (show === null) {
            show = this.showNullNodes.checked;
        }

        this.showNullNodes.checked = show;

        if (show) {
            this.engine.Svg.addClass("shownullnodes");
        } else {
            this.engine.Svg.removeClass("shownullnodes");
        }
    }
}
