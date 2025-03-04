import { addReturnSubmit, Engine } from "./engine";
import { BinaryHeap } from "./heaps/BinaryHeap";
import { PrioQueueToolbar } from "./toolbars/prioqueue-toolbar";

const PRIOQUEUES = {
    BinaryHeap: BinaryHeap,
} as const;

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

        if (PQEngine.debug.isEnabled()) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });

    const toolbar = new PrioQueueToolbar(PQEngine.container);

    toolbar.insertSelect.addEventListener("change", () => {
        toolbar.insertField.value = toolbar.insertSelect.value;
        toolbar.insertSelect.value = "";
    });
    addReturnSubmit(toolbar.insertField, "ALPHANUM+", () =>
        PQEngine.submit("insert", toolbar.insertField)
    );
    toolbar.insertSubmit.addEventListener("click", () =>
        PQEngine.submit("insert", toolbar.insertField)
    );
    toolbar.deleteSubmit.addEventListener("click", () =>
        PQEngine.submit("deleteMin", null)
    );
    toolbar.clearSubmit.addEventListener("click", () =>
        PQEngine.confirmResetAll()
    );
}
