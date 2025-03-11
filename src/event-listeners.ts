import { Debug } from "@/debug";
import { Engine, Reject, Resolve } from "@/engine";
import { State } from "@/state";
import { EngineToolbar } from "@/toolbars/engine-toolbar";

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

export class EventListeners {
    engine: Engine;
    toolbar: EngineToolbar;
    debug: Debug;
    state: State;
    activeListeners: EventListenersMap = new Map();
    idleListeners: IdleListener[] = [];
    asyncListeners: AsyncListener[] = [];

    constructor(engine: Engine) {
        this.engine = engine;
        this.toolbar = engine.toolbar;
        this.debug = engine.debug;
        this.state = engine.state;

        this.idleListeners.push(
            {
                element: this.toolbar.stepBackward,
                type: "click",
                condition: () => this.engine.actions.length > 0,
                handler: () => {
                    this.state.setRunning(false);
                    const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0);
                    this.engine.execute(
                        action.method,
                        action.args,
                        action.nsteps - 1
                    );
                },
            },
            {
                element: this.toolbar.fastBackward,
                type: "click",
                condition: () => this.engine.actions.length > 0,
                handler: () => {
                    this.engine.actions.pop();
                    if (this.engine.actions.length > 0) {
                        const action = this.engine.actions.pop()!;
                        this.engine.execute(
                            action.method,
                            action.args,
                            action.nsteps
                        );
                    } else {
                        this.engine.reset();
                    }
                },
            },
            {
                element: this.toolbar.objectSize,
                type: "change",
                condition: () => true,
                handler: () => {
                    if (this.engine.actions.length > 0) {
                        const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                        this.engine.execute(
                            action.method,
                            action.args,
                            action.nsteps
                        );
                    } else {
                        this.engine.reset();
                    }
                },
            }
        );

        this.asyncListeners.push(
            {
                element: this.toolbar.stepForward,
                type: "click",
                handler: (resolve, reject) => {
                    this.state.setRunning(false);
                    this.engine.stepForward(resolve, reject);
                },
            },
            {
                element: this.toolbar.fastForward,
                type: "click",
                handler: (resolve, reject) => {
                    this.engine.actions[this.engine.currentAction].nsteps =
                        Number.MAX_SAFE_INTEGER;
                    this.engine.fastForward(resolve, reject);
                },
            },
            {
                element: this.toolbar.toggleRunner,
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
                element: this.toolbar.stepBackward,
                type: "click",
                handler: (resolve, reject) =>
                    reject({
                        until: this.engine.currentStep - 1,
                        running: false,
                    }),
            },
            {
                element: this.toolbar.fastBackward,
                type: "click",
                handler: (resolve, reject) => reject({ until: 0 }),
            },
            {
                element: this.toolbar.objectSize,
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
                this.debug.log(
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
