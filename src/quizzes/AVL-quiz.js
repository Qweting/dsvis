
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS, SVG */
///////////////////////////////////////////////////////////////////////////////

function initialiseAVLQuiz(containerID) {
    const engine = new DS.Engine();
    const algorithm = new DS.AVLQuiz(this, ["K"]);

    // Overrides
    engine.setIdleTitle = function() {
        const isBST = this.$Current.isBST();
        const unbalanced = this.$Current.isUnbalanced();
        const message = (
            !isBST && unbalanced ? "Tree is not a BST, and it's unbalanced!" :
            !isBST ? "Tree is not a BST!" :
            unbalanced ? "Tree is unbalanced!" :
            "Tree is a correct AVL tree"
        );
        this.$Info.title.text(message);
        this.$Info.body.text("");
    };

    engine.initialise(containerID, algorithm);

    const container = engine.$Container;
    const tools = engine.$Toolbar;
    tools.insertField = container.querySelector(".insertField");
    tools.createLeft = container.querySelector(".createLeft");
    tools.createRight = container.querySelector(".createRight");
    tools.moveParent = container.querySelector(".moveParent");
    tools.moveLeft = container.querySelector(".moveLeft");
    tools.moveRight = container.querySelector(".moveRight");
    tools.rotateLeft = container.querySelector(".rotateLeft");
    tools.rotateRight = container.querySelector(".rotateRight");
    tools.markNode = container.querySelector(".markNode");
    tools.copyToMark = container.querySelector(".copyToMark");
    tools.deleteNode = container.querySelector(".deleteNode");
    tools.restartQuiz = container.querySelector(".restartQuiz");

    DS.addReturnSubmit(tools.insertField, "ALPHANUM");
    tools.createLeft.addEventListener("click", () => engine.submit("insertLeft", tools.insertField));
    tools.createRight.addEventListener("click", () => engine.submit("insertRight", tools.insertField));
    tools.moveParent.addEventListener("click", () => engine.execute("moveParent"));
    tools.moveLeft.addEventListener("click", () => engine.execute("moveChild", ["left"]));
    tools.moveRight.addEventListener("click", () => engine.execute("moveChild", ["right"]));
    tools.rotateLeft.addEventListener("click", () => engine.execute("rotateCurrent", ["left"]));
    tools.rotateRight.addEventListener("click", () => engine.execute("rotateCurrent", ["right"]));
    tools.markNode.addEventListener("click", () => engine.execute("markNode"));
    tools.copyToMark.addEventListener("click", () => engine.execute("copyToMark"));
    tools.deleteNode.addEventListener("click", () => engine.execute("deleteCurrent"));
    tools.restartQuiz.addEventListener("click", () => engine.resetAll());

    engine.$Current?.initToolbar?.();
    engine.setRunning(true);
};




DS.AVLQuiz = class AVLQuiz extends DS.BST {

    async reset() {
        await super.reset();
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
        return this.$DS.SVG().avlNode(text, this.getStartX(), this.getStartY());
    }

    async setCurrent(node, animate) {
        this.current?.setHighlight(false);
        if (animate) {
            const cursor = this.$DS.SVG().highlightCircle(this.current.cx(), this.current.cy());
            cursor.setCenter(node.cx(), node.cy(), animate);
            await this.$DS.pause();
            cursor.remove();
        }
        this.current = node;
        this.current.setHighlight(true);
    }

    async moveParent() {
        const parent = this.current.getParent();
        if (!parent) {
            await this.$DS.pause("The root node doesn't have a parent!");
            return;
        }
        await this.setCurrent(parent, true);
    }

    async moveChild(direction) {
        const child = this.current.getChild(direction);
        if (!child) {
            await this.$DS.pause(`There is no ${direction} child!`);
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

        const moving = this.$DS.SVG().textCircle(this.current.getText(), this.current.cx(), this.current.cy());
        moving.setHighlight(true);
        await this.$DS.pause(`Replace the value of ${this.mark} with ${this.current}`);
        moving.setCenter(this.mark.cx(), this.mark.cy(), true);
        await this.$DS.pause();
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
            await this.$DS.pause(`There is already a ${direction} child!`);
            return;
        }
        const child = this.newNode(value);
        this.current.setChild(direction, child);
        child.setHighlight(true);
        this.current.setChildHighlight(direction, true);
        await this.$DS.pause(`Insert ${value} as ${direction} child`);
        this.current.setChildHighlight(direction, false);
        // this.cursor.hide();
        this.resizeTree();
        await this.$DS.pause();
        child.setHighlight(false);
        await this.setCurrent(child);
        await this.$DS.pause("Updating heights");
        this.updateHeights();
    }

    async deleteCurrent() {
        if (this.current.getLeft() || this.current.getRight()) {
            await this.$DS.pause("Not a leaf node!");
            return;
        }
        const parent = this.current.getParent();
        if (!parent) {
            await this.$DS.pause("Cannot remove the root!");
            return;
        }
        this.current.remove();
        await this.setCurrent(parent, true);
        this.resizeTree();
        await this.$DS.pause("Updating heights");
        this.updateHeights();
    }

    async rotateCurrent(left) {
        const right = left === "left" ? "right" : "left";
        const child = this.current.getChild(right);
        if (!child) {
            await this.$DS.pause(`Cannot rotate ${left}\nNode doesn't have a ${right} child!`);
            return;
        }
        const node = await this.singleRotate(left, this.current);
        await this.setCurrent(node);
        await this.$DS.pause("Updating heights");
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

