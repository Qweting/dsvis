export class EngineAlgorithmControl {
    algorithmControls: HTMLFieldSetElement;

    constructor(container: HTMLElement) {
        const algorithmControls = container.querySelector<HTMLFieldSetElement>(
            "fieldset.algorithmControls"
        );

        if (!algorithmControls) {
            throw new Error("Missing algorithm controls fieldset");
        }

        this.algorithmControls = algorithmControls;
    }
}
