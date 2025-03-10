import { Element } from "@svgdotjs/svg.js";
import { Cookies } from "./cookies";
import { Debug } from "./debug";
import { EventListeners } from "./event-listeners";
import { parseValues } from "./helpers";
import { Info } from "./info";
import { Svg } from "./objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!
import { State } from "./state";
import { EngineToolbar } from "./toolbars/engine-toolbar";
import { Canvas } from "./canvas";

type Resolve = (value: unknown) => void;
type Reject = (props: { until?: number; running?: boolean }) => void;

export interface MessagesObject {
    [key: string]:
        | string // handled like () => string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        | ((...args: any[]) => string)
        | MessagesObject;
}

///////////////////////////////////////////////////////////////////////////////
// Constants and global variables

// Non-breaking space:
export const NBSP = "\u00A0";

export class Engine {
    container: HTMLElement;
    canvas: Canvas;

    messages: MessagesObject = {};

    cookies: Cookies;
    toolbar: EngineToolbar;
    actions: { oper: string; args: unknown[]; nsteps: number }[] = [];
    currentAction: number = 0; // was = null before, this should work better
    currentStep: number = 0; // was = null before, this should work better
    debug: Debug;

    state: State;

    info: Info;

    eventListeners: EventListeners;

    ///////////////////////////////////////////////////////////////////////////////
    // Inititalisation

    constructor(containerSelector: string) {
        this.debug = new Debug();

        const container =
            document.querySelector<HTMLElement>(containerSelector);
        if (!container) {
            throw new Error("No container found");
        }

        this.container = container;
        this.toolbar = new EngineToolbar(container);

        this.state = new State(this.toolbar.toggleRunner);

        this.cookies = new Cookies(
            {
                objectSize: this.toolbar.objectSize,
                animationSpeed: this.toolbar.animationSpeed,
            },
            this.debug
        );

        const svgContainer = this.container.querySelector("svg");
        if (!svgContainer) {
            throw new Error("No svg element found");
        }

        this.canvas = new Canvas(svgContainer, this);

        this.info = new Info(this.canvas);
        this.eventListeners = new EventListeners(this);
    }

    initialise(): void {
        this.initToolbar();
        this.resetAll();
        this.state.setRunning(true);
    }

    initToolbar(): void {
        this.toolbar.animationSpeed.addEventListener("change", () =>
            this.cookies.save()
        );
    }

    async resetAll(): Promise<void> {
        this.actions = [];
        this.cookies.load();
        await this.reset();
    }

    confirmResetAll(): boolean {
        if (confirm("This clears the canvas and your history!")) {
            this.resetAll();
            return true;
        }
        return false;
    }

    async reset(): Promise<void> {
        this.canvas.clear();
        this.info.reset();
        await this.resetAlgorithm();
        this.resetListeners(false);
    }

    async resetAlgorithm(): Promise<void> {}

