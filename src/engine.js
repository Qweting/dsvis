
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals SVG */
/* exported DS */
///////////////////////////////////////////////////////////////////////////////

const DS = {};

///////////////////////////////////////////////////////////////////////////////
// Constants and global variables

DS.$Svg = null;
DS.$SvgWidth = 1000;
DS.$SvgHeight = 600;

DS.$Info = {
    x: 30,
    y: 40,
    ybody: 70,
    ystatus: DS.$SvgHeight - 30,
    title: null,
    body: null,
    status: null,
};


DS.$Current = null;
DS.$Actions = null;
DS.$CurrentAction = null;
DS.$CurrentStep = null;
DS.$DEBUG = false;

DS.$EventListeners = {
    stepForward: {},
    stepBackward: {},
    fastForward: {},
    fastBackward: {},
    toggleRunner: {},
};

DS.$Toolbar = {};
DS.$Cookies = {};
DS.$CookieExpireDays = 30;


DS.$Defaults = {};
DS.$Defaults.animationSpeed = 1000; // milliseconds per step

DS.getAnimationSpeed = () => parseInt(DS.$Toolbar.animationSpeed?.value) || DS.$Defaults.animationSpeed;

DS.$Cookies.animationSpeed = {
    getCookie: (value) => DS.$Toolbar.animationSpeed.value = value,
    setCookie: () => DS.getAnimationSpeed(),
};


///////////////////////////////////////////////////////////////////////////////
// Inititalisation

DS.initialise = function(svgID) {
    DS.initEngine(svgID);
    DS.initToolbar();
    DS.loadCookies();
    DS.initAlgorithm();
};


DS.initEngine = function(svgID) {
    DS.$DEBUG = new URL(window.location).searchParams.get("debug");
    DS.$Svg = SVG(svgID).viewbox(0, 0, DS.$SvgWidth, DS.$SvgHeight);
    if (DS.$DEBUG) DS.$Svg.addClass("debug");
    DS.$Actions = [];
};


DS.reset = function() {
    DS.clearCanvas();
    if (DS.$Current) DS.$Current.reset();
    DS.resetListeners();
};


DS.initAlgorithm = function() {
    const algoClass = new URL(window.location).searchParams.get("algorithm");
    const algoSelect = document.getElementById("algorithmSelector");
    if (algoClass && /^[\w.]+$/.test(algoClass) && DS[algoClass]) {
        if (algoSelect) algoSelect.value = algoClass;
        DS.$Current = new DS[algoClass]();
    } else {
        if (algoSelect) algoSelect.value = "";
        DS.$Current = null;
        window.history.replaceState("", "", window.location.pathname);
    }
    DS.reset();
};


DS.selectAlgorithm = function() {
    const algoClass = document.getElementById("algorithmSelector").value;
    if (algoClass) {
        const params = {algorithm: algoClass};
        if (DS.$DEBUG) params.debug = DS.$DEBUG;
        const url = `${window.location.pathname}?${new URLSearchParams(params)}`;
        window.history.replaceState("", "", url);
    }
    DS.initAlgorithm();
};


DS.SVG = function(id) {
    return id ? SVG(`#${id}`) : DS.$Svg;
};


DS.clearCanvas = function() {
    DS.$Svg.clear();
    const w = DS.$SvgWidth;
    const h = DS.$SvgHeight;
    if (DS.$DEBUG) {
        for (let x = 1; x < w / 100; x++) DS.$Svg.line(x * 100, 0, x * 100, h).addClass("gridline");
        for (let y = 1; y < h / 100; y++) DS.$Svg.line(0, y * 100, w, y * 100).addClass("gridline");
    }
    DS.$Info.title = DS.$Svg.text("").addClass("title").x(DS.$Info.x).cy(DS.$Info.y);
    DS.$Info.body = DS.$Svg.text("").addClass("message").x(DS.$Info.x).cy(DS.$Info.ybody);
    DS.$Info.status = DS.$Svg.text("").addClass("status-report").x(DS.$Info.x).cy(DS.$Info.ystatus);
};


DS.setStatus = function(status, timeout = 10) {
    setTimeout(() => {
        if (status === "running") {
            DS.$Info.status.text("Animating").removeClass("paused").addClass("running");
        } else if (status === "paused") {
            DS.$Info.status.text("Paused").addClass("paused").removeClass("running");
        } else {
            DS.$Info.status.text("Idle").removeClass("paused").removeClass("running");
        }
    },
    timeout,
    );
};


///////////////////////////////////////////////////////////////////////////////
// The default listeners

