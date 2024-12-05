
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
            if (!result.success) await DS.pause('insert.exists', result.node);
            await this.splayUp(result.node);
        }
    }

    async delete(value) {
        await this.find(value);
        if (DS.compare(value, this.treeRoot.getText()) !== 0) {
            console.log(value, this.treeRoot.getText())
            await DS.pause('delete.notexists', value);
            return;
        }

        this.treeRoot.setHighlight(true);
        await DS.pause('delete.root');
        if (!(this.treeRoot.getLeft() && this.treeRoot.getRight())) {
            const left = this.treeRoot.getLeft() ? "left" : "right";
            const right = left === "left" ? "right" : "left";
            const child = this.treeRoot.getLeft() || this.treeRoot.getRight();
            const newRoot = child.setHighlight(true);
            await DS.pause('delete.singleChild', right, left);
            this.treeRoot.remove();
            this.treeRoot = newRoot;
            this.resizeTree();
            await DS.pause();
            return;
        }

        const right = this.treeRoot.getRight();
        const left = this.treeRoot.getLeft();
        this.treeRoot.remove();
        await DS.pause('delete.splayLargest');

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
        await DS.pause('delete.connectLeftRight');
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
        await DS.pause('rotate.splayUp', node);
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
        await DS.pause('rotate.zigzig', node, left, child);
        await this.singleRotate(left, node);
        return await this.singleRotate(left, child);
    }

};


DS.SplayTree.messages = {
    delete: {
        root: "Remove root, leaving left and right trees",
        singleChild: (right, left) => `No ${right} tree, make ${left} tree the root`,
        splayLargest: "Splay largest element in left tree to root",
        connectLeftRight: "Left tree now has no right subtree, connect left and right trees",
    },
    rotate: {
        splayUp: (node) => `Now splaying ${node} up to the root`,
        zigzig: (node, left, child) => `Zig-zig: Rotate ${node} ${left}, then rotate ${child} ${left}`,
    },
};
DS.updateDefault(DS.SplayTree.messages, DS.BST.messages);

