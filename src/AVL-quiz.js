
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS, SVG */
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

// Override:
DS.initAlgorithm = function() {
    DS.$Current = new DS.AVLQuiz();
};


DS.initToolbar = function() {
    const tools = DS.$Toolbar;
    // General toolbar
    tools.generalControls = document.getElementById("generalControls");
    tools.stepForward = document.getElementById("stepForward");
    tools.stepBackward = document.getElementById("stepBackward");
    tools.toggleRunner = document.getElementById("toggleRunner");
    tools.fastForward = document.getElementById("fastForward");
    tools.fastBackward = document.getElementById("fastBackward");
    tools.animationSpeed = document.getElementById("animationSpeed");
    tools.nodeSize = document.getElementById("nodeSize");

    // Algorithm toolbar
    tools.insertField = document.getElementById("insertField");
    tools.createLeft = document.getElementById("createLeft");
    tools.createRight = document.getElementById("createRight");
    tools.moveParent = document.getElementById("moveParent");
    tools.moveLeft = document.getElementById("moveLeft");
    tools.moveRight = document.getElementById("moveRight");
    tools.rotateLeft = document.getElementById("rotateLeft");
    tools.rotateRight = document.getElementById("rotateRight");
    tools.markNode = document.getElementById("markNode");
    tools.copyToMark = document.getElementById("copyToMark");
    tools.deleteNode = document.getElementById("deleteNode");
    tools.restartQuiz = document.getElementById("restartQuiz");

    DS.addReturnSubmit(tools.insertField, "ALPHANUM");
    tools.createLeft.addEventListener("click", () => DS.submit("insertLeft", tools.insertField));
    tools.createRight.addEventListener("click", () => DS.submit("insertRight", tools.insertField));
    tools.moveParent.addEventListener("click", () => DS.execute("moveParent"));
    tools.moveLeft.addEventListener("click", () => DS.execute("moveChild", ["left"]));
    tools.moveRight.addEventListener("click", () => DS.execute("moveChild", ["right"]));
    tools.rotateLeft.addEventListener("click", () => DS.execute("rotateCurrent", ["left"]));
    tools.rotateRight.addEventListener("click", () => DS.execute("rotateCurrent", ["right"]));
    tools.markNode.addEventListener("click", () => DS.execute("markNode"));
    tools.copyToMark.addEventListener("click", () => DS.execute("copyToMark"));
    tools.deleteNode.addEventListener("click", () => DS.execute("deleteCurrent"));
    tools.restartQuiz.addEventListener("click", () => DS.restartQuiz());

    DS.setRunning(true);
    DS.$Current.initToolbar?.();
};


DS.restartQuiz = function() {
    DS.reset();
    DS.$Actions = [];
};

DS.toggleNullNodes = function() {
    const show = DS.$Toolbar.showNullNodes.checked;
    if (show) DS.SVG().addClass("shownullnodes");
    else DS.SVG().removeClass("shownullnodes");
};