DS.$IdleListeners = {
    stepBackward: {
        type: "click",
        condition: () => DS.$Actions.length > 0,
        handler: () => {
            DS.setRunning(false);
            const action = DS.$Actions.pop();
            DS.execute(action.oper, action.args, action.nsteps - 1);
        },
    },
    fastBackward: {
        type: "click",
        condition: () => DS.$Actions.length > 0,
        handler: () => {
            DS.$Actions.pop();
            if (DS.$Actions.length > 0) {
                const action = DS.$Actions.pop();
                DS.execute(action.oper, action.args, action.nsteps);
            } else {
                DS.reset();
            }
        },
    },
};


DS.$AsyncListeners = {
    stepForward: {
        type: "click",
        handler: (resolve, reject) => {
            DS.setRunning(false);
            DS.stepForward(resolve, reject);
        },
    },
    fastForward: {
        type: "click",
        handler: (resolve, reject) => {
            DS.$Actions[DS.$CurrentAction].nsteps = Number.MAX_SAFE_INTEGER;
            DS.fastForward(resolve, reject);
        },
    },
    toggleRunner: {
        type: "click",
        handler: (resolve, reject) => {
            DS.toggleRunner();
            if (DS.isRunning()) DS.stepForward(resolve, reject);
            else resolve();
        },
    },
    stepBackward: {
        type: "click",
        handler: (resolve, reject) => reject({until: DS.$CurrentStep - 1}),
    },
    fastBackward: {
        type: "click",
        handler: (resolve, reject) => reject({until: 0}),
    },
};


///////////////////////////////////////////////////////////////////////////////
// Updating listeners

DS.disableWhenRunning = function(disable) {
    SVG.find(".disableWhenRunning").forEach((elem) => elem.node.disabled = disable);
};


DS.resetListeners = function(isAsync) {
    DS.saveCookies();
    DS.removeAllListeners();
    if (!DS.$Current) {
        DS.disableWhenRunning(true);
        return;
    }
    DS.addListener("toggleRunner", "click", () => DS.toggleRunner());
    if (isAsync) {
        DS.disableWhenRunning(true);
        DS.setStatus("paused");
        return;
    }

    DS.disableWhenRunning(false);
    DS.setIdleTitle();
    DS.setStatus("inactive");
    for (const id in DS.$IdleListeners) {
        const listener = DS.$IdleListeners[id];
        if (listener.condition()) {
            if (DS.$DEBUG) DS.addListener(id, listener.type, () => {
                console.log(`${id} ${listener.type}: ${JSON.stringify(DS.$Actions)}`);
                listener.handler();
            });
            else DS.addListener(id, listener.type, listener.handler);
        }
    }
};


DS.addListener = function(id, type, handler) {
    const listeners = DS.$EventListeners;
    if (!listeners[id]) listeners[id] = {};
    const elem = DS.$Toolbar[id];
    const oldHandler = listeners[id][type];
    if (oldHandler) elem.removeEventListener(type, oldHandler);
    listeners[id][type] = handler;
    elem.addEventListener(type, handler);
    elem.disabled = false;
};


DS.removeAllListeners = function() {
    const listeners = DS.$EventListeners;
    for (const id in listeners) {
        const elem = DS.$Toolbar[id];
        elem.disabled = true;
        for (const type in listeners[id]) elem.removeEventListener(type, listeners[id][type]);
        listeners[id] = {};
    }
};


///////////////////////////////////////////////////////////////////////////////
// Executing the actions

DS.submit = function(method, field) {
    try {
        let values = [];
        if (field != null) {
            const val = field.value.trim();
            field.value = "";
            if (val === "") return false;
            values = val.split(/\s+/).map((v) => DS.normalizeNumber(v));
        }
        DS.execute(method, values);
    } catch (error) {
        console.error(error);
    }
    return false;
};


DS.execute = function(operation, args, until = 0) {
    if (!args) args = [];
    DS.reset();
    DS.$Actions.push({oper: operation, args: args, nsteps: until});
    if (DS.$DEBUG) console.log(`EXEC ${until}: ${operation} ${args.join(", ")}, ${JSON.stringify(DS.$Actions)}`);

    DS.callAsync(0, until).then(() => {
        DS.$Actions[DS.$Actions.length - 1].nsteps = DS.$CurrentStep;
        if (DS.$DEBUG) console.log(`DONE / ${DS.$CurrentStep}: ${JSON.stringify(DS.$Actions)}`);
        DS.resetListeners();
    }).catch((reason) => {
        if (typeof reason !== "object" || reason.until == null) {
            console.error(reason);
            DS.resetListeners();
            return;
        }
        DS.$Actions.pop();
        until = reason.until;
        if (DS.$DEBUG) console.log(`BACK ${until} / ${DS.$CurrentStep}: ${JSON.stringify(DS.$Actions)}`);
        if (until > 0) {
            DS.setRunning(false);
        }
        if (until <= 0 && DS.$Actions.length > 0) {
            const action = DS.$Actions.pop();
            operation = action.oper, args = action.args, until = action.nsteps;
        }
        if (until > 0) {
            DS.execute(operation, args, until);
        } else {
            DS.reset();
        }
    });
};