    setIdleTitle(): void {
        this.info.setTitle("Select an action from the menu above");
        this.info.setBody(NBSP);
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Updating listeners

    disableWhenRunning(disabled: boolean): void {
        for (const elem of this.container.querySelectorAll<
            HTMLInputElement | HTMLSelectElement
        >(".disableWhenRunning")) {
            elem.disabled = disabled;
        }
    }

    resetListeners(isRunning: boolean): void {
        this.cookies.save();
        this.eventListeners.removeAllListeners();
        if (this.constructor === Engine) {
            this.disableWhenRunning(true);
            return;
        }
        this.eventListeners.addListener(
            this.toolbar.toggleRunner,
            "click",
            () => this.state.toggleRunner()
        );
        if (isRunning) {
            this.disableWhenRunning(true);
            this.info.setStatus("paused");
            return;
        }

        this.disableWhenRunning(false);
        this.setIdleTitle();
        this.info.setStatus("inactive");
        this.eventListeners.addIdleListeners();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Executing the actions

    async submit(
        method: string,
        field: HTMLInputElement | null
    ): Promise<boolean> {
        try {
            let rawValue: string = "";
            if (field) {
                rawValue = field.value;
                field.value = "";
            }
            const values = parseValues(rawValue);
            if (values) {
                await this.execute(method, values);
            }
            return true;
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    async execute(
        operation: string,
        args: unknown[] = [],
        until = 0
    ): Promise<void> {
        await this.reset();
        this.actions.push({ oper: operation, args: args, nsteps: until });
        this.debug.log(
            `EXEC ${until}: ${operation} ${args.join(", ")}, ${JSON.stringify(
                this.actions
            )}`
        );

        try {
            await this.runActionsLoop();
            this.actions[this.actions.length - 1].nsteps =
                this.currentStep || 0; // TODO: Not sure if this is correct
            this.debug.log(
                `DONE / ${this.currentStep}: ${JSON.stringify(this.actions)}`
            );

            this.resetListeners(false);
        } catch (reason) {
            if (
                typeof reason !== "object" ||
                reason === null || // Added line to help checks below
                "until" in reason === false || // Added line to help checks below
                typeof reason.until !== "number" // Changed to be able to assign to until which is a number
            ) {
                console.error(reason);
                this.resetListeners(false);
                return;
            }
            this.actions.pop();
            if ("running" in reason && typeof reason.running === "boolean") {
                this.state.setRunning(reason.running);
            }
            until = reason.until;
            this.debug.log(
                `RERUN ${until} / ${this.currentStep}: ${JSON.stringify(
                    this.actions
                )}`
            );

            if (until <= 0 && this.actions.length > 0) {
                const action = this.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                operation = action.oper;
                args = action.args;
                until = action.nsteps;
            }
            if (until > 0) {
                this.execute(operation, args, until);
            } else {
                this.reset();
            }
        }
    }

    async runActionsLoop(): Promise<void> {
        for (let nAction = 0; nAction < this.actions.length; nAction++) {
            this.resetListeners(true);
            const action = this.actions[nAction];
            this.currentAction = nAction;
            this.currentStep = 0;
            // Make camelCase separate words: https://stackoverflow.com/a/21148630
            const messageArr = action.oper.match(/[A-Za-z][a-z]*/g) || [];
            let message = messageArr.join(" ");
            message = `${
                message.charAt(0).toUpperCase() + message.substring(1)
            } ${action.args.join(", ")}`;
            this.debug.log(
                `CALL ${nAction}: ${message}, ${JSON.stringify(this.actions)}`
            );

            this.info.setTitle(message);
            await this.pause("");
            if (
                !(
                    action.oper in this &&
                    typeof this[action.oper as keyof Engine] === "function"
                )
            ) {
                throw new Error("Cannot call action that does not exist");
            }
            // @ts-expect-error Have checked that it exists and that is a function. Only thing would be to validate input. Better to do in each function in any case
            await this[action.oper](...action.args); // Kommer bli knölig att lösa
        }
    }

    pause(
        message: string | undefined,
        ...args: unknown[]
    ): Promise<unknown> | null {
        const title = this.getMessage(message, ...args);
        this.debug.log(
            `${
                this.currentStep
            }. Doing: ${title} (running: ${this.state.isRunning()}), ${JSON.stringify(
                this.actions
            )}`
        );

        if (this.state.isResetting()) {
            return null;
        }
        if (title !== undefined) {
            this.info.setBody(title);
        }
        return new Promise((resolve, reject) => {
            const action = this.actions[this.currentAction];
            if (action.nsteps != null && this.currentStep < action.nsteps) {
                this.fastForward(resolve, reject);
            } else {
                let runnerTimer: NodeJS.Timeout | undefined = undefined;
                this.eventListeners.addAsyncListeners(
                    resolve,
                    reject,
                    runnerTimer
                );
                if (this.state.isRunning()) {
                    this.info.setStatus("running");
                    runnerTimer = setTimeout(
                        () => this.stepForward(resolve, reject),
                        this.canvas.getAnimationSpeed() * 1.1
                    );
                }
            }
        });
    }

    getMessage(
        message: string | undefined,
        ...args: unknown[]
    ): string | undefined {
        if (typeof message !== "string") {
            if (args.length > 0) {
                console.error("Unknown message:", message, ...args);
            }
            return undefined;
        }

        let title: MessagesObject[string] = this.messages;

        const keys = message.split(".");
        if (!(keys[0] in title)) {
            return [message, ...args].join("\n");
        }
        for (const key of keys) {
            if (!(typeof title === "object" && key in title)) {
                console.error("Unknown message:", message, ...args);
                return [message, ...args].join("\n");
            }
            title = title[key];
        }
        if (typeof title === "function") {
            title = title(...args);
        }
        if (typeof title !== "string") {
            console.error("Unknown message:", message, ...args);
            return [message, ...args].join("\n");
        }
        if (title === "") {
            title = NBSP;
        }
        return title;
    }

    stepForward(resolve: Resolve, reject: Reject): void {
        this.currentStep++;
        this.state.setAnimating(true);
        resolve(undefined);
    }

    fastForward(resolve: Resolve, reject: Reject): void {
        const action = this.actions[this.currentAction];
        if (this.currentStep >= action.nsteps) {
            action.nsteps = this.currentStep;
        }
        this.currentStep++;
        this.state.setAnimating(false);
        if (this.debug.isEnabled()) {
            setTimeout(resolve, 10);
        } else {
            resolve(undefined);
        }
    }

    animate(elem: Element, animate = true) {
        if (this.state.isAnimating() && animate) {
            this.info.setStatus("running");
            this.info.setStatus("paused", this.canvas.getAnimationSpeed());
            return elem.animate(this.canvas.getAnimationSpeed(), 0, "now");
        } else {
            return elem;
        }
    }
}
