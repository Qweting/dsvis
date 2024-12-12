
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
/* exported initialiseCollections, CollectionEngine */
///////////////////////////////////////////////////////////////////////////////

let CollectionEngine = null;

function initialiseCollections(containerID) {
    const algoSelector = document.querySelector(`${containerID} .algorithmSelector`);
    algoSelector.addEventListener("change", () => {
        if (algoSelector.value) {
            const params = {algorithm: algoSelector.value};
            if (CollectionEngine.DEBUG) params.debug = CollectionEngine.DEBUG;
            const url = `${window.location.pathname}?${new URLSearchParams(params)}`;
            window.history.replaceState("", "", url);
        }
        window.location.reload();
    });

    let algoClass = new URL(window.location).searchParams.get("algorithm");
    if (!(algoClass && /^[\w.]+$/.test(algoClass) && algoClass in DS))
        algoClass = "";
    algoSelector.value = algoClass;
    const Collection = algoClass ? DS[algoClass] : DS.Engine;
    CollectionEngine = new Collection(containerID);
    CollectionEngine.initialise();

    const container = CollectionEngine.Container;
    const tools = CollectionEngine.Toolbar;
    tools.insertSelect = container.querySelector(".insertSelect");
    tools.insertField = container.querySelector(".insertField");
    tools.insertSubmit = container.querySelector(".insertSubmit");
    tools.findField = container.querySelector(".findField");
    tools.findSubmit = container.querySelector(".findSubmit");
    tools.deleteField = container.querySelector(".deleteField");
    tools.deleteSubmit = container.querySelector(".deleteSubmit");
    tools.printSubmit = container.querySelector(".printSubmit");
    tools.clearSubmit = container.querySelector(".clearSubmit");

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    DS.addReturnSubmit(tools.insertField, "ALPHANUM+", () => CollectionEngine.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => CollectionEngine.submit("insert", tools.insertField));
    DS.addReturnSubmit(tools.findField, "ALPHANUM", () => CollectionEngine.submit("find", tools.findField));
    tools.findSubmit.addEventListener("click", () => CollectionEngine.submit("find", tools.findField));
    DS.addReturnSubmit(tools.deleteField, "ALPHANUM", () => CollectionEngine.submit("delete", tools.deleteField));
    tools.deleteSubmit.addEventListener("click", () => CollectionEngine.submit("delete", tools.deleteField));
    tools.printSubmit.addEventListener("click", () => CollectionEngine.submit("print"));
    tools.clearSubmit.addEventListener("click", () => CollectionEngine.confirmResetAll());
}
