
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
/* exported initialisePrioQueues, PQEngine */
///////////////////////////////////////////////////////////////////////////////

let PQEngine = null;

function initialisePrioQueues(containerID) {
    const algoSelector = document.querySelector(`${containerID} .algorithmSelector`);
    algoSelector.addEventListener("change", () => {
        if (algoSelector.value) {
            const params = {algorithm: algoSelector.value};
            if (PQEngine.DEBUG) params.debug = PQEngine.DEBUG;
            const url = `${window.location.pathname}?${new URLSearchParams(params)}`;
            window.history.replaceState("", "", url);
        }
        window.location.reload();
    });

    let algoClass = new URL(window.location).searchParams.get("algorithm");
    if (!(algoClass && /^[\w.]+$/.test(algoClass) && algoClass in DSVis))
        algoClass = "";
    algoSelector.value = algoClass;
    const PrioQueue = algoClass ? DSVis[algoClass] : DSVis.Engine;
    PQEngine = new PrioQueue(containerID);
    PQEngine.initialise();

    const container = PQEngine.Container;
    const tools = PQEngine.Toolbar;
    tools.insertSelect = container.querySelector(".insertSelect");
    tools.insertField = container.querySelector(".insertField");
    tools.insertSubmit = container.querySelector(".insertSubmit");
    tools.sortSubmit = container.querySelector(".sortSubmit");
    tools.clearSubmit = container.querySelector(".clearSubmit");

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    DSVis.addReturnSubmit(tools.insertField, "ALPHANUM+", () => PQEngine.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => PQEngine.submit("insert", tools.insertField));
    tools.sortSubmit.addEventListener("click", () => PQEngine.submit("sort", "Sorting the array"));
    tools.clearSubmit.addEventListener("click", () => PQEngine.confirmResetAll());
}
