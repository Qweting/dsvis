import { querySelector } from "~/helpers";
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

        this.showNullNodes = querySelector<HTMLInputElement>(
            "input.showNullNodes",
            container
        );

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
