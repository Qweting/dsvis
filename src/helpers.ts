import { Engine, MessagesObject, NBSP, RejectReason } from "~/engine";

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

const allowedCharactersRegex = {
    int: "0-9",
    "int+": "0-9 ",
    float: "-.0-9",
    "float+": "-.0-9 ",
    ALPHA: "A-Z",
    "ALPHA+": "A-Z ",
    alpha: "a-zA-Z",
    "alpha+": "a-zA-Z ",
    ALPHANUM: "A-Z0-9",
    "ALPHANUM+": "A-Z0-9 ",
    alphanum: "a-zA-Z0-9",
    "alphanum+": "a-zA-Z0-9 ",
} as const satisfies Record<AllowedCharacters, string>;

// Adds "return-to-submit" functionality to a text input field - performs action when the user presses Enter
// Additionally restricts input to the defined allowed characters (with + meaning spaces are allowed)
export function addReturnSubmit(
    field: HTMLInputElement,
    allowed: AllowedCharacters,
    action?: () => void
): void {
    const allowedCharacters = allowedCharactersRegex[allowed];

    const isAllowed = new RegExp(`[^${allowedCharacters}]`, "g");

    // Transform case of text input to match allowed
    function matchAllowedCase(s: string): string {
        if (allowedCharacters === allowedCharacters.toUpperCase()) {
            return s.toUpperCase();
        } else if (allowedCharacters === allowedCharacters.toLowerCase()) {
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

export function isValidReason(obj: unknown): obj is RejectReason {
    return (
        typeof obj === "object" &&
        obj !== null &&
        "until" in obj &&
        typeof obj.until === "number" &&
        // if running is in object it should be a boolean
        ("running" in obj ? typeof obj.running === "boolean" : true)
    );
}

export type RecordOfEngines<T extends Engine = Engine> = Record<
    string,
    new (containerSelector: string) => T
>;

export function initialiseEngine<T extends Engine = Engine>(
    containerID: string,
    engineSubclasses: RecordOfEngines<NoInfer<T>>
): { isBaseEngine: false; engine: T } | { isBaseEngine: true; engine: Engine } {
    const algoSelector = querySelector<HTMLSelectElement>(
        `${containerID} .algorithmSelector`
    );

    const searchParams = new URL(window.location.href).searchParams;

    const algo =
        new URL(window.location.href).searchParams.get("algorithm") || "";
    algoSelector.value = algo;

    const EngineClass = engineSubclasses[algo] || Engine;
    const engine = new EngineClass(containerID);
    engine.initialise();

    algoSelector.addEventListener("change", () => {
        if (algoSelector.value in engineSubclasses) {
            searchParams.set("algorithm", algoSelector.value);
        } else {
            searchParams.delete("algorithm");
        }

        if (engine.debugger.isEnabled()) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        window.history.replaceState(
            "",
            "",
            `${window.location.pathname}?${searchParams}`
        );
        window.location.reload();
    });

    if (engineSubclasses[algo]) {
        return { isBaseEngine: false, engine: engine as T };
    } else {
        return { isBaseEngine: true, engine: engine as Engine };
    }
}

export function querySelector<T extends Element = Element>(
    selector: string,
    container: HTMLElement = document.documentElement
) {
    const element = container.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Could not find element with selector: "${selector}"`);
    }

    return element;
}
