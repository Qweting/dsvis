
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

DS.SplayTree = class SplayTree extends DS.BST {

    async find(value) {
        const found = await super.find(value);
        if (found?.node) {
            await this.splayUp(found.node);
        }
    }

    async insertOne(value) {
        const result = await super.insertOne(value);
        if (result?.node) {
            if (!result.success) await DS.pause(`Node ${result.node} already exists`);
            await this.splayUp(result.node);
        }
    }

    async delete(value) {
        await this.find(value);
        if (value !== this.treeRoot.getText()) {
            await DS.pause(`Node ${value} doesn't exist`);
            return;
        }

        this.treeRoot.setHighlight(true);
        await DS.pause("Remove root, leaving left and right trees");
        if (!(this.treeRoot.getLeft() && this.treeRoot.getRight())) {
            const direction = this.treeRoot.getLeft() ? "left" : "right";
            const child = this.treeRoot.getLeft() || this.treeRoot.getRight();
            const newRoot = child.setHighlight(true);
            await DS.pause(`No right tree, make ${direction} tree the root`);
            this.treeRoot.remove();
            this.treeRoot = newRoot;
            this.resizeTree();
            await DS.pause();
            return;
        }

        const right = this.treeRoot.getRight();
        const left = this.treeRoot.getLeft();
        this.treeRoot.remove();
        await DS.pause("Splay largest element in left tree to root");

        let largestLeft = left;
        largestLeft.setHighlight(true);
        await DS.pause();
        if (largestLeft.getRight()) {
            while (largestLeft.getRight()) {
                largestLeft.setHighlight(false);
                largestLeft = largestLeft.getRight();
                largestLeft.setHighlight(true);
                await DS.pause();
            }
        }
        largestLeft.setHighlight(false);
        await this.splayUp(largestLeft);
        await DS.pause("Left tree now has no right subtree, connect left and right trees");
        largestLeft.setHighlight(true);
        await DS.pause();
        largestLeft.setHighlight(false);
        largestLeft.setRight(right);
        this.treeRoot = largestLeft;
        this.resizeTree();
        await DS.pause();
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Splay a node to the root of the tree

    async splayUp(node) {
        if (node === this.treeRoot) return;
        node.setHighlight(true);
        await DS.pause(`Now splaying ${node} up to the root`);
        node.setHighlight(false);
        while (node?.getParent()) {
            const parent = node.getParent();
            const left = node.isLeftChild() ? "left" : "right";
            const right = left === "left" ? "right" : "left";
            if (!parent?.getParent()) {
                node = await this.singleRotate(right, parent);
            } else if (parent.isChild(right)) {
                node = await this.doubleRotate(left, parent.getParent());
                // this.splayHelper(node);
            } else {
                // node = await this.singleRotate(right, parent);
                node = await this.zigZig(right, parent.getParent());
                // this.splayHelper(node);
            }
        }
    }

    async splayHelper(node) {
        const parent = node.getParent();
        if (!parent) return;
        const left = node.isLeftChild() ? "left" : "right";
        const right = left === "left" ? "right" : "left";
        if (!parent?.getParent()) {
            this.singleRotate(left, parent);
        } else if (parent.isChild(right)) {
            this.doubleRotate(left, parent.getParent());
            this.splayHelper(node);
        } else {
            this.zigZig(right, parent.getParent());
            this.splayHelper(node);
        }
    }

    async zigZig(left, node) {
        // Note: 'left' and 'right' are variables that can have values "left" or "right"!
        const right = left === "left" ? "right" : "left";
        const child = node.getChild(right);
        await DS.pause(`Zig-zig: Rotate ${node} ${left}, then rotate ${child} ${left}`);
        await this.singleRotate(left, node);
        return await this.singleRotate(left, child);
    }

};

