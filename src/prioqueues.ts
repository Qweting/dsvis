import { Engine, SubmitFunction } from "~/engine";
import { BinaryHeap } from "~/heaps/BinaryHeap";

export interface Prioqueue extends Engine {
    insert: SubmitFunction;
    deleteMin: SubmitFunction;
}

const PRIOQUEUES = {
    BinaryHeap: BinaryHeap,
} as const satisfies Record<string, new (...args: never[]) => Prioqueue>;

initialisePrioQueues("#prioqueuesContainer");

function initialisePrioQueues(containerID: string) {
    const algoSelector = document.querySelector<HTMLSelectElement>(
        `${containerID} .algorithmSelector`
    );

    if (!algoSelector) {
        throw new Error("Could not find algo selector");
    }

    let algo = new URL(window.location.href).searchParams.get("algorithm");
    if (!(algo && /^[\w.]+$/.test(algo) && algo in PRIOQUEUES)) {
        algo = "";
    }

    const algoClass = algo as keyof typeof PRIOQUEUES | "";
    algoSelector.value = algo;

    const PrioQueue = algoClass ? PRIOQUEUES[algoClass] : Engine;
    const PQEngine = new PrioQueue(containerID);
    PQEngine.initialise();

    algoSelector.addEventListener("change", () => {
        const searchParams = new URLSearchParams();

        if (algoSelector.value in PRIOQUEUES) {
            searchParams.set("algorithm", algoSelector.value);
        } else {
            searchParams.delete("algorithm");
        }

        if (PQEngine.debugger.isEnabled()) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });
}
