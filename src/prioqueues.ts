import { addReturnSubmit, Engine } from "./engine";
import { BinaryHeap } from "./heaps/BinaryHeap";

const PRIOQUEUES = {
    BinaryHeap: BinaryHeap,
} as const;

initialisePrioQueues("#prioqueuesContainer");

function initialisePrioQueues(containerID: string) {
    const algoSelector = document.querySelector(
        `${containerID} .algorithmSelector`
    ) as HTMLSelectElement;
    if (!algoSelector) {
        throw new Error("Could not find algo selector");
    }
    algoSelector.addEventListener("change", () => {
        const searchParams = new URLSearchParams();

        if (algoSelector.value in PRIOQUEUES) {
            searchParams.set("algorithm", algoSelector.value);
        } else {
            searchParams.delete("algorithm");
        }

        if (PQEngine.DEBUG) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });

    let algo = new URL(window.location.href).searchParams.get("algorithm");
    if (!(algo && /^[\w.]+$/.test(algo) && algo in PRIOQUEUES)) {
        algo = "";
    }
    const algoClass = algo as keyof typeof PRIOQUEUES | "";
    algoSelector.value = algo;
    const PrioQueue = algoClass ? PRIOQUEUES[algoClass] : Engine;
    const PQEngine = new PrioQueue(containerID);
    PQEngine.initialise();

    const container = PQEngine.container;
    const tools = getPrioQueuesToolbar(container);

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    addReturnSubmit(tools.insertField, "ALPHANUM+", () =>
        PQEngine.submit("insert", tools.insertField)
    );
    tools.insertSubmit.addEventListener("click", () =>
        PQEngine.submit("insert", tools.insertField)
    );
    tools.deleteSubmit.addEventListener("click", () =>
        PQEngine.submit("deleteMin", null)
    );
    tools.clearSubmit.addEventListener("click", () =>
        PQEngine.confirmResetAll()
    );
}

function getPrioQueuesToolbar(container: HTMLElement) {
    const insertSelect = container.querySelector<HTMLSelectElement>(
        "select.insertSelect"
    );
    const insertField =
        container.querySelector<HTMLInputElement>("input.insertField");
    const insertSubmit =
        container.querySelector<HTMLInputElement>("input.insertSubmit");
    const deleteSubmit =
        container.querySelector<HTMLInputElement>("input.deleteSubmit");
    const clearSubmit =
        container.querySelector<HTMLInputElement>("input.clearSubmit");

    if (!insertSelect) {
        throw new Error("Missing insert select");
    }
    if (!insertField) {
        throw new Error("Missing insert field");
    }
    if (!insertSubmit) {
        throw new Error("Missing insert submit");
    }
    if (!deleteSubmit) {
        throw new Error("Missing delete submit");
    }
    if (!clearSubmit) {
        throw new Error("Missing clear submit");
    }

    return {
        insertSelect,
        insertField,
        insertSubmit,
        deleteSubmit,
        clearSubmit,
    };
}
