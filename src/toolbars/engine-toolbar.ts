export class EngineToolbar {
    animationSpeed: HTMLSelectElement;
    objectSize: HTMLSelectElement;
    generalControls: HTMLFieldSetElement;
    algorithmControls: HTMLFieldSetElement;
    stepForward: HTMLButtonElement;
    stepBackward: HTMLButtonElement;
    toggleRunner: HTMLButtonElement;
    fastForward: HTMLButtonElement;
    fastBackward: HTMLButtonElement;

    constructor(container: HTMLElement) {
        const generalControls = container.querySelector<HTMLFieldSetElement>(
            "fieldset.generalControls"
        );
        const algorithmControls = container.querySelector<HTMLFieldSetElement>(
            "fieldset.algorithmControls"
        );

        const stepForward =
            container.querySelector<HTMLButtonElement>("button.stepForward");
        const stepBackward = container.querySelector<HTMLButtonElement>(
            "button.stepBackward"
        );
        const toggleRunner = container.querySelector<HTMLButtonElement>(
            "button.toggleRunner"
        );
        const fastForward =
            container.querySelector<HTMLButtonElement>("button.fastForward");
        const fastBackward = container.querySelector<HTMLButtonElement>(
            "button.fastBackward"
        );
        const objectSize =
            container.querySelector<HTMLSelectElement>("select.objectSize");
        const animationSpeed = container.querySelector<HTMLSelectElement>(
            "select.animationSpeed"
        );

        if (!generalControls) {
            throw new Error("Missing general controls fieldset");
        }
        if (!algorithmControls) {
            throw new Error("Missing algorithm controls fieldset");
        }

        if (!stepForward) {
            throw new Error("Missing step forward button");
        }
        if (!stepBackward) {
            throw new Error("Missing step backward button");
        }
        if (!toggleRunner) {
            throw new Error("Missing toggle runner button");
        }
        if (!fastForward) {
            throw new Error("Missing fast forward button");
        }
        if (!fastBackward) {
            throw new Error("Missing fast backward button");
        }
        if (!objectSize) {
            throw new Error("Missing object size select");
        }
        if (!animationSpeed) {
            throw new Error("Missing animation speed select");
        }

        this.generalControls = generalControls;
        this.algorithmControls = algorithmControls;
        this.stepForward = stepForward;
        this.stepBackward = stepBackward;
        this.toggleRunner = toggleRunner;
        this.fastForward = fastForward;
        this.fastBackward = fastBackward;
        this.objectSize = objectSize;
        this.animationSpeed = animationSpeed;
    }
}
