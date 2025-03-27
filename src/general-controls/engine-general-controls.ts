import { Debugger } from "~/debugger";
import { Engine, Reject, Resolve } from "~/engine";
import { querySelector } from "~/helpers";
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

        this.generalControls = querySelector<HTMLFieldSetElement>(
            "fieldset.generalControls",
            container
        );

        this.fastBackward = querySelector<HTMLButtonElement>(
            "button.fastBackward",
            container
        );
        this.stepBackward = querySelector<HTMLButtonElement>(
            "button.stepBackward",
            container
        );
        this.toggleRunner = querySelector<HTMLButtonElement>(
            "button.toggleRunner",
            container
        );
        this.stepForward = querySelector<HTMLButtonElement>(
            "button.stepForward",
            container
        );
        this.fastForward = querySelector<HTMLButtonElement>(
            "button.fastForward",
            container
        );
        this.objectSize = querySelector<HTMLSelectElement>(
            "select.objectSize",
            container
        );
        this.animationSpeed = querySelector<HTMLSelectElement>(
            "select.animationSpeed",
            container
        );

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
