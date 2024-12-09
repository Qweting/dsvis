
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

function initialiseCollections(containerID) {
    const engine = new DS.Engine();

    const algoSelector = document.querySelector(containerID + " .algorithmSelector");
    const algoClass = new URL(window.location).searchParams.get("algorithm");
    let algorithm = null;
    if (algoClass && /^[\w.]+$/.test(algoClass) && algoClass in DS) {
        algoSelector.value = algoClass;
        algorithm = new DS[algoClass](engine);
    } else {
        algoSelector.value = "";
        window.history.replaceState("", "", window.location.pathname);
    }

    algoSelector.addEventListener("change", () => {
        const algoClass = algoSelector.value;
        if (algoClass) {
            const params = {algorithm: algoClass};
            if (engine.$DEBUG) params.debug = engine.$DEBUG;
            const url = `${window.location.pathname}?${new URLSearchParams(params)}`;
            window.history.replaceState("", "", url);
        }
        window.location.reload();
    });

    engine.initialise(containerID, algorithm);

    const container = engine.$Container;
    const tools = engine.$Toolbar;
    tools.algorithmControls = container.querySelector(".algorithmControls");
    tools.insertSelect = container.querySelector(".insertSelect");
    tools.insertField = container.querySelector(".insertField");
    tools.insertSubmit = container.querySelector(".insertSubmit");
    tools.findField = container.querySelector(".findField");
    tools.findSubmit = container.querySelector(".findSubmit");
    tools.deleteField = container.querySelector(".deleteField");
    tools.deleteSubmit = container.querySelector(".deleteSubmit");
    tools.printSubmit = container.querySelector(".printSubmit");
    tools.clearSubmit = container.querySelector(".clearSubmit");
    tools.showNullNodes = container.querySelector(".showNullNodes");

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    DS.addReturnSubmit(tools.insertField, "ALPHANUM+", () => engine.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => engine.submit("insert", tools.insertField));
    DS.addReturnSubmit(tools.findField, "ALPHANUM", () => engine.submit("find", tools.findField));
    tools.findSubmit.addEventListener("click", () => engine.submit("find", tools.findField));
    DS.addReturnSubmit(tools.deleteField, "ALPHANUM", () => engine.submit("delete", tools.deleteField));
    tools.deleteSubmit.addEventListener("click", () => engine.submit("delete", tools.deleteField));
    tools.printSubmit.addEventListener("click", () => engine.submit("print"));
    tools.clearSubmit.addEventListener("click", () => engine.confirmResetAll());

    engine.$Current?.initToolbar?.();
    engine.setRunning(true);
}
