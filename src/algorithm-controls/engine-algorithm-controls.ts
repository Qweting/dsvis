import { querySelector } from "~/helpers";

export class EngineAlgorithmControl {
    algorithmControls: HTMLFieldSetElement;

    constructor(container: HTMLElement) {
        this.algorithmControls = querySelector<HTMLFieldSetElement>(
            "fieldset.algorithmControls",
            container
        );
    }
}
