import { Element } from "@svgdotjs/svg.js";
import { Cookies } from "~/cookies";
import { Debugger } from "~/debugger";
import { isValidReason, parseValues, querySelector } from "~/helpers";
import { Info } from "~/info";
import { Svg } from "~/objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!
import { State } from "~/state";
import { EngineAlgorithmControl } from "./algorithm-controls/engine-algorithm-controls";
import { EngineGeneralControls } from "./general-controls/engine-general-controls";

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

/**
 * A non-breaking space character (`\u00A0`) used as a placeholder for an empty string.
 *
 * This workaround prevents SVG text elements from the `@svgdotjs/svg.js` library
 * from resetting their coordinates to (0, 0) when assigned an empty string.
 */
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
        return parseInt(this.generalControls.animationSpeedSelect.value);
    }

    getObjectSize(): number {
        return parseInt(this.generalControls.objectSizeSelect.value);
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
        this.state = new State();

        this.container = querySelector<HTMLElement>(containerSelector);

        this.generalControls = new EngineGeneralControls(this.container, this);
        this.algorithmControls = new EngineAlgorithmControl(this.container);

        this.cookies = new Cookies(
            {
                objectSize: this.generalControls.objectSizeSelect,
                animationSpeed: this.generalControls.animationSpeedSelect,
            },
            this.debugger
        );

        const svgContainer = querySelector<SVGSVGElement>(
            "svg",
            this.container
        );

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
        this.generalControls.setRunning(true);
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

    /**
     * Enables or disables all elements with the `.disableWhenRunning` class
     * based on the provided state.
     *
     * @param disabled - A boolean indicating whether the elements should be disabled.
     */
    disableWhenRunning(disabled: boolean): void {
        for (const elem of this.container.querySelectorAll<
            HTMLInputElement | HTMLSelectElement
        >(".disableWhenRunning")) {
            elem.disabled = disabled;
        }
    }

    /**
     * Resets event listeners based on the running state of the engine.
     * This function ensures that the appropriate listeners are active
     * while preventing new inputs when necessary.
     *
     * @param isRunning - A boolean indicating whether the engine is currently running.
     */
    resetListeners(isRunning: boolean): void {
        // Remove all currently active listeners
        this.generalControls.removeAllListeners();
        // If the instance is an `Engine`, it disable UI controls and exit
        if (this.constructor === Engine) {
            // Nothing can be running so disable buttons
            this.disableWhenRunning(true);
            return;
        }

        this.generalControls.addRunnerListener();
        // If running, it disables new inputs and sets the status to `"paused"
        if (isRunning) {
            // Is running so disable buttons to prevent new inputs
            this.disableWhenRunning(true);
            this.info.setStatus("paused");
            return;
        }
        // If idle, enable inputs, update the status to `"inactive"`, and re-add idle listener
        this.disableWhenRunning(false);
        this.setIdleTitle();
        this.info.setStatus("inactive");
        this.generalControls.addIdleListeners();
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Executing the actions

    /**
     * Handles the execution of the provided method with parsed values from an input field.
     *
     * @param method - The submission function to execute with parsed input values.
     * @param field - The input field containing the user-provided data. Can be `null`.
     * @returns A promise resolving to `true` if submission succeeds, or `false` if an error occurs.
     * @throws Logs any errors encountered during execution.
     */
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
            await this.execute(method, values);
            return true;
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    /**
     * Executes an asynchronous method with the given arguments, managing action execution
     * and handling errors or interruptions. This function ensures actions are logged,
     * retried if necessary, and properly cleaned up after execution.
     *
     * @template Function - A function type that returns a `Promise<void>`.
     * @param method - The asynchronous method to execute.
     * @param args - The arguments to pass to the method.
     * @param until - (Optional) The step count to execute until. Defaults to `0`.
     * @returns A promise that resolves once execution is complete
     * @throws If an unexpected error occurs, it logs the error and resets listeners.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async execute<Function extends (...args: any[]) => Promise<void>>(
        method: Function,
        args: Parameters<Function>,
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
                this.generalControls.setRunning(reason.running);
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
                method = action.method as Function;
                args = action.args as Parameters<Function>;
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

    /**
     * Executes a sequence of actions stored in `this.actions`.
     * Each action is processed in order, updating the current action and step counters.
     *
     * @returns A promise that resolves once all actions have been executed sequentially.
     */
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
            }. Doing: ${body} (running: ${this.generalControls.isRunning()}), ${JSON.stringify(
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
                this.generalControls.fastForward(resolve, reject);
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
            if (this.generalControls.isRunning()) {
                this.info.setStatus("running");
                runnerTimer = setTimeout(
                    () => this.generalControls.stepForward(resolve, reject),
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