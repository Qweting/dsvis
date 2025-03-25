import { Engine, SubmitFunction } from "~/engine";
import { AVL } from "~/trees/AVL";
import { BST } from "~/trees/BST";
import { BTree } from "~/trees/BTree";
import { RedBlack } from "~/trees/RedBlack";
import { SplayTree } from "~/trees/SplayTree";

export interface Collection extends Engine {
    insert: SubmitFunction;
    find: SubmitFunction;
    delete: SubmitFunction;
    print: SubmitFunction;
}

const COLLECTIONS_CLASSES = {
    BST: BST,
    AVL: AVL,
    RedBlack: RedBlack,
    SplayTree: SplayTree,
    BTree: BTree,
} as const satisfies Record<string, new (...args: never[]) => Collection>;

initialiseCollections("#collectionsContainer");

function initialiseCollections(containerID: string) {
    const algoSelector = document.querySelector<HTMLSelectElement>(
        `${containerID} select.algorithmSelector`
    );
    if (!algoSelector) {
        throw new Error("Could not find algo selector");
    }

    // Get algorithm class from URL (blank if not found)
    let algo = new URL(window.location.href).searchParams.get("algorithm");
    if (!algo || !(algo in COLLECTIONS_CLASSES)) {
        algo = "";
    }
    const algoClass = algo as keyof typeof COLLECTIONS_CLASSES | "";
    algoSelector.value = algo;

    const Collection = algoClass ? COLLECTIONS_CLASSES[algoClass] : Engine;
    const CollectionEngine = new Collection(containerID);
    CollectionEngine.initialise();

    algoSelector.addEventListener("change", () => {
        const searchParams = new URLSearchParams();

        if (algoSelector.value in COLLECTIONS_CLASSES) {
            searchParams.set("algorithm", algoSelector.value);
        } else {
            searchParams.delete("algorithm");
        }

        if (CollectionEngine.debugger.isEnabled()) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });
}
