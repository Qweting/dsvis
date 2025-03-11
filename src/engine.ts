import { Element } from "@svgdotjs/svg.js";
import { Cookies } from "./cookies";
import { Debug } from "./debug";
import { EventListeners } from "./event-listeners";
import { isValidReason, parseValues } from "./helpers";
import { Info } from "./info";
import { Svg } from "./objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!
import { State } from "./state";
import { EngineToolbar } from "./toolbars/engine-toolbar";

export type Resolve = (value: unknown) => void;
export type Reject = (props: { until: number; running?: boolean }) => void;

export type SubmitFunction = (...args: (string | number)[]) => Promise<void>;

export interface MessagesObject {
    [key: string]:
        | string // handled like () => string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        | ((...args: any[]) => string)
        | MessagesObject;
}

type Action = {
    method: (...args: unknown[]) => Promise<void>;
    args: unknown[];
    nsteps: number;
};

///////////////////////////////////////////////////////////////////////////////
// Constants and global variables

// Non-breaking space:
export const NBSP = "\u00A0";

export class Engine {
    // Default variable names start with $

    Svg: Svg;
    messages: MessagesObject = {};

    $Svg = {
        width: 1000,
        height: 600,
        margin: 30,
        objectSize: 40,
        animationSpeed: 1000, // milliseconds per step
    };
    cookies: Cookies;
    container: HTMLElement;
    toolbar: EngineToolbar;
    actions: Action[] = [];
    currentAction: number = 0;
    currentStep: number = 0;
    debug: Debug;
    state: State;
    info: Info;
    eventListeners: EventListeners;

    getAnimationSpeed(): number {
        return parseInt(this.toolbar.animationSpeed.value);
    }

    getObjectSize(): number {
        return parseInt(this.toolbar.objectSize.value);
    }

    getNodeSpacing(): number {
        return this.getObjectSize();
    }

    getStrokeWidth(): number {
        return this.getObjectSize() / 12;
    }

    getNodeStart(): [number, number] {
        return [
            this.$Svg.margin + this.getObjectSize() / 2,
            this.$Svg.margin * 4,
        ];
    }

    getTreeRoot(): [number, number] {
        return [
            this.Svg.viewbox().width / 2,
            2 * this.$Svg.margin + this.getObjectSize() / 2,
        ];
    }

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

        this.Svg = new Svg(svgContainer);
        this.Svg.viewbox(0, 0, this.$Svg.width, this.$Svg.height);
        this.Svg.$engine = this;
        if (this.debug.isEnabled()) {
            this.Svg.addClass("debug");
        }

        this.info = new Info(this.Svg, this.$Svg.margin);
        this.eventListeners = new EventListeners(this);
    }

    initialise(): void {
        this.initToolbar();
        this.resetAll();
        this.state.setRunning(true);
    }

    initToolbar(): void {}

    async resetAll(): Promise<void> {
        this.actions = [];
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
        this.clearCanvas();
        await this.resetAlgorithm();
        this.resetListeners(false);
    }

    async resetAlgorithm(): Promise<void> {}

    clearCanvas(): void {
        this.Svg.clear();

        const w = this.Svg.viewbox().width;
        const h = this.Svg.viewbox().height;
        if (this.debug.isEnabled()) {
            for (let x = 1; x < w / 100; x++) {
                this.Svg.line(x * 100, 0, x * 100, h).addClass("gridline");
            }
            for (let y = 1; y < h / 100; y++) {
                this.Svg.line(0, y * 100, w, y * 100).addClass("gridline");
            }
        }

        this.info.reset();
        this.updateCSSVariables();
    }

    updateCSSVariables(): void {
        const relativeSize = Math.round(
            (100 * this.getObjectSize()) / this.$Svg.objectSize
        );
        document.documentElement.style.setProperty(
            "--node-font-size",
            `${relativeSize}%`
        );
    }

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
        method: SubmitFunction,
        field: HTMLInputElement | null
    ): Promise<boolean> {
        let rawValue: string = "";
        try {
            if (field instanceof HTMLInputElement) {
                // Read value from input and reset to empty string
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute<T extends (...args: any[]) => Promise<void>>(
        method: T,
        args: Parameters<T>,
        until = 0
    ): Promise<void> {
        await this.reset();
        this.actions.push({ method, args, nsteps: until });
        this.debug.log(
            `EXEC ${until}: ${method.name} ${args.join(", ")}, ${JSON.stringify(
                this.actions
            )}`
        );

        try {
            await this.runActionsLoop();
            this.actions[this.actions.length - 1].nsteps = this.currentStep;
            this.debug.log(
                `DONE / ${this.currentStep}: ${JSON.stringify(this.actions)}`
            );

            this.resetListeners(false);
        } catch (reason) {
            // Check if reason is thrown from async listener
            if (!isValidReason(reason)) {
                // Error not thrown by async handlers. Log it and exit
                console.error(reason);
                this.resetListeners(false);
                return;
            }

            // If optional running argument is provided set running state
            if (reason.running !== undefined) {
                this.state.setRunning(reason.running);
            }
            this.actions.pop();
            until = reason.until;
            this.debug.log(
                `RERUN ${until} / ${this.currentStep}: ${JSON.stringify(
                    this.actions
                )}`
            );

            // until is smaller or equal to 0 the previus action should be run if it exists
            if (until <= 0 && this.actions.length > 0) {
                const action = this.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                method = action.method as T;
                args = action.args as Parameters<T>;
                until = action.nsteps;
            }

            if (until > 0) {
                this.execute(method, args, until);
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

            // Get and set title for this action
            // Make camelCase separate words: https://stackoverflow.com/a/21148630
            const messageArr =
                action.method.name.match(/[A-Za-z][a-z]*/g) || [];
            let message = messageArr.join(" ");
            message = `${
                message.charAt(0).toUpperCase() + message.substring(1)
            } ${action.args.join(", ")}`;
            this.debug.log(
                `CALL ${nAction}: ${message}, ${JSON.stringify(this.actions)}`
            );

            this.info.setTitle(message);
            await this.pause("");

            // Bind this to metod and call it
            await action.method.apply(this, action.args);
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
                        this.getAnimationSpeed() * 1.1
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
            this.info.setStatus("paused", this.getAnimationSpeed());
            return elem.animate(this.getAnimationSpeed(), 0, "now");
        } else {
            return elem;
        }
    }
}
