import { addReturnSubmit, Engine } from "./engine";
import { AVL } from "./trees/AVL";
import { BST } from "./trees/BST";
import { BTree } from "./trees/BTree";
import { RedBlack } from "./trees/RedBlack";
import { SplayTree } from "./trees/SplayTree";

const COLLECTIONS = {
    BST: BST,
    AVL: AVL,
    RedBlack: RedBlack,
    SplayTree: SplayTree,
    BTree: BTree,
} as const;

type CollectionToolbarItems = {
    insertSelect: HTMLSelectElement;
    insertField: HTMLInputElement;
    insertSubmit: HTMLInputElement;
    findField: HTMLInputElement;
    findSubmit: HTMLInputElement;
    deleteField: HTMLInputElement;
    deleteSubmit: HTMLInputElement;
    printSubmit: HTMLInputElement;
    clearSubmit: HTMLInputElement;
};

initialiseCollections("#collectionsContainer");

function initialiseCollections(containerID: string) {
    const algoSelector = document.querySelector<HTMLSelectElement>(
        `${containerID} select.algorithmSelector`
    );

    if (!algoSelector) {
        throw new Error("Could not find algo selector");
    }

    let algo = new URL(window.location.href).searchParams.get("algorithm");
    if (!(algo && /^[\w.]+$/.test(algo) && algo in COLLECTIONS)) {
        algo = "";
    }
    const algoClass = algo as keyof typeof COLLECTIONS | "";
    algoSelector.value = algo;

    const Collection = algoClass ? COLLECTIONS[algoClass] : Engine;
    const CollectionEngine = new Collection(containerID);
    CollectionEngine.initialise();

    algoSelector.addEventListener("change", () => {
        const searchParams = new URLSearchParams();

        if (algoSelector.value in COLLECTIONS) {
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

    const toolbar = getCollectionsToolbar(CollectionEngine.container);

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

function getCollectionsToolbar(container: HTMLElement) {
    const insertSelect = container.querySelector<HTMLSelectElement>(
        "select.insertSelect"
    );
    const insertField =
        container.querySelector<HTMLInputElement>("input.insertField");
    const insertSubmit =
        container.querySelector<HTMLInputElement>("input.insertSubmit");
    const findField =
        container.querySelector<HTMLInputElement>("input.findField");
    const findSubmit =
        container.querySelector<HTMLInputElement>("input.findSubmit");
    const deleteField =
        container.querySelector<HTMLInputElement>("input.deleteField");
    const deleteSubmit =
        container.querySelector<HTMLInputElement>("input.deleteSubmit");
    const printSubmit =
        container.querySelector<HTMLInputElement>("input.printSubmit");
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
    if (!findField) {
        throw new Error("Missing find field");
    }
    if (!findSubmit) {
        throw new Error("Missing find submit");
    }
    if (!deleteField) {
        throw new Error("Missing delete field");
    }
    if (!deleteSubmit) {
        throw new Error("Missing delete submit");
    }
    if (!printSubmit) {
        throw new Error("Missing print submit");
    }
    if (!clearSubmit) {
        throw new Error("Missing clear submit");
    }

    return {
        insertSelect,
        insertField,
        insertSubmit,
        findField,
        findSubmit,
        deleteField,
        deleteSubmit,
        printSubmit,
        clearSubmit,
    };
}
