import { Engine, SubmitFunction } from "./engine";
import { addReturnSubmit } from "./helpers";
import { CollectionToolbar } from "./toolbars/collection-toolbar";
import { AVL } from "./trees/AVL";
import { BST } from "./trees/BST";
import { BTree } from "./trees/BTree";
import { RedBlack } from "./trees/RedBlack";
import { SplayTree } from "./trees/SplayTree";
import { LinkedListAnim } from "./basic/LinkedListAnim";

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
    LinkedListAnim: LinkedListAnim,
} as const satisfies Record<string, new (...args: never[]) => Collection>;

function isCollection(engine: Engine | Collection): engine is Collection {
    return engine instanceof Engine && engine.constructor !== Engine;
}

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

        if (CollectionEngine.debug.isEnabled()) {
            searchParams.set("debug", "true");
        } else {
            searchParams.delete("debug");
        }

        const url = `${window.location.pathname}?${searchParams}`;
        window.history.replaceState("", "", url);
        window.location.reload();
    });

    const toolbar = new CollectionToolbar(CollectionEngine.container);

    toolbar.insertSelect.addEventListener("change", () => {
        toolbar.insertField.value = toolbar.insertSelect.value;
        toolbar.insertSelect.value = "";
    });

    if (!isCollection(CollectionEngine)) {
        return;
    }

    addReturnSubmit(toolbar.insertField, "ALPHANUM+", () =>
        CollectionEngine.submit(CollectionEngine.insert, toolbar.insertField)
    );

    toolbar.insertSubmit.addEventListener("click", () => {
        CollectionEngine.submit(CollectionEngine.insert, toolbar.insertField);
    });

    addReturnSubmit(toolbar.findField, "ALPHANUM", () =>
        CollectionEngine.submit(CollectionEngine.find, toolbar.findField)
    );

    toolbar.findSubmit.addEventListener("click", () =>
        CollectionEngine.submit(CollectionEngine.find, toolbar.findField)
    );

    addReturnSubmit(toolbar.deleteField, "ALPHANUM", () =>
        CollectionEngine.submit(CollectionEngine.delete, toolbar.deleteField)
    );

    toolbar.deleteSubmit.addEventListener("click", () =>
        CollectionEngine.submit(CollectionEngine.delete, toolbar.deleteField)
    );

    toolbar.printSubmit.addEventListener("click", () =>
        CollectionEngine.submit(CollectionEngine.print, toolbar.printSubmit)
    );

    toolbar.clearSubmit.addEventListener("click", () =>
        CollectionEngine.confirmResetAll()
    );
    
}
