import { addReturnSubmit, Engine } from "./engine";
import { CollectionToolbar } from "./toolbars/collection-toolbar";
import { AVL } from "./trees/AVL";
import { BST } from "./trees/BST";
import { BTree } from "./trees/BTree";
import { RedBlack } from "./trees/RedBlack";
import { SplayTree } from "./trees/SplayTree";

const COLLECTIONS_CLASSES = {
    BST: BST,
    AVL: AVL,
    RedBlack: RedBlack,
    SplayTree: SplayTree,
    BTree: BTree,
} as const;

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

        if (CollectionEngine.DEBUG) {
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

    addReturnSubmit(toolbar.insertField, "ALPHANUM+", () =>
        CollectionEngine.submit("insert", toolbar.insertField)
    );
    toolbar.insertSubmit.addEventListener("click", () => {
        CollectionEngine.submit("insert", toolbar.insertField);
    });

    addReturnSubmit(toolbar.findField, "ALPHANUM", () =>
        CollectionEngine.submit("find", toolbar.findField)
    );
    toolbar.findSubmit.addEventListener("click", () =>
        CollectionEngine.submit("find", toolbar.findField)
    );

    addReturnSubmit(toolbar.deleteField, "ALPHANUM", () =>
        CollectionEngine.submit("delete", toolbar.deleteField)
    );
    toolbar.deleteSubmit.addEventListener("click", () =>
        CollectionEngine.submit("delete", toolbar.deleteField)
    );

    toolbar.printSubmit.addEventListener("click", () =>
        CollectionEngine.submit("print", toolbar.printSubmit)
    );

    toolbar.clearSubmit.addEventListener("click", () =>
        CollectionEngine.confirmResetAll()
    );
}