DS.callAsync = async function(nAction, until) {
    DS.resetListeners(true);
    const action = DS.$Actions[nAction];
    DS.$CurrentAction = nAction;
    DS.$CurrentStep = 0;
    // Make camelCase separate words: https://stackoverflow.com/a/21148630
    let message = action.oper.match(/[A-Za-z][a-z]*/g).join(" ");
    message = `${message.charAt(0).toUpperCase() + message.substring(1)} ${action.args.join(", ")}`;
    if (DS.$DEBUG) console.log(`CALL ${nAction}: ${message}, ${JSON.stringify(DS.$Actions)}`);
    DS.$Info.title.text(message);
    await DS.pause("");
    await DS.$Current[action.oper](...action.args);
    if (nAction < DS.$Actions.length - 1) await DS.callAsync(nAction + 1, until);
};


DS.pause = function(title) {
    if (title != null) {
        if (title instanceof Array) title = title.join("\n");
        DS.$Info.body.text(title);
    }
    return new Promise((resolve, reject) => {
        if (DS.$DEBUG) console.log(`${DS.$CurrentStep}. Doing: ${title} (running: ${DS.isRunning()}), ${JSON.stringify(DS.$Actions)}`);
        const action = DS.$Actions[DS.$CurrentAction];
        if (action.nsteps != null && DS.$CurrentStep < action.nsteps) {
            DS.fastForward(resolve, reject);
        } else {
            let runnerTimer = null;
            if (DS.isRunning()) {
                DS.setStatus("running");
                runnerTimer = setTimeout(() => DS.stepForward(resolve, reject), DS.getAnimationSpeed() * 1.1);
            }
            for (const id in DS.$AsyncListeners) {
                const listener = DS.$AsyncListeners[id];
                DS.addListener(id, listener.type, () => {
                    clearTimeout(runnerTimer);
                    listener.handler(resolve, reject);
                });
            }
        }
    });
};


DS.stepForward = function(resolve, reject) {
    DS.$CurrentStep++;
    DS.$animating = true;
    resolve();
};


DS.fastForward = function(resolve, reject) {
    const action = DS.$Actions[DS.$CurrentAction];
    if (DS.$CurrentStep >= action.nsteps) {
        action.nsteps = DS.$CurrentStep;
    }
    DS.$CurrentStep++;
    DS.$animating = false;
    if (DS.$DEBUG) setTimeout(resolve, 10);
    else resolve();
};


DS.isRunning = function() {
    return DS.$Toolbar.toggleRunner.classList.contains("selected");
};


DS.setRunning = function(running) {
    const classes = DS.$Toolbar.toggleRunner.classList;
    if (running) classes.add("selected");
    else classes.remove("selected");
};


DS.toggleRunner = function() {
    DS.$Toolbar.toggleRunner.classList.toggle("selected");
};


///////////////////////////////////////////////////////////////////////////////
// Cookies


DS.loadCookies = function() {
    const allCookies = document.cookie.split(";");
    if (DS.$DEBUG) console.log("Document cookies", ...allCookies);
    for (const cookieName in DS.$Cookies) {
        for (const cookie of allCookies) {
            const [cookieName0, value0] = cookie.split("=", 2);
            if (cookieName0.trim() === cookieName) {
                const value = decodeURIComponent(value0);
                DS.$Cookies[cookieName].getCookie(value);
                break;
            }
        }
    }
};


DS.saveCookies = function() {
    const cookies = [];
    for (const cookieName in DS.$Cookies) {
        const value = encodeURIComponent(DS.$Cookies[cookieName].setCookie());
        cookies.push(`${cookieName}=${value}`);
    }
    if (DS.$CookieExpireDays > 0) {
        const exdate = new Date();
        exdate.setDate(exdate.getDate() + DS.$CookieExpireDays);
        cookies.push(`expires=${exdate.toUTCString()}`);
    }
    document.cookie = cookies.join("; ");
    if (DS.$DEBUG) console.log("Setting cookies", ...cookies);
};


///////////////////////////////////////////////////////////////////////////////
// Helper functions

DS.animate = function(elem, animate = true) {
    if (DS.$animating && animate) {
        DS.setStatus("running");
        DS.setStatus("paused", DS.getAnimationSpeed());
        return elem.animate(DS.getAnimationSpeed(), 0, "now");
    } else {
        return elem;
    }
};


DS.normalizeNumber = function(input) {
    input = input.trim();
    return input === "" || isNaN(input) ? input : Number(input);
};


DS.compare = function(a, b) {
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