DS.setIdleTitle = function() {
    const isBST = DS.$Current.isBST();
    const unbalanced = DS.$Current.isUnbalanced();
    const message = (
        !isBST && unbalanced ? "Tree is not a BST, and it's unbalanced!" :
        !isBST ? "Tree is not a BST!" :
        unbalanced ? "Tree is unbalanced!" :
        "Tree is a correct AVL tree"
    );
    DS.$Info.title.text(message);
    DS.$Info.body.text("");
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

DS.$Cookies.nodeSize = {
    getCookie: (value) => DS.$Toolbar.nodeSize.value = value,
    setCookie: () => DS.getSizeClass(),
};


DS.AVLQuiz = class AVLQuiz extends DS.BST {

    reset() {
        super.reset();
        this.treeRoot = this.newNode("K");
        this.resizeTree(false);
        this.updateHeights();
        this.setCurrent(this.treeRoot);
        this.mark = null;
    }

    getHeight(node) {
        return node ? node.getHeight() : 0;
    }

    isBST() {
        try {
            this._validateBST(this.treeRoot, Number.MIN_SAFE_INTEGER);
        } catch (error) {
            return false;
        }
        return true;
    }

    _validateBST(node, min) {
        const left = node.getLeft();
        if (left) min = this._validateBST(left, min);
        if (DS.compare(min, node.getText()) >= 0) {
            throw new Error("Order mismatch");
        }
        min = node.getText();
        const right = node.getRight();
        if (right) min = this._validateBST(right, min);
        return min;
    }

    isUnbalanced() {
        for (const node of SVG.find("g")) {
            if (node instanceof SVG.AVLNode) {
                if (node.getHeightHighlight()) return true;
            }
        }
        return false;
    }

    newNode(text) {
        return DS.SVG().avlNode(text, DS.getStartX(), DS.getStartY());
    }

    async setCurrent(node, animate) {
        this.current?.setHighlight(false);
        if (animate) {
            const cursor = DS.SVG().highlightCircle(this.current.cx(), this.current.cy());
            cursor.setCenter(node.cx(), node.cy(), animate);
            await DS.pause();
            cursor.remove();
        }
        this.current = node;
        this.current.setHighlight(true);
    }

    async moveParent() {
        const parent = this.current.getParent();
        if (!parent) {
            await DS.pause("The root node doesn't have a parent!");
            return;
        }
        await this.setCurrent(parent, true);
    }

    async moveChild(direction) {
        const child = this.current.getChild(direction);
        if (!child) {
            await DS.pause(`There is no ${direction} child!`);
            return;
        }
        await this.setCurrent(child, true);
    }

    async markNode() {
        if (this.mark) {
            this.mark.removeClass("marked");
            if (this.mark === this.current) {
                this.mark = null;
                return;
            }
        }
        this.mark = this.current;
        this.mark.addClass("marked");
    }

    async copyToMark() {
        if (!this.mark) return;
        if (this.mark === this.current) return;

        const moving = DS.SVG().textCircle(this.current.getText(), this.current.cx(), this.current.cy());
        moving.setHighlight(true);
        await DS.pause(`Replace the value of ${this.mark} with ${this.current}`);
        moving.setCenter(this.mark.cx(), this.mark.cy(), true);
        await DS.pause();
        this.mark.setText(this.current.getText());
        moving.remove();
    }

    async insertLeft(value) {
        await this.insertBelow("left", value);
    }

    async insertRight(value) {
        await this.insertBelow("right", value);
    }

    async insertBelow(direction, value) {
        if (this.current.getChild(direction)) {
            await DS.pause(`There is already a ${direction} child!`);
            return;
        }
        const child = this.newNode(value);
        this.current.setChild(direction, child);
        child.setHighlight(true);
        this.current.setChildHighlight(direction, true);
        await DS.pause(`Insert ${value} as ${direction} child`);
        this.current.setChildHighlight(direction, false);
        // this.cursor.hide();
        this.resizeTree();
        await DS.pause();
        child.setHighlight(false);
        await this.setCurrent(child);
        await DS.pause("Updating heights");
        this.updateHeights();
    }

    async deleteCurrent() {
        if (this.current.getLeft() || this.current.getRight()) {
            await DS.pause("Not a leaf node!");
            return;
        }
        const parent = this.current.getParent();
        if (!parent) {
            await DS.pause("Cannot remove the root!");
            return;
        }
        this.current.remove();
        await this.setCurrent(parent, true);
        this.resizeTree();
        await DS.pause("Updating heights");
        this.updateHeights();
    }

    async rotateCurrent(left) {
        const right = left === "left" ? "right" : "left";
        const child = this.current.getChild(right);
        if (!child) {
            await DS.pause(`Cannot rotate ${left}\nNode doesn't have a ${right} child!`);
            return;
        }
        const node = await this.singleRotate(left, this.current);
        await this.setCurrent(node);
        await DS.pause("Updating heights");
        this.updateHeights();
    }

    updateHeights() {
        this.updateHeightsHelper(this.treeRoot);
    }

    updateHeightsHelper(node) {
        if (!node) return 0;
        const leftHeight = this.updateHeightsHelper(node.getLeft());
        const rightHeight = this.updateHeightsHelper(node.getRight());
        const height = 1 + Math.max(leftHeight, rightHeight);
        node.setHeight(height);
        const unbalanced = Math.abs(leftHeight - rightHeight) > 1;
        node.setHeightHighlight(unbalanced);
        return height;
    }
};

