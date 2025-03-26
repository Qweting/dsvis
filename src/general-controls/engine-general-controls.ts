import { Debugger } from "~/debugger";
import { Engine, Reject, Resolve } from "~/engine";
import { State } from "~/state";

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
    fastBackward: HTMLButtonElement;
    stepBackward: HTMLButtonElement;
    toggleRunner: HTMLButtonElement;
    stepForward: HTMLButtonElement;
    fastForward: HTMLButtonElement;
    animationSpeed: HTMLSelectElement;
    objectSize: HTMLSelectElement;
    engine: Engine;
    debugger: Debugger;
    state: State;
    activeListeners: EventListenersMap = new Map();
    idleListeners: IdleListener[] = [];
    asyncListeners: AsyncListener[] = [];

    constructor(container: HTMLElement, engine: Engine) {
        this.engine = engine;
        this.debugger = engine.debugger;
        this.state = engine.state;

        const generalControls = container.querySelector<HTMLFieldSetElement>(
            "fieldset.generalControls"
        );

        const fastBackward = container.querySelector<HTMLButtonElement>(
            "button.fastBackward"
        );
        const stepBackward = container.querySelector<HTMLButtonElement>(
            "button.stepBackward"
        );
        const toggleRunner = container.querySelector<HTMLButtonElement>(
            "button.toggleRunner"
        );
        const stepForward =
            container.querySelector<HTMLButtonElement>("button.stepForward");

        const fastForward =
            container.querySelector<HTMLButtonElement>("button.fastForward");

        const objectSize =
            container.querySelector<HTMLSelectElement>("select.objectSize");
        const animationSpeed = container.querySelector<HTMLSelectElement>(
            "select.animationSpeed"
        );

        if (!generalControls) {
            throw new Error("Missing general controls fieldset");
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
        this.stepForward = stepForward;
        this.stepBackward = stepBackward;
        this.toggleRunner = toggleRunner;
        this.fastForward = fastForward;
        this.fastBackward = fastBackward;
        this.objectSize = objectSize;
        this.animationSpeed = animationSpeed;

        this.idleListeners.push(
            {
                element: this.stepBackward,
                type: "click",
                condition: () => this.engine.actions.length > 0,
                handler: () => {
                    this.state.setRunning(false);
                    const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0);
                    this.engine.execute(
                        action.method,
                        action.args,
                        action.stepCount - 1
                    );
                },
            },
            {
                element: this.fastBackward,
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
                element: this.objectSize,
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
                element: this.stepForward,
                type: "click",
                handler: (resolve, reject) => {
                    this.state.setRunning(false);
                    this.engine.stepForward(resolve, reject);
                },
            },
            {
                element: this.fastForward,
                type: "click",
                handler: (resolve, reject) => {
                    this.engine.actions[this.engine.currentAction].stepCount =
                        Number.MAX_SAFE_INTEGER;
                    this.engine.fastForward(resolve, reject);
                },
            },
            {
                element: this.toggleRunner,
                type: "click",
                handler: (resolve, reject) => {
                    this.state.toggleRunner();
                    if (this.state.isRunning()) {
                        this.engine.stepForward(resolve, reject);
                    } else {
                        this.engine.currentStep++;
                        resolve(undefined);
                    }
                },
            },
            {
                element: this.stepBackward,
                type: "click",
                handler: (resolve, reject) =>
                    reject({
                        until: this.engine.currentStep - 1,
                        running: false,
                    }),
            },
            {
                element: this.fastBackward,
                type: "click",
                handler: (resolve, reject) => reject({ until: 0 }),
            },
            {
                element: this.objectSize,
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
}
