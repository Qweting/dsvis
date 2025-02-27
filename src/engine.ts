import { Element } from "@svgdotjs/svg.js";
import { Cookies } from "./cookies";
import { EventListeners } from "./event-listeners";
import { Info } from "./info";
import { Svg } from "./objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!
import { EngineToolbar } from "./toolbars/engine-toolbar";

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
    actions: { oper: string; args: unknown[]; nsteps: number }[] = [];
    currentAction: number = 0; // was = null before, this should work better
    currentStep: number = 0; // was = null before, this should work better
    DEBUG = true;

    state: {
        resetting: boolean;
        animating: boolean;
    } = {
        resetting: false,
        animating: false,
    };

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
        const container =
            document.querySelector<HTMLElement>(containerSelector);
        if (!container) {
            throw new Error("No container found");
        }

        this.container = container;
        this.toolbar = new EngineToolbar(container);

        this.cookies = new Cookies({
            objectSize: this.toolbar.objectSize,
            animationSpeed: this.toolbar.animationSpeed,
        });

        const svgContainer = this.container.querySelector("svg");
        if (!svgContainer) {
            throw new Error("No svg element found");
        }

        this.Svg = new Svg(svgContainer);
        this.Svg.viewbox(0, 0, this.$Svg.width, this.$Svg.height);
        this.Svg.$engine = this;

        const debugParam = new URLSearchParams(window.location.href).get(
            "debug"
        );
        this.DEBUG = Boolean(debugParam || false);
        if (this.DEBUG) {
            this.Svg.addClass("debug");
        }

        this.info = new Info(this.Svg, this.$Svg.margin);
        this.eventListeners = new EventListeners(this);
    }

    initialise(): void {
        this.initToolbar();
        this.resetAll();
        this.setRunning(true);
    }

    initToolbar(): void {
        this.toolbar.animationSpeed.addEventListener("change", () =>
            this.saveCookies()
        );
    }

    async resetAll(): Promise<void> {
        this.actions = [];
        this.loadCookies();
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
        if (this.DEBUG) {
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
        this.saveCookies();
        this.eventListeners.removeAllListeners();
        if (this.constructor === Engine) {
            this.disableWhenRunning(true);
            return;
        }
        this.eventListeners.addListener("toggleRunner", "click", () =>
            this.toggleRunner()
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
        if (this.DEBUG) {
            console.log(
                `EXEC ${until}: ${operation} ${args.join(
                    ", "
                )}, ${JSON.stringify(this.actions)}`
            );
        }

        try {
            await this.runActionsLoop();
            this.actions[this.actions.length - 1].nsteps =
                this.currentStep || 0; // TODO: Not sure if this is correct
            if (this.DEBUG) {
                console.log(
                    `DONE / ${this.currentStep}: ${JSON.stringify(
                        this.actions
                    )}`
                );
            }
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
                this.setRunning(reason.running);
            }
            until = reason.until;
            if (this.DEBUG) {
                console.log(
                    `RERUN ${until} / ${this.currentStep}: ${JSON.stringify(
                        this.actions
                    )}`
                );
            }
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
            if (this.DEBUG) {
                console.log(
                    `CALL ${nAction}: ${message}, ${JSON.stringify(
                        this.actions
                    )}`
                );
            }
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
        if (this.DEBUG) {
            console.log(
                `${
                    this.currentStep
                }. Doing: ${title} (running: ${this.isRunning()}), ${JSON.stringify(
                    this.actions
                )}`
            );
        }
        if (this.state.resetting) {
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
                if (this.isRunning()) {
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
        this.state.animating = true;
        resolve(undefined);
    }

    fastForward(resolve: Resolve, reject: Reject): void {
        const action = this.actions[this.currentAction];
        if (this.currentStep >= action.nsteps) {
            action.nsteps = this.currentStep;
        }
        this.currentStep++;
        this.state.animating = false;
        if (this.DEBUG) {
            setTimeout(resolve, 10);
        } else {
            resolve(undefined);
        }
    }

    isRunning(): boolean {
        return this.toolbar.toggleRunner.classList.contains("selected");
    }

    setRunning(running: boolean): this {
        const classes = this.toolbar.toggleRunner.classList;
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

    ///////////////////////////////////////////////////////////////////////////////
    // Cookies

    loadCookies(): void {
        if (this.DEBUG) {
            console.log("Loading cookies", document.cookie);
        }
        this.cookies.load();
    }

    saveCookies(): void {
        this.cookies.save();
        if (this.DEBUG) {
            console.log("Setting cookies", document.cookie);
        }
    }

    animate(elem: Element, animate = true) {
        if (this.state.animating && animate) {
            this.info.setStatus("running");
            this.info.setStatus("paused", this.getAnimationSpeed());
            return elem.animate(this.getAnimationSpeed(), 0, "now");
        } else {
            return elem;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
// Helper functions

export function normalizeNumber(input: string): string | number {
    input = input.trim();
    return input === "" || isNaN(Number(input)) ? input : Number(input);
}

export function parseValues(
    values: string | string[] | null | undefined
): (string | number)[] {
    if (!values) {
        return [];
    }
    if (typeof values === "string") {
        values = values.trim().split(/\s+/);
    }
    return values.map((v) => normalizeNumber(v));
}

type AllowedCharacters =
    | "int"
    | "int+"
    | "float"
    | "float+"
    | "ALPHA"
    | "ALPHA+"
    | "alpha"
    | "alpha+"
    | "ALPHANUM"
    | "ALPHANUM+"
    | "alphanum"
    | "alphanum+";

// Adds "return-to-submit" functionality to a text input field - performs action when the user presses Enter
// Additionally restricts input to the defined allowed characters (with + meaning spaces are allowed)
export function addReturnSubmit(
    field: HTMLInputElement,
    allowed: AllowedCharacters,
    action?: () => void
): void {
    const allowedCharacters =
        allowed === "int"
            ? "0-9"
            : allowed === "int+"
            ? "0-9 "
            : allowed === "float"
            ? "-.0-9"
            : allowed === "float+"
            ? "-.0-9 "
            : allowed === "ALPHA"
            ? "A-Z"
            : allowed === "ALPHA+"
            ? "A-Z "
            : allowed === "alpha"
            ? "a-zA-Z"
            : allowed === "alpha+"
            ? "a-zA-Z "
            : allowed === "ALPHANUM"
            ? "A-Z0-9"
            : allowed === "ALPHANUM+"
            ? "A-Z0-9 "
            : allowed === "alphanum"
            ? "a-zA-Z0-9"
            : allowed === "alphanum+"
            ? "a-zA-Z0-9 "
            : allowed;
    const isAllowed = new RegExp(`[^${allowedCharacters}]`, "g");

    // Transform case of text input to match allowed
    function matchAllowedCase(s: string): string {
        if (allowed === allowed.toUpperCase()) {
            return s.toUpperCase();
        } else if (allowed === allowed.toLowerCase()) {
            return s.toLowerCase();
        }
        return s;
    }

    // Idea taken from here: https://stackoverflow.com/a/14719818
    // Block unwanted characters from being typed
    field.oninput = (_) => {
        let pos = field.selectionStart || 0;
        let value = matchAllowedCase(field.value);
        if (isAllowed.test(value)) {
            value = value.replace(isAllowed, "");
            pos--;
        }
        field.value = value;
        field.setSelectionRange(pos, pos);
    };

    // Perform action when Enter is pressed
    if (!action) {
        return;
    }
    field.onkeydown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            action();
        }
    };
}

// Merges all keys from defaultObject into object
// Set override to true to overwrite existing keys
export function updateDefault(
    object: MessagesObject,
    defaultObject: MessagesObject,
    override: boolean = false
): MessagesObject {
    for (const key in defaultObject) {
        if (!(key in object)) {
            object[key] = defaultObject[key];
        } else if (
            typeof object[key] === "object" &&
            object[key] !== null &&
            typeof defaultObject[key] === "object" &&
            defaultObject[key] !== null
        ) {
            updateDefault(object[key], defaultObject[key], override);
        } else if (override) {
            object[key] = defaultObject[key];
        }
    }
    return object;
}

export function modulo(n: number, d: number): number {
    const rem = n % d;
    return rem < 0 ? rem + d : rem;
}

export function compare(a: string | number, b: string | number): -1 | 0 | 1 {
    // We use non-breaking space as a proxy for the empty string,
    // because SVG text objects reset coordinates to (0, 0) for the empty string.
    if (a === NBSP) {
        a = "";
    }
    if (b === NBSP) {
        b = "";
    }
    if (isNaN(Number(a)) === isNaN(Number(b))) {
        // a and b are (1) both numbers or (2) both non-numbers
        if (!isNaN(Number(a))) {
            // a and b are both numbers
            a = Number(a);
            b = Number(b);
        }
        return a === b ? 0 : a < b ? -1 : 1;
    } else {
        // a and b are of different types
        // let's say that numbers are smaller than non-numbers
        return isNaN(Number(a)) ? 1 : -1;
    }
}
