import { Element } from "@svgdotjs/svg.js";
import { Cookies } from "~/cookies";
import { Debugger } from "~/debugger";
import { isValidReason, parseValues } from "~/helpers";
import { Info } from "~/info";
import { Svg } from "~/objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!
import { State } from "~/state";
import { EngineAlgorithmControl } from "./algorithm-controls/engine-algorithm-controls";
import { EngineGeneralControls } from "./general-controls/engine-general-controls";

export type Resolve = (value: unknown) => void;
export type Reject = (props: RejectReason) => void;
export type RejectReason = { until: number; running?: boolean };

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
    stepCount: number;
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
    generalControls: EngineGeneralControls;
    algorithmControls: EngineAlgorithmControl;
    actions: Action[] = [];
    currentAction: number = 0;
    currentStep: number = 0;
    debugger: Debugger;
    state: State;
    info: Info;

    getAnimationSpeed(): number {
        return parseInt(this.generalControls.animationSpeed.value);
    }

    getObjectSize(): number {
        return parseInt(this.generalControls.objectSize.value);
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
        this.debugger = new Debugger();

        const container =
            document.querySelector<HTMLElement>(containerSelector);
        if (!container) {
            throw new Error("No container found");
        }

        this.container = container;
        this.generalControls = new EngineGeneralControls(container, this);
        this.algorithmControls = new EngineAlgorithmControl(container);

        this.state = new State(this.generalControls.toggleRunner);

        this.cookies = new Cookies(
            {
                objectSize: this.generalControls.objectSize,
                animationSpeed: this.generalControls.animationSpeed,
            },
            this.debugger
        );

        const svgContainer = this.container.querySelector("svg");
        if (!svgContainer) {
            throw new Error("No svg element found");
        }

        this.Svg = new Svg(svgContainer);
        this.Svg.viewbox(0, 0, this.$Svg.width, this.$Svg.height);
        this.Svg.$engine = this;
        if (this.debugger.isEnabled()) {
            this.Svg.addClass("debug");
        }

        this.info = new Info(this.Svg, this.$Svg.margin);
    }

    initialise(): void {
        this.resetAll();
        this.state.setRunning(true);
    }

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

    async resetAlgorithm(): Promise<void> {
        /* Allow subclasses to use this function */
    }

    clearCanvas(): void {
        this.Svg.clear();

        const w = this.Svg.viewbox().width;
        const h = this.Svg.viewbox().height;
        if (this.debugger.isEnabled()) {
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

    async drawViewbox(right: number, down: number, zoom: number) {
        this.Svg.viewbox(
            right,
            down,
            this.$Svg.width * zoom,
            this.$Svg.height * zoom
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
        // Clear all currently running listeners
        this.generalControls.removeAllListeners();
        if (this.constructor === Engine) {
            // Nothing can be running so disable buttons
            this.disableWhenRunning(true);
            return;
        }

        this.generalControls.addListener(
            this.generalControls.toggleRunner,
            "click",
            () => this.state.toggleRunner()
        );
        if (isRunning) {
            // Is running so disable buttons to prevent new inputs
            this.disableWhenRunning(true);
            this.info.setStatus("paused");
            return;
        }

        this.disableWhenRunning(false);
        this.setIdleTitle();
        this.info.setStatus("inactive");
        this.generalControls.addIdleListeners();
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
        this.actions.push({ method, args, stepCount: until });
        this.debugger.log(
            `EXEC ${until}: ${method.name} ${args.join(", ")}, ${JSON.stringify(
                this.actions
            )}`
        );

        try {
            await this.runActionsLoop();
            this.actions[this.actions.length - 1].stepCount = this.currentStep;
            this.debugger.log(
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
            this.debugger.log(
                `RERUN ${until} / ${this.currentStep}: ${JSON.stringify(
                    this.actions
                )}`
            );

            // until is smaller or equal to 0 meaning the previous action should be run if it exists
            if (until <= 0 && this.actions.length > 0) {
                const action = this.actions.pop()!; // ! because we know that array is non-empty (actions.length > 0)
                method = action.method as T;
                args = action.args as Parameters<T>;
                until = action.stepCount;
            }

            // Re execute if there is something to run until, otherwise reset
            if (until > 0) {
                this.execute(method, args, until);
            } else {
                this.reset();
            }
        }
    }

    async runActionsLoop(): Promise<void> {
        // Run through all our actions
        for (let nAction = 0; nAction < this.actions.length; nAction++) {
            this.resetListeners(true);
            const action = this.actions[nAction];
            this.currentAction = nAction;
            this.currentStep = 0;

            // Get and set title for this action
            // Make camelCase separate words: https://stackoverflow.com/a/21148630
            const methodNameArr =
                action.method.name.match(/[A-Za-z][a-z]*/g) || [];
            const methodName = methodNameArr
                .map((str) => str.charAt(0).toUpperCase() + str.substring(1))
                .join(" ");
            const title = `${methodName} ${action.args.join(", ")}`;
            this.debugger.log(
                `CALL ${nAction}: ${title}, ${JSON.stringify(this.actions)}`
            );

            this.info.setTitle(title);
            await this.pause("");

            // Bind this to method and call it
            await action.method.apply(this, action.args);
        }
    }

    pause(
        message: string | undefined,
        ...args: unknown[]
    ): Promise<unknown> | null {
        const body = this.getMessage(message, ...args);
        this.debugger.log(
            `${
                this.currentStep
            }. Doing: ${body} (running: ${this.state.isRunning()}), ${JSON.stringify(
                this.actions
            )}`
        );

        // If resetting no pause should be run
        if (this.state.isResetting()) {
            return null;
        }

        if (body !== undefined) {
            this.info.setBody(body);
        }

        return new Promise((resolve, reject) => {
            const action = this.actions[this.currentAction];

            // Check if step has been executed previously (action.stepCount = 0 if first time and has a value otherwise)
            if (this.currentStep < action.stepCount) {
                this.fastForward(resolve, reject);
                return;
            }

            // Add async listeners that handle button presses while paused
            let runnerTimer: NodeJS.Timeout | undefined = undefined;
            this.generalControls.addAsyncListeners(
                resolve,
                reject,
                runnerTimer
            );

            // If running, automatically step forward after waiting animation speed
            if (this.state.isRunning()) {
                this.info.setStatus("running");
                runnerTimer = setTimeout(
                    () => this.stepForward(resolve, reject),
                    this.getAnimationSpeed() * 1.1
                );
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

        // Assume that message is a key to access this.messages
        let title: MessagesObject[string] = this.messages;
        const keys = message.split(".");
        if (!(keys[0] in title)) {
            // Assumption was wrong returning the original message and the extra arguments
            return [message, ...args].join("\n");
        }
        for (const key of keys) {
            if (!(typeof title === "object" && key in title)) {
                console.error("Unknown message:", message, ...args);
                return [message, ...args].join("\n");
            }
            title = title[key];
        }

        // Title is now hopefully a string or function from this.messages
        if (typeof title === "function") {
            title = title(...args);
        }
        if (typeof title !== "string") {
            console.error("Unknown message:", message, ...args);
            return [message, ...args].join("\n");
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
        if (this.currentStep >= action.stepCount) {
            action.stepCount = this.currentStep;
        }
        this.currentStep++;
        this.state.setAnimating(false);
        // If debugging is enabled then add a small delay
        if (this.debugger.isEnabled()) {
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
