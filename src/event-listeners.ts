import { Engine } from "./engine";

type ListenerType = "click" | "change";
type IdleListeners = Record<
    string,
    { type: ListenerType; condition: () => boolean; handler: () => void }
>;
type AsyncListeners = Record<
    string,
    {
        type: ListenerType;
        handler: (resolve: Resolve, reject: Reject) => void;
    }
>;

type EventListenersObj = Record<
    string,
    Partial<Record<ListenerType, () => void>>
>;

type Resolve = (value: unknown) => void;
type Reject = (props: { until?: number; running?: boolean }) => void;

export class EventListeners {
    engine: Engine;

    eventListeners: EventListenersObj = {
        stepForward: {},
        stepBackward: {},
        fastForward: {},
        fastBackward: {},
        toggleRunner: {},
    };

    $IdleListeners: IdleListeners = {
        stepBackward: {
            type: "click",
            condition: () => this.engine.actions.length > 0,
            handler: () => {
                this.engine.setRunning(false);
                const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0);
                this.engine.execute(
                    action.oper,
                    action.args,
                    action.nsteps - 1
                );
            },
        },
        fastBackward: {
            type: "click",
            condition: () => this.engine.actions.length > 0,
            handler: () => {
                this.engine.actions.pop();
                if (this.engine.actions.length > 0) {
                    const action = this.engine.actions.pop()!;
                    this.engine.execute(
                        action.oper,
                        action.args,
                        action.nsteps
                    );
                } else {
                    this.engine.reset();
                }
            },
        },
        objectSize: {
            type: "change",
            condition: () => true,
            handler: () => {
                if (this.engine.actions.length > 0) {
                    const action = this.engine.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                    this.engine.execute(
                        action.oper,
                        action.args,
                        action.nsteps
                    );
                } else {
                    this.engine.reset();
                }
            },
        },
    };

    $AsyncListeners: AsyncListeners = {
        stepForward: {
            type: "click",
            handler: (resolve, reject) => {
                this.engine.setRunning(false);
                this.engine.stepForward(resolve, reject);
            },
        },
        fastForward: {
            type: "click",
            handler: (resolve, reject) => {
                this.engine.actions[this.engine.currentAction].nsteps =
                    Number.MAX_SAFE_INTEGER;
                this.engine.fastForward(resolve, reject);
            },
        },
        toggleRunner: {
            type: "click",
            handler: (resolve, reject) => {
                this.engine.toggleRunner();
                if (this.engine.isRunning()) {
                    this.engine.stepForward(resolve, reject);
                } else {
                    this.engine.currentStep++;
                    resolve(undefined);
                }
            },
        },
        stepBackward: {
            type: "click",
            handler: (resolve, reject) =>
                reject({ until: this.engine.currentStep - 1, running: false }),
        },
        fastBackward: {
            type: "click",
            handler: (resolve, reject) => reject({ until: 0 }),
        },
        objectSize: {
            type: "change",
            handler: (resolve, reject) =>
                reject({ until: this.engine.currentStep }),
        },
    };

    constructor(engine: Engine) {
        this.engine = engine;
    }

    addAsyncListeners(
        resolve: Resolve,
        reject: Reject,
        runnerTimer: NodeJS.Timeout | undefined
    ): void {
        for (const id in this.$AsyncListeners) {
            const listener = this.$AsyncListeners[id];
            this.addListener(id, listener.type, () => {
                clearTimeout(runnerTimer);
                listener.handler(resolve, reject);
            });
        }
    }

    addIdleListeners(): void {
        for (const id in this.$IdleListeners) {
            const listener = this.$IdleListeners[id];
            if (listener.condition()) {
                if (this.engine.DEBUG) {
                    this.addListener(id, listener.type, () => {
                        console.log(
                            `${id} ${listener.type}: ${JSON.stringify(
                                this.engine.actions
                            )}`
                        );
                        listener.handler();
                    });
                } else {
                    this.addListener(id, listener.type, listener.handler);
                }
            }
        }
    }

    addListener(id: string, type: ListenerType, handler: () => void): void {
        const listeners = this.eventListeners;
        if (!listeners[id]) {
            listeners[id] = {};
        }
        const elem =
            this.engine.toolbar[id as keyof typeof this.engine.toolbar];

        if (!elem) {
            throw new Error("Could not find element to add listener to");
        }

        const oldHandler = listeners[id][type];
        if (oldHandler) {
            elem.removeEventListener(type, oldHandler);
        }
        listeners[id][type] = handler;
        elem.addEventListener(type, handler);
        elem.disabled = false;
    }

    removeAllListeners(): void {
        const listeners = this.eventListeners;

        for (const id in listeners) {
            const elem =
                this.engine.toolbar[id as keyof typeof this.engine.toolbar];

            if (!elem) {
                throw new Error(
                    "Could not find element to remove listener from"
                );
            }

            elem.disabled = true;
            for (const type in listeners[id]) {
                elem.removeEventListener(
                    type,
                    listeners[id][type as ListenerType]! // ! because we know that the type exists
                );
            }
            listeners[id] = {};
        }
    }
}
