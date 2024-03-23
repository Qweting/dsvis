
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

DS.BST = class BST {
    constructor() {
        this.reset();
    }

    reset() {
        this.treeRoot = null;
    }

    initToolbar() {
        DS.$Toolbar.generalControls.insertAdjacentHTML("beforeend", '<label><input id="showNullNodes" type="checkbox"/> Show null nodes</label>');
        DS.$Toolbar.showNullNodes = document.getElementById("showNullNodes");
        DS.$Toolbar.showNullNodes.addEventListener("change", () => this.toggleNullNodes());
        this.toggleNullNodes(true);
    }

    toggleNullNodes = function(show) {
        if (show == null) show = DS.$Toolbar.showNullNodes.checked;
        DS.$Toolbar.showNullNodes.checked = show;
        if (show) DS.SVG().addClass("shownullnodes");
        else DS.SVG().removeClass("shownullnodes");
    };

    newNode(text) {
        return DS.SVG().binaryNode(text, DS.getStartX(), DS.getStartY());
    }

    resizeTree(animate = true) {
        this.treeRoot?.resize(DS.getRootX(), DS.getRootY(), animate);
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
    }

    async find(value) {
        if (!value) return;
        if (!this.treeRoot) {
            await DS.pause("Tree is empty");
            return;
        }
        await DS.pause(`Searching for ${value}`);
        const found = await this.findHelper(value);
        found.node.setHighlight(true);
        const response = found.success ? `Found ${value}` : `Did not find ${value}`;
        await DS.pause(response);
        found.node.setHighlight(false);
    }

    async findHelper(value) {
        let parent = null;
        let node = this.treeRoot;
        const pointer = DS.SVG().highlightCircle(node.cx(), node.cy());
        while (node) {
            node.setHighlight(true);
            const cmp = DS.compare(value, node.getText());
            if (cmp === 0) {
                pointer.remove();
                node.setHighlight(false);
                return {success: true, node: node};
            }
            const direction = cmp < 0 ? "left" : "right";
            node.setChildHighlight(direction, true);
            parent = node;
            node = parent.getChild(direction);
            if (node) pointer.setCenter(node.cx(), node.cy(), true);
            await DS.pause(`Look into ${direction} child`);
            parent.setChildHighlight(direction, false);
        }
        pointer.remove();
        return {success: false, node: parent};
    }

    async insertOne(value) {
        if (!value) return null;
        if (!this.treeRoot) {
            this.treeRoot = this.newNode(value);
            await DS.pause(`Create a new tree root ${value}`);
            this.resizeTree();
            await DS.pause();
            return this.treeRoot;
        }
        await DS.pause(`Searching for node to insert ${value}`);
        const found = await this.findHelper(value);
        if (found.success) {
            found.node.setHighlight(true);
            await DS.pause(`There is already a node ${found.node}`);
            found.node.setHighlight(false);
            return null;
        }
        const child = this.newNode(value);
        const cmp = DS.compare(value, found.node.getText());
        const direction = cmp < 0 ? "left" : "right";
        found.node.setChild(direction, child);
        child.setHighlight(true);
        found.node.setChildHighlight(direction, true);
        await DS.pause(`Insert ${value} as ${direction} child`);
        found.node.setChildHighlight(direction, false);
        child.setHighlight(false);
        this.resizeTree();
        await DS.pause();
        return child;
    }

    async delete(value) {
        if (!value) return null;
        if (!this.treeRoot) {
            await DS.pause("Tree is empty");
            return null;
        }
        await DS.pause(`Searching for node to delete ${value}`);
        const found = await this.findHelper(value);
        if (!found.success) {
            found.node.setHighlight(true);
            await DS.pause(`There is no node ${value}`);
            found.node.setHighlight(false);
            return null;
        }
        found.node.setHighlight(true);
        await DS.pause(`Found node ${value} to delete`);
        return await this.deleteHelper(found.node);
    }

    async deleteHelper(node) {
        if (!(node.getLeft() && node.getRight())) {
            return await this.deleteNode(node);
        }
        const pointer = DS.SVG().highlightCircle(node.cx(), node.cy());
        node.setHighlight(false);
        node.addClass("marked");
        await DS.pause(`Finding the predecessor node of ${node}`);

        let predecessor = node.getLeft();
        predecessor.setParentHighlight(true);
        pointer.setCenter(predecessor.cx(), predecessor.cy(), true);
        await DS.pause();
        while (predecessor.getRight()) {
            predecessor.setParentHighlight(false);
            predecessor = predecessor.getRight();
            predecessor.setParentHighlight(true);
            pointer.setCenter(predecessor.cx(), predecessor.cy(), true);
            await DS.pause();
        }
        predecessor.setParentHighlight(false);
        predecessor.setHighlight(true);
        pointer.remove();
        const newText = predecessor.getText();
        const moving = DS.SVG().textCircle(newText, predecessor.cx(), predecessor.cy());
        moving.addClass("unfilled");
        moving.setHighlight(true);
        await DS.pause(`Replace the value of ${node} with ${predecessor}`);
        pointer.setCenter(node.cx(), node.cy(), true);
        moving.setCenter(node.cx(), node.cy(), true);
        node.setText("");
        await DS.pause();
        node.setText(newText);
        moving.remove();
        node.removeClass("marked");
        await DS.pause(`Now delete the predecessor ${predecessor}`);
        return await this.deleteNode(predecessor);
    }

    async deleteNode(node) {
        // The node will NOT have two children - this has been taken care of by deleteHelper
        const child = node.getLeft() || node.getRight();
        const parent = node.getParent();
        if (!parent) {
            if (!child) {
                this.treeRoot = null;
                await DS.pause(`Remove the root node ${node}`);
            } else {
                this.treeRoot = child;
                await DS.pause(`Make the child ${child} the new root,\nand remove node ${node}`);
            }
            node.remove();
            this.resizeTree();
            await DS.pause();
            return {direction: null, parent: null};
        }

        const direction = parent.getLeft() === node ? "left" : "right";
        if (child) {
            node.setHighlight(false);
            if (child === parent.getLeft()?.getLeft()) node.dmoveCenter(-node.getSize(), -node.getSize() / 2, true);
            if (child === parent.getRight()?.getRight()) node.dmoveCenter(node.getSize(), -node.getSize() / 2, true);
            parent.setChild(direction, child);
            child.setHighlight(true);
            parent.setChildHighlight(direction, true);
            await DS.pause(`Redirect parent ${parent} to child ${child}`);
            parent.setChildHighlight(direction, false);
            child.setHighlight(false);
            node.setHighlight(true);
            await DS.pause(`Remove node ${node}`);
        } else {
            await DS.pause(`Remove leaf node ${node}`);
        }
        node.remove();
        this.resizeTree();
        await DS.pause();
        return {direction: direction, parent: parent};
    }

    async print() {
        if (!this.treeRoot) {
            await DS.pause("Tree is empty");
            return;
        }
        const pointer = DS.SVG().highlightCircle(DS.getStartX(), DS.getStartY());
        const printed = [];
        printed.push(DS.SVG().text("Printed nodes: ").x(DS.$Info.x).cy(DS.$SvgHeight - 80));
        await this.printHelper(this.treeRoot, pointer, printed);
        pointer.remove();
        await DS.pause();
        for (const lbl of printed) lbl.remove();
        await DS.pause();
    }

    async printHelper(node, pointer, printed) {
        pointer.setCenter(node.cx(), node.cy(), true);
        await DS.pause();
        if (node.getLeft()) {
            await this.printHelper(node.getLeft(), pointer, printed);
            pointer.setCenter(node.cx(), node.cy(), true);
            await DS.pause();
        }
        const lbl = DS.SVG().text(node.getText()).center(node.cx(), node.cy());
        await DS.pause();
        const last = printed[printed.length - 1];
        DS.animate(lbl).x(last.bbox().x2 + 10).cy(last.cy());
        printed.push(lbl);
        await DS.pause();
        if (node.getRight()) {
            await this.printHelper(node.getRight(), pointer, printed);
            pointer.setCenter(node.cx(), node.cy(), true);
            await DS.pause();
        }
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Rotate the tree
    // These are not used by BST, but by self-balancing subclasses
    // The following rotations are implemented:
    //  - Single Rotate: Left and Right (also known as Zig)
    //  - Double Rotate: Left-Right and Right-Left (also known as Zig-Zag)

    async resetHeight(node) {
        // BSTs do not store the height in the nodes, so do nothing
        // This is implemented by, e.g., AVL trees
    }

    async doubleRotate(left, node) {
        // Note: 'left' and 'right' are variables that can have values "left" or "right"!
        const right = left === "left" ? "right" : "left";
        const child = node.getChild(right);
        await DS.pause(`Rotate ${child} ${right}, then rotate ${node} ${left}`);
        await this.singleRotate(right, child);
        return await this.singleRotate(left, node);
    }

    async singleRotate(left, node) {
        // Note: 'left' and 'right' are variables that can have values "left" or "right"!
        // So, if left==="right", then we rotate right.
        const right = left === "left" ? "right" : "left";
        const A = node;
        const B = A.getChild(right);
        const C = B.getChild(left);

        A.setChildHighlight(right, true);
        B.setHighlight(true);
        await DS.pause(`Rotate ${A} ${left}`);

        const parent = A.getParent();
        if (parent) {
            const direction = parent.getLeft() === A ? "left" : "right";
            B.setParent(direction, parent);
        } else {
            this.treeRoot = B;
        }
        A.setChild(right, C);
        B.setChild(left, A);

        B.setChildHighlight(left, true);
        A.setHighlight(true);
        await DS.pause();
        this.resizeTree();
        await DS.pause();

        B.setChildHighlight(left, false);
        A.setHighlight(false);
        await this.resetHeight(A);
        await this.resetHeight(B);
        return B;
    }

};

