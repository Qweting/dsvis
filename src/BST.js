
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

    newNode(text) {
        return DS.SVG().binaryNode(text, DS.getStartX(), DS.getStartY());
    }

    resizeTree() {
        this.treeRoot?.resize(DS.getRootX(), DS.getRootY());
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
    }

    async find(value) {
        value = value.trim().toUpperCase();
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
        value = value.trim().toUpperCase();
        if (!value) return;
        if (!this.treeRoot) {
            this.treeRoot = this.newNode(value);
            await DS.pause(`Create a new tree root ${value}`);
            this.resizeTree();
            await DS.pause();
            return;
        }

        await DS.pause(`Searching for node to insert ${value}`);
        const found = await this.findHelper(value);
        if (found.success) {
            found.node.setHighlight(true);
            await DS.pause(`There is already a node ${found.node}`);
            found.node.setHighlight(false);
            return;
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
    }


    async delete(value) {
        value = value.trim().toUpperCase();
        if (!value) return;
        if (!this.treeRoot) {
            await DS.pause("Tree is empty");
            return;
        }

        await DS.pause(`Searching for node to delete ${value}`);
        const found = await this.findHelper(value);
        if (!found.success) {
            found.node.setHighlight(true);
            await DS.pause(`There is no node ${value}`);
            found.node.setHighlight(false);
            return;
        }

        found.node.setHighlight(true);
        await DS.pause(`Found node ${value} to delete`);
        await this.deleteHelper(found.node);
    }

    async deleteHelper(node) {
        if (!(node.getLeft() && node.getRight())) {
            const child = node.getLeft() || node.getRight();
            const parent = node.getParent();
            if (parent && child) {
                node.setHighlight(false);
                if (child === parent.getLeft()?.getLeft()) node.dmoveCenter(-node.getSize(), -node.getSize() / 2, true);
                if (child === parent.getRight()?.getRight()) node.dmoveCenter(node.getSize(), -node.getSize() / 2, true);
                const direction = parent.getLeft() === node ? "left" : "right";
                parent.setChild(direction, child);
                child.setHighlight(true);
                parent.setChildHighlight(direction, true);
                await DS.pause(`Redirect parent ${parent} to child ${child}`);
                parent.setChildHighlight(direction, false);
                child.setHighlight(false);
                node.setHighlight(true);
                await DS.pause(`Remove node ${node}`);
            } else if (parent && !child) {
                await DS.pause(`Remove leaf node ${node}`);
            } else if (!child) {
                this.treeRoot = null;
                await DS.pause(`Remove the root node ${node}`);
            } else {
                this.treeRoot = child;
                await DS.pause(`Make the child ${child} the new root,\nand remove node ${node}`);
            }
            node.remove();
            this.resizeTree();
            await DS.pause();
            return;
        }

        const pointer = DS.SVG().highlightCircle(node.cx(), node.cy());
        node.setHighlight(true);
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
        const moving = DS.SVG().textCircle(predecessor.getText(), predecessor.cx(), predecessor.cy());
        moving.setHighlight(true);
        await DS.pause(`Replace the value of ${node} with ${predecessor}`);
        pointer.setCenter(node.cx(), node.cy(), true);
        moving.setCenter(node.cx(), node.cy(), true);
        await DS.pause();
        node.setText(predecessor.getText());
        moving.remove();
        node.setHighlight(false);
        await DS.pause(`Now delete the predecessor ${predecessor}`);
        await this.deleteHelper(predecessor);
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
};

