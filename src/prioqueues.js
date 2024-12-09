
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
/* exported initialisePrioQueues */
///////////////////////////////////////////////////////////////////////////////

function initialisePrioQueues(containerID) {
    const engine = new DS.Engine();

    const algoSelector = document.querySelector(`${containerID} .algorithmSelector`);
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
        if (algoSelector.value) {
            const params = {algorithm: algoSelector.value};
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
    tools.deleteSubmit = container.querySelector(".deleteSubmit");
    tools.clearSubmit = container.querySelector(".clearSubmit");

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    DS.addReturnSubmit(tools.insertField, "ALPHANUM+", () => engine.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => engine.submit("insert", tools.insertField));
    tools.deleteSubmit.addEventListener("click", () => engine.submit("deleteMin", tools.deleteField));
    tools.clearSubmit.addEventListener("click", () => engine.confirmResetAll());

    engine.$Current?.initToolbar?.();
    engine.setRunning(true);
}
