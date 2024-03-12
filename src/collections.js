
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////


DS.$Defaults.sizeClass = "medium";
DS.$NodeSize = {small: 30, medium: 40, large: 60};

DS.getSizeClass = () => DS.$Toolbar.nodeSize?.value.toLowerCase() || DS.$Defaults.sizeClass;
DS.getNodeSize = () => DS.$NodeSize[DS.getSizeClass()];
DS.getStrokeWidth = () => DS.getNodeSize() / 12;
DS.getStartX = () => DS.$Info.x + DS.getNodeSize() / 2;
DS.getStartY = () => DS.$Info.y * 4;
DS.getRootX = () => DS.$SvgWidth / 2;
DS.getRootY = () => DS.$Info.y + DS.getNodeSize() / 2;
DS.getSpacingX = () => DS.getNodeSize();
DS.getSpacingY = () => DS.getNodeSize();


///////////////////////////////////////////////////////////////////////////////
// Inititalisation

DS.initialise = function(svgID) {
    DS.initEngine(svgID);
    DS.initToolbar();
    DS.initAlgorithm();
};


DS.initToolbar = function () {
    const tools = DS.$Toolbar;
    // General toolbar
    tools.stepForward = document.getElementById("stepForward");
    tools.stepBackward = document.getElementById("stepBackward");
    tools.toggleRunner = document.getElementById("toggleRunner");
    tools.fastForward = document.getElementById("fastForward");
    tools.fastBackward = document.getElementById("fastBackward");
    tools.animationSpeed = document.getElementById("animationSpeed");
    tools.nodeSize = document.getElementById("nodeSize");

    // Algorithm toolbar
    tools.algorithmControls = document.getElementById("algorithmControls");
    tools.insertSelect = document.getElementById("insertSelect");
    tools.insertField = document.getElementById("insertField");
    tools.insertSubmit = document.getElementById("insertSubmit");
    tools.findField = document.getElementById("findField");
    tools.findSubmit = document.getElementById("findSubmit");
    tools.deleteField = document.getElementById("deleteField");
    tools.deleteSubmit = document.getElementById("deleteSubmit");
    tools.printTree = document.getElementById("printTree");

    tools.testRotate = document.getElementById("testRotate");

    tools.insertSelect.addEventListener("change", () => {
        tools.insertField.value = tools.insertSelect.value;
        tools.insertSelect.value = "";
    });
    DS.addReturnSubmit(tools.insertField, "ALPHANUM+", () => DS.submit("insert", tools.insertField));
    tools.insertSubmit.addEventListener("click", () => DS.submit("insert", tools.insertField));
    DS.addReturnSubmit(tools.findField, "ALPHANUM", () => DS.submit("find", tools.findField));
    tools.findSubmit.addEventListener("click", () => DS.submit("find", tools.findField));
    DS.addReturnSubmit(tools.deleteField, "ALPHANUM", () => DS.submit("delete", tools.deleteField));
    tools.deleteSubmit.addEventListener("click", () => DS.submit("delete", tools.deleteField));
    tools.printTree.addEventListener("click", () => DS.submit("print"));

    tools.testRotate.addEventListener("click", () => DS.submit("testRotate"));
};


DS.reset = function () {
    DS.clearCanvas();
    if (DS.$Current) DS.$Current.reset();
    DS.resetListeners();
};


DS.$IdleListeners.nodeSize = {
    type: "change",
    condition: () => true,
    handler: () => {
        DS.setRunning(false);
        if (DS.$Actions.length > 0) {
            const action = DS.$Actions.pop();
            DS.execute(action.oper, action.args, action.nsteps);
        } else {
            DS.reset();
        }
    },
};

DS.$AsyncListeners.nodeSize = {
    type: "change",
    handler: (resolve, reject) => reject({until: DS.$CurrentStep}),
};

