
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals SVG */
/* exported DS */
///////////////////////////////////////////////////////////////////////////////

const DS = {};

///////////////////////////////////////////////////////////////////////////////
// Constants and global variables

DS.Engine = class {
    // Default variable names start with $

    $Svg = {
        width: 1000,
        height: 600,
        margin: 30,
        objectSize: 40,
        animationSpeed: 1000, // milliseconds per step
    };

    $CookieExpireDays = 30;
    $Cookies = {
        animationSpeed: {
            getCookie: (value) => this.Toolbar.animationSpeed.value = value,
            setCookie: () => this.getAnimationSpeed(),
        },
        objectSize: {
            getCookie: (value) => this.Toolbar.objectSize.value = value,
            setCookie: () => this.getObjectSize(),
        },
    };


    SVG = null;
    Container = null;
    Toolbar = {};
    Actions = null;
    CurrentAction = null;
    CurrentStep = null;
    DEBUG = false;

    State = {
        resetting: null,
        animating: null,
    };

    Info = {
        title: null,
        body: null,
        printer: null,
        status: null,
    };

    EventListeners = {
        stepForward: {},
        stepBackward: {},
        fastForward: {},
        fastBackward: {},
        toggleRunner: {},
    };


    getAnimationSpeed() {
        return parseInt(this.Toolbar.animationSpeed?.value) || this.$Svg.animationSpeed;
    }

    getObjectSize() {
        return parseInt(this.Toolbar.objectSize?.value) || this.$Svg.objectSize;
    }

    getNodeSpacing() {
        return this.getObjectSize();
    }

    getStrokeWidth() {
        return this.getObjectSize() / 12;
    }

    getNodeStart() {
        return [
            this.$Svg.margin + this.getObjectSize() / 2,
            this.$Svg.margin * 4,
        ];
    }

    getTreeRoot() {
        return [
            this.SVG.viewbox().width / 2,
            2 * this.$Svg.margin + this.getObjectSize() / 2,
        ];
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Inititalisation

    constructor(container, defaults = {}) {
        for (const key in defaults) {
            if (!(key.startsWith("$"))) throw new TypeError(`Invalid default key: ${key}`)
        }
        DS.updateDefault(this, defaults, true);
        this.Container = document.querySelector(container);
        this.DEBUG = new URL(window.location).searchParams.get("debug");
        this.SVG = SVG(this.Container.querySelector("svg"));
        this.SVG.viewbox(0, 0, this.$Svg.width, this.$Svg.height);
        this.SVG.$engine = this;
        if (this.DEBUG) this.SVG.addClass("debug");
    }

    initialise() {
        this.initToolbar();
        this.resetAll();
        this.setRunning(true);
    }

    initToolbar() {
        const container = this.Container;
        const tools = this.Toolbar;
        tools.generalControls = container.querySelector(".generalControls");
        tools.algorithmControls = container.querySelector(".algorithmControls");

        tools.stepForward = container.querySelector(".stepForward");
        tools.stepBackward = container.querySelector(".stepBackward");
        tools.toggleRunner = container.querySelector(".toggleRunner");
        tools.fastForward = container.querySelector(".fastForward");
        tools.fastBackward = container.querySelector(".fastBackward");
        tools.objectSize = container.querySelector(".objectSize");

        tools.animationSpeed = container.querySelector(".animationSpeed");
        tools.animationSpeed.addEventListener("change", () => this.saveCookies());
    }


    resetAll() {
        this.Actions = [];
        this.loadCookies();
        this.reset();
    }

    confirmResetAll() {
        if (confirm("This clears the canvas and your history!")) this.resetAll();
    }


    async reset() {
        this.clearCanvas();
        await this.resetAlgorithm();
        this.resetListeners();
    }


    async resetAlgorithm() {
    }


    clearCanvas() {
        this.SVG.clear();
        const w = this.SVG.viewbox().width;
        const h = this.SVG.viewbox().height;
        if (this.DEBUG) {
            for (let x = 1; x < w / 100; x++) this.SVG.line(x * 100, 0, x * 100, h).addClass("gridline");
            for (let y = 1; y < h / 100; y++) this.SVG.line(0, y * 100, w, y * 100).addClass("gridline");
        }
        const margin = this.$Svg.margin;
        this.Info.title = this.SVG.text(DS.NBSP).addClass("title").x(margin).y(margin);
        this.Info.body = this.SVG.text(DS.NBSP).addClass("message").x(margin).y(2 * margin);
        this.Info.printer = this.SVG.text(DS.NBSP).addClass("printer").x(margin).cy(h - 2 * margin);
        this.Info.status = this.SVG.text(DS.NBSP).addClass("status-report").x(margin).cy(h - margin);
        this.updateCSSVariables();
    }


    updateCSSVariables() {
        const relativeSize = Math.round(100 * this.getObjectSize() / this.$Svg.objectSize);
        document.documentElement.style.setProperty('--node-font-size', `${relativeSize}%`);
    }


    setStatus(status, timeout = 10) {
        setTimeout(() => {
            if (status === "running") {
                this.Info.status.text("Animating").removeClass("paused").addClass("running");
            } else if (status === "paused") {
                this.Info.status.text("Paused").addClass("paused").removeClass("running");
            } else {
                this.Info.status.text("Idle").removeClass("paused").removeClass("running");
            }
        },
        timeout,
        );
    }


    setIdleTitle() {
        this.Info.title.text("Select an action from the menu above");
        this.Info.body.text(DS.NBSP);
    }


    ///////////////////////////////////////////////////////////////////////////////
    // The default listeners

    $IdleListeners = {
        stepBackward: {
            type: "click",
            condition: () => this.Actions.length > 0,
            handler: () => {
                this.setRunning(false);
                const action = this.Actions.pop();
                this.execute(action.oper, action.args, action.nsteps - 1);
            },
        },
        fastBackward: {
            type: "click",
            condition: () => this.Actions.length > 0,
            handler: () => {
                this.Actions.pop();
                if (this.Actions.length > 0) {
                    const action = this.Actions.pop();
                    this.execute(action.oper, action.args, action.nsteps);
                } else {
                    this.reset();
                }
            },
        },
        objectSize: {
            type: "change",
            condition: () => true,
            handler: () => {
                if (this.Actions.length > 0) {
                    const action = this.Actions.pop();
                    this.execute(action.oper, action.args, action.nsteps);
                } else {
                    this.reset();
                }
            },
        },
    };


    $AsyncListeners = {
        stepForward: {
            type: "click",
            handler: (resolve, reject) => {
                this.setRunning(false);
                this.stepForward(resolve, reject);
            },
        },
        fastForward: {
            type: "click",
            handler: (resolve, reject) => {
                this.Actions[this.CurrentAction].nsteps = Number.MAX_SAFE_INTEGER;
                this.fastForward(resolve, reject);
            },
        },
        toggleRunner: {
            type: "click",
            handler: (resolve, reject) => {
                this.toggleRunner();
                if (this.isRunning()) {
                    this.stepForward(resolve, reject);
                } else {
                    this.CurrentStep++;
                    resolve();
                }
            },
        },
        stepBackward: {
            type: "click",
            handler: (resolve, reject) => reject({until: this.CurrentStep - 1, running: false}),
        },
        fastBackward: {
            type: "click",
            handler: (resolve, reject) => reject({until: 0}),
        },
        objectSize: {
            type: "change",
            handler: (resolve, reject) => reject({until: this.CurrentStep}),
        },
    };


    ///////////////////////////////////////////////////////////////////////////////
    // Updating listeners

    disableWhenRunning(disable) {
        for (const elem of this.Container.querySelectorAll(".disableWhenRunning"))
            elem.disabled = disable;
    }


    resetListeners(isRunning) {
        this.saveCookies();
        this.removeAllListeners();
        if (this.constructor === DS.Engine) {
            this.disableWhenRunning(true);
            return;
        }
        this.addListener("toggleRunner", "click", () => this.toggleRunner());
        if (isRunning) {
            this.disableWhenRunning(true);
            this.setStatus("paused");
            return;
        }

        this.disableWhenRunning(false);
        this.setIdleTitle();
        this.setStatus("inactive");
        for (const id in this.$IdleListeners) {
            const listener = this.$IdleListeners[id];
            if (listener.condition()) {
                if (this.DEBUG) this.addListener(id, listener.type, () => {
                    console.log(`${id} ${listener.type}: ${JSON.stringify(this.Actions)}`);
                    listener.handler();
                });
                else this.addListener(id, listener.type, listener.handler);
            }
        }
    }


    addListener(id, type, handler) {
        const listeners = this.EventListeners;
        if (!listeners[id]) listeners[id] = {};
        const elem = this.Toolbar[id];
        const oldHandler = listeners[id][type];
        if (oldHandler) elem.removeEventListener(type, oldHandler);
        listeners[id][type] = handler;
        elem.addEventListener(type, handler);
        elem.disabled = false;
    }


    removeAllListeners() {
        const listeners = this.EventListeners;
        for (const id in listeners) {
            const elem = this.Toolbar[id];
            elem.disabled = true;
            for (const type in listeners[id]) elem.removeEventListener(type, listeners[id][type]);
            listeners[id] = {};
        }
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Executing the actions

    submit(method, field) {
        try {
            let values = [];
            if (field != null) {
                const val = field.value.trim();
                field.value = "";
                if (val === "") return false;
                values = val.split(/\s+/).map((v) => DS.normalizeNumber(v));
            }
            this.execute(method, values);
        } catch (error) {
            console.error(error);
        }
        return false;
    }


    async execute(operation, args = [], until = 0) {
        await this.reset();
        this.Actions.push({oper: operation, args: args, nsteps: until});
        if (this.DEBUG) console.log(`EXEC ${until}: ${operation} ${args.join(", ")}, ${JSON.stringify(this.Actions)}`);

        try {
            await this.runActionsLoop();
            this.Actions[this.Actions.length - 1].nsteps = this.CurrentStep;
            if (this.DEBUG) console.log(`DONE / ${this.CurrentStep}: ${JSON.stringify(this.Actions)}`);
            this.resetListeners();
        } catch (reason) {
            if (typeof reason !== "object" || reason.until == null) {
                console.error(reason);
                this.resetListeners();
                return;
            }
            this.Actions.pop();
            if ('running' in reason)
                this.setRunning(reason.running);
            until = reason.until;
            if (this.DEBUG) console.log(`RERUN ${until} / ${this.CurrentStep}: ${JSON.stringify(this.Actions)}`);
            if (until <= 0 && this.Actions.length > 0) {
                const action = this.Actions.pop();
                operation = action.oper, args = action.args, until = action.nsteps;
            }
            if (until > 0) {
                this.execute(operation, args, until);
            } else {
                this.reset();
            }
        }
    }


    async runActionsLoop() {
        for (let nAction = 0; nAction < this.Actions.length; nAction++) {
            this.resetListeners(true);
            const action = this.Actions[nAction];
            this.CurrentAction = nAction;
            this.CurrentStep = 0;
            // Make camelCase separate words: https://stackoverflow.com/a/21148630
            let message = action.oper.match(/[A-Za-z][a-z]*/g).join(" ");
            message = `${message.charAt(0).toUpperCase() + message.substring(1)} ${action.args.join(", ")}`;
            if (this.DEBUG) console.log(`CALL ${nAction}: ${message}, ${JSON.stringify(this.Actions)}`);
            this.Info.title.text(message);
            await this.pause("");
            await this[action.oper](...action.args);
        }
    }


    pause(message, ...args) {
        const title = this.getMessage(message, ...args);
        if (this.DEBUG) console.log(`${this.CurrentStep}. Doing: ${title} (running: ${this.isRunning()}), ${JSON.stringify(this.Actions)}`);
        if (this.State.resetting) return null;
        if (title != null) {
            this.Info.body.text(title);
        }
        return new Promise((resolve, reject) => {
            const action = this.Actions[this.CurrentAction];
            if (action.nsteps != null && this.CurrentStep < action.nsteps) {
                this.fastForward(resolve, reject);
            } else {
                let runnerTimer = null;
                for (const id in this.$AsyncListeners) {
                    const listener = this.$AsyncListeners[id];
                    this.addListener(id, listener.type, () => {
                        clearTimeout(runnerTimer);
                        listener.handler(resolve, reject);
                    });
                }
                if (this.isRunning()) {
                    this.setStatus("running");
                    runnerTimer = setTimeout(() => this.stepForward(resolve, reject), this.getAnimationSpeed() * 1.1);
                }
            }
        });
    }


    getMessage(message, ...args) {
        if (Array.isArray(message)) [message, ...args] = [...message, ...args];
        if (typeof message !== "string") {
            if (args.length > 0) console.error("Unknown message:", message, ...args);
            return message;
        }
        if (!message) return args.join("\n");
        let title = this.messages || this.constructor.messages || {};
        const keys = message.split(".");
        if (!(keys[0] in title)) return [message, ...args].join("\n");
        for (const key of keys) {
            if (!(typeof title === "object" && key in title)) {
                console.error("Unknown message:", message, ...args);
                return [message, ...args].join("\n");
            }
            title = title[key];
        }
        if (typeof title === "function") title = title(...args);
        if (Array.isArray(title)) title = title.join("\n");
        if (typeof title === "object") {
            console.error("Unknown message:", message, ...args);
            return [message, ...args].join("\n");
        }
        if (title === "") title = DS.NBSP;
        return title;
    }


    stepForward(resolve, reject) {
        this.CurrentStep++;
        this.State.animating = true;
        resolve();
    }


    fastForward(resolve, reject) {
        const action = this.Actions[this.CurrentAction];
        if (this.CurrentStep >= action.nsteps) {
            action.nsteps = this.CurrentStep;
        }
        this.CurrentStep++;
        this.State.animating = false;
        if (this.DEBUG) setTimeout(resolve, 10);
        else resolve();
    }


    isRunning() {
        return this.Toolbar.toggleRunner.classList.contains("selected");
    }


    setRunning(running) {
        const classes = this.Toolbar.toggleRunner.classList;
        if (running) classes.add("selected");
        else classes.remove("selected");
    }


    toggleRunner() {
        this.Toolbar.toggleRunner.classList.toggle("selected");
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Cookies


    loadCookies() {
        if (this.DEBUG) console.log("Loading cookies", document.cookie);
        const allCookies = document.cookie.split(";");
        for (const cookieName in this.$Cookies) {
            for (const cookie of allCookies) {
                const [cookieName0, value0] = cookie.split("=", 2);
                if (cookieName0.trim() === cookieName) {
                    const value = decodeURIComponent(value0);
                    this.$Cookies[cookieName].getCookie(value);
                    break;
                }
            }
        }
    }


    saveCookies() {
        let expires = "";
        if (this.$CookieExpireDays > 0) {
            const exdate = new Date();
            exdate.setDate(exdate.getDate() + this.$CookieExpireDays);
            expires = `;expires=${exdate.toUTCString()}`;
        }
        for (const cookieName in this.$Cookies) {
            const value = encodeURIComponent(this.$Cookies[cookieName].setCookie());
            document.cookie = `${cookieName}=${value}${expires}`;
        }
        if (this.DEBUG) console.log("Setting cookies", document.cookie);
    }


    animate(elem, animate = true) {
        if (this.State.animating && animate) {
            this.setStatus("running");
            this.setStatus("paused", this.getAnimationSpeed());
            return elem.animate(this.getAnimationSpeed(), 0, "now");
        } else {
            return elem;
        }
    }
};


///////////////////////////////////////////////////////////////////////////////
// Helper functions


DS.normalizeNumber = function(input) {
    input = input.trim();
    return input === "" || isNaN(input) ? input : Number(input);
};


DS.addReturnSubmit = function(field, allowed, action) {
    allowed = (
        allowed === "int" ? "0-9" :
        allowed === "int+" ? "0-9 " :
        allowed === "float" ? "-.0-9" :
        allowed === "float+" ? "-.0-9 " :
        allowed === "ALPHA" ? "A-Z" :
        allowed === "ALPHA+" ? "A-Z " :
        allowed === "alpha" ? "a-zA-Z" :
        allowed === "alpha+" ? "a-zA-Z " :
        allowed === "ALPHANUM" ? "A-Z0-9" :
        allowed === "ALPHANUM+" ? "A-Z0-9 " :
        allowed === "alphanum" ? "a-zA-Z0-9" :
        allowed === "alphanum+" ? "a-zA-Z0-9 " :
        allowed
    );

    const regex = new RegExp(`[^${allowed}]`, "g");

    const transform = (
        allowed === allowed.toUpperCase() ? (s) => s.toUpperCase() :
        allowed === allowed.toLowerCase() ? (s) => s.toLowerCase() : (s) => s
    );

    // Idea taken from here: https://stackoverflow.com/a/14719818
    field.oninput = (event) => {
        let pos = field.selectionStart;
        let value = transform(field.value);
        if (regex.test(value)) {
            value = value.replace(regex, "");
            pos--;
        }
        field.value = value;
        field.setSelectionRange(pos, pos);
    };

    if (action) {
        field.onkeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                action();
            }
        };
    }
};


DS.updateDefault = function(obj, defaultObj, override = false) {
    for (const key in defaultObj) {
        if (!(key in obj)) {
            obj[key] = defaultObj[key];
        } else if (typeof obj[key] === "object" && typeof defaultObj[key] === "object") {
            DS.updateDefault(obj[key], defaultObj[key]);
        } else if (override) {
            obj[key] = defaultObj[key];
        }
    }
};


DS.modulo = function(n, d) {
    const rem = n % d;
    return rem < 0 ? rem + d : rem;
}


// Non-breaking space:
DS.NBSP = "\u00A0";

DS.compare = function(a, b) {
    // We use non-breaking space as a proxy for the empty string,
    // because SVG text objects reset coordinates to (0, 0) for the empty string.
    if (a === DS.NBSP) a = "";
    if (b === DS.NBSP) b = "";
    if (isNaN(a) === isNaN(b)) {
        // a and b are (1) both numbers or (2) both non-numbers
        if (!isNaN(a)) {
            // a and b are both numbers
            a = Number(a);
            b = Number(b);
        }
        return a === b ? 0 : a < b ? -1 : 1;
    } else {
        // a and b are of different types
        // let's say that numbers are smaller than non-numbers
        return isNaN(a) ? 1 : -1;
    }
};

