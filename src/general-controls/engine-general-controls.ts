import { Debugger } from "~/debugger";
import { Engine } from "~/engine";
import { querySelector } from "~/helpers";

export type Resolve = (value: unknown) => void;
export type Reject = (props: RejectReason) => void;
export type RejectReason = { until: number; running?: boolean };

type ListenerType = "click" | "change";
type AllowedElements =
    | HTMLSelectElement
    | HTMLButtonElement
    | HTMLFieldSetElement;
type IdleListener = {
    element: AllowedElements;
    type: ListenerType;
    condition: () => boolean;
    handler: () => void;
};

type AsyncListener = {
    element: AllowedElements;
    type: ListenerType;
    handler: (resolve: Resolve, reject: Reject) => void;
};

type EventListenersMap = Map<
    AllowedElements,
    Partial<Record<ListenerType, () => void>>
>;

export class EngineGeneralControls {
    generalControls: HTMLFieldSetElement;
    fastBackwardButton: HTMLButtonElement;
    stepBackwardButton: HTMLButtonElement;
    toggleRunnerButton: HTMLButtonElement;
    stepForwardButton: HTMLButtonElement;
    fastForwardButton: HTMLButtonElement;
    animationSpeedSelect: HTMLSelectElement;
    objectSizeSelect: HTMLSelectElement;

    engine: Engine;
    debugger: Debugger;

    activeListeners: EventListenersMap = new Map();
    idleListeners: IdleListener[] = [];
    asyncListeners: AsyncListener[] = [];

    constructor(container: HTMLElement, engine: Engine) {
        this.engine = engine;
        this.debugger = engine.debugger;

        this.generalControls = querySelector<HTMLFieldSetElement>(
            "fieldset.generalControls",
            container
        );

        this.fastBackwardButton = querySelector<HTMLButtonElement>(
            "button.fastBackward",
            container
        );
        this.stepBackwardButton = querySelector<HTMLButtonElement>(
            "button.stepBackward",
            container
        );
        this.toggleRunnerButton = querySelector<HTMLButtonElement>(
            "button.toggleRunner",
            container
        );
        this.stepForwardButton = querySelector<HTMLButtonElement>(
            "button.stepForward",
            container
        );
        this.fastForwardButton = querySelector<HTMLButtonElement>(
            "button.fastForward",
            container
        );
        this.objectSizeSelect = querySelector<HTMLSelectElement>(
            "select.objectSize",
            container
        );
        this.animationSpeedSelect = querySelector<HTMLSelectElement>(
            "select.animationSpeed",
            container
        );

        this.idleListeners.push(
            {
                element: this.stepBackwardButton,
                type: "click",
                condition: () => this.engine.actions.length > 0,
                handler: () => {
                    this.setRunning(false);
                    const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0);
                    this.engine.execute(
                        action.method,
                        action.args,
                        action.stepCount - 1
                    );
                },
            },
            {
                element: this.fastBackwardButton,
                type: "click",
                condition: () => this.engine.actions.length > 0,
                handler: () => {
                    this.engine.actions.pop();
                    if (this.engine.actions.length > 0) {
                        const action = this.engine.actions.pop()!;
                        this.engine.execute(
                            action.method,
                            action.args,
                            action.stepCount
                        );
                    } else {
                        this.engine.reset();
                    }
                },
            },
            {
                element: this.objectSizeSelect,
                type: "change",
                condition: () => true,
                handler: () => {
                    if (this.engine.actions.length > 0) {
                        const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                        this.engine.execute(
                            action.method,
                            action.args,
                            action.stepCount
                        );
                    } else {
                        this.engine.reset();
                    }
                },
            }
        );

        this.asyncListeners.push(
            {
                element: this.stepForwardButton,
                type: "click",
                handler: (resolve, reject) => {
                    this.setRunning(false);
                    this.stepForward(resolve, reject);
                },
            },
            {
                element: this.fastForwardButton,
                type: "click",
                handler: (resolve, reject) => {
                    this.engine.actions[this.engine.currentAction].stepCount =
                        Number.MAX_SAFE_INTEGER;
                    this.fastForward(resolve, reject);
                },
            },
            {
                element: this.toggleRunnerButton,
                type: "click",
                handler: (resolve, reject) => {
                    this.toggleRunner();
                    if (this.isRunning()) {
                        this.stepForward(resolve, reject);
                    } else {
                        this.engine.currentStep++;
                        resolve(undefined);
                    }
                },
            },
            {
                element: this.stepBackwardButton,
                type: "click",
                handler: (resolve, reject) =>
                    reject({
                        until: this.engine.currentStep - 1,
                        running: false,
                    }),
            },
            {
                element: this.fastBackwardButton,
                type: "click",
                handler: (resolve, reject) => reject({ until: 0 }),
            },
            {
                element: this.objectSizeSelect,
                type: "change",
                handler: (resolve, reject) =>
                    reject({ until: this.engine.currentStep }),
            }
        );
    }

    addAsyncListeners(
        resolve: Resolve,
        reject: Reject,
        runnerTimer: NodeJS.Timeout | undefined
    ): void {
        this.asyncListeners.forEach((listener) => {
            this.addListener(listener.element, listener.type, () => {
                clearTimeout(runnerTimer);
                listener.handler(resolve, reject);
            });
        });
    }

    addIdleListeners(): void {
        this.idleListeners.forEach((listener) => {
            this.addListener(listener.element, listener.type, () => {
                this.debugger.log(
                    listener.element,
                    `${listener.type}: ${JSON.stringify(this.engine.actions)}`
                );
                listener.handler();
            });
        });
    }

    addListener(
        element: AllowedElements,
        type: ListenerType,
        handler: () => void
    ): void {
        const listeners = this.activeListeners;
        if (!listeners.has(element)) {
            listeners.set(element, {});
        }
        const listener = listeners.get(element)!;
        const oldHandler = listener[type];
        if (oldHandler) {
            element.removeEventListener(type, oldHandler);
        }
        listener[type] = handler;
        element.addEventListener(type, handler);
        element.disabled = false;
    }

    removeAllListeners(): void {
        this.activeListeners.forEach((listener, element) => {
            element.disabled = true;
            for (const type in listener) {
                element.removeEventListener(
                    type,
                    listener[type as ListenerType]! // ! because we know that the type exists
                );
            }
        });
        this.activeListeners.clear();
    }

    isRunning(): boolean {
        return this.toggleRunnerButton.classList.contains("selected");
    }

    setRunning(running: boolean): this {
        const classes = this.toggleRunnerButton.classList;
        if (running) {
            classes.add("selected");
        } else {
            classes.remove("selected");
        }
        return this;
    }

    toggleRunner(): this {
        return this.setRunning(!this.isRunning());
    }

    addRunnerListener() {
        this.addListener(this.toggleRunnerButton, "click", () =>
            this.toggleRunner()
        );
    }

    stepForward(resolve: Resolve, reject: Reject): void {
        this.engine.currentStep++;
        this.engine.state.setAnimating(true);
        resolve(undefined);
    }

    fastForward(resolve: Resolve, reject: Reject): void {
        const action = this.engine.actions[this.engine.currentAction];
        if (this.engine.currentStep >= action.stepCount) {
            action.stepCount = this.engine.currentStep;
        }
        this.engine.currentStep++;
        this.engine.state.setAnimating(false);
        // If debugging is enabled then add a small delay
        if (this.debugger.isEnabled()) {
            setTimeout(resolve, 10);
        } else {
            resolve(undefined);
        }
    }
}
