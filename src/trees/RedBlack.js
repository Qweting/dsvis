
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

DS.RedBlack = class RedBlack extends DS.BST {

    newNode(text) {
        return super.newNode(text).addClass("red");
    }

    async insertOne(value) {
        const result = await super.insertOne(value);
        if (result?.success) {
            await this.fixDoubleRed(result.node);
            if (this.isRed(this.treeRoot)) {
                await DS.pause('color.redRootBlack');
                this.colorBlack(this.treeRoot);
            }
        }
    }

    async fixDoubleRed(node) {
        let parent = node.getParent();
        if (!parent) return;
        if (!this.isRed(parent)) return;

        let grandparent = parent.getParent();
        if (!grandparent) return;

        const pibling = parent.getSibling();
        if (this.isRed(pibling)) {
            node.setHighlight(true);
            parent.setHighlight(true);
            pibling.setHighlight(true);
            await DS.pause('color.pushDownBlack', node, parent, pibling);
            node.setHighlight(false);
            parent.setHighlight(false);
            pibling.setHighlight(false);
            this.colorBlack(pibling);
            this.colorBlack(parent);
            this.colorRed(grandparent);
            await DS.pause();
            await this.fixDoubleRed(grandparent);
            return;
        }

        let side = node.isLeftChild() ? "left" : "right";
        let rotate = parent.isLeftChild() ? "left" : "right";
        if (side !== rotate) {
            node.setHighlight(true);
            parent.setHighlight(true);
            grandparent.setHighlight(true);
            await DS.pause('rotate.parent', node, side, rotate, parent),
            node.setHighlight(false);
            parent.setHighlight(false);
            grandparent.setHighlight(false);
            node = (await this.singleRotate(rotate, parent)).getChild(rotate);
        }

        side = node.isLeftChild() ? "left" : "right";
        rotate = side === "left" ? "right" : "left";
        parent = node.getParent();
        grandparent = parent.getParent();
        node.setHighlight(true);
        parent.setHighlight(true);
        grandparent.setHighlight(true);
        await DS.pause('rotate.grandparent', node, side, grandparent, rotate);
        node.setHighlight(false);
        parent.setHighlight(false);
        grandparent.setHighlight(false);
        this.colorBlack(parent);
        this.colorRed(grandparent);
        await this.singleRotate(rotate, grandparent);
    }


    async delete(value) {
        const result = await super.delete(value);
        if (result?.success) {
            if (result.parent) {
                await this.fixDeleteImbalance(result.parent, result.direction);
            }
            if (this.isRed(this.treeRoot)) {
                this.treeRoot.colorBlack();
                await DS.pause('color.rootBlack');
            }
        }
    }

    async fixDeleteImbalance(parent, left) {
        const child = parent.getChild(left);
        if (this.isRed(child)) {
            this.colorBlack(child);
            child.setHighlight(true);
            await DS.pause('color.nodeBlack', child);
            child.setHighlight(false);
        } else if (!parent.isLeaf()) {
            await this.fixDoubleBlack(parent, left);
        }
    }

    async fixDoubleBlack(parent, left) {
        // Note: 'left' is the direction of the double-black child
        const right = left === "left" ? "right" : "left";
        const rightChild = parent.getChild(right);
        const rightGrandchild = rightChild?.getChild(right);
        const leftGrandchild = rightChild?.getChild(left);
        parent.setHighlight(true);
        await DS.pause('balancing.parentImbalanced', parent);

        // Sibling is red
        if (this.isRed(rightChild)) {
            parent.setChildHighlight(right, true);
            rightChild.setHighlight(true);
            await DS.pause('rotate.redSibling', parent, right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setHighlight(false);

            this.colorBlack(rightChild);
            this.colorRed(parent);
            await this.singleRotate(left, parent);
            await this.fixDoubleBlack(parent, left);
            return;
        }

        // Sibling's distant child is red
        if (this.isRed(rightGrandchild)) {
            parent.setChildHighlight(right, true);
            rightChild.setChildHighlight(right, true);
            rightGrandchild.setHighlight(true);
            await DS.pause('rotate.redDistantChild', right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setChildHighlight(right, false);
            rightGrandchild.setHighlight(false);

            if (this.isBlack(parent)) this.colorBlack(rightChild);
            else this.colorRed(rightChild);
            this.colorBlack(parent);
            this.colorBlack(rightGrandchild);
            await this.singleRotate(left, parent);
            return;
        }

        // Sibling's close child is red
        if (this.isRed(leftGrandchild)) {
            parent.setChildHighlight(right, true);
            rightChild.setChildHighlight(left, true);
            leftGrandchild.setHighlight(true);
            await DS.pause('rotate.redCloseChild', right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setChildHighlight(left, false);
            leftGrandchild.setHighlight(false);

            this.colorRed(rightChild);
            this.colorBlack(leftGrandchild);
            await this.singleRotate(right, rightChild);
            await this.fixDoubleBlack(parent, left);
            return;
        }

        // Parent is red
        if (this.isRed(parent)) {
            parent.setChildHighlight(right, true);
            rightChild.setHighlight(true);
            await DS.pause('color.switch', parent, right, rightChild);
            parent.setChildHighlight(right, false);
            rightChild.setHighlight(false);

            this.colorBlack(parent);
            this.colorRed(rightChild);
            return;
        }

        // All are black
        parent.setChildHighlight(right, true);
        rightChild.setHighlight(true);
        await DS.pause('color.childRed', parent, right, rightChild);
        parent.setChildHighlight(right, false);
        rightChild.setHighlight(false);

        this.colorRed(rightChild);
        const grandparent = parent.getParent();
        if (grandparent) {
            const direction = parent === grandparent.getLeft() ? "left" : "right";
            await this.fixDoubleBlack(grandparent, direction);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Red/black level

    isBlack(node) {
        return !node || node.hasClass("black");
    }

    isRed(node) {
        return !this.isBlack(node);
    }

    colorBlack(node) {
        node.addClass("black");
    }

    colorRed(node) {
        node.removeClass("black");
    }

};


DS.RedBlack.messages = {
    color: {
        redRootBlack: "Tree root is red: Color it black",
        rootBlack: "Color the root black",
        nodeBlack: (n) => `Color node ${n} black`,
        pushDownBlack: (node, parent, pibling) => [
            `Node ${node}, parent ${parent} and parent's sibling ${pibling} are all red`,
            "Push blackness down from grandparent",
        ],
        switch: (parent, right, rightChild) => [
            `Parent ${parent} is red,`,
            `${right} child ${rightChild} and its children are black:`,
            "Switch colors",
        ],
        childRed: (parent, right, rightChild) => [
            `Parent ${parent}, ${right} child ${rightChild} and its children are black:`,
            `Color ${right} child red`,
        ],
    },
    balancing: {
        parentImbalanced: (parent) => `Parent ${parent} is imbalanced`,
    },
    rotate: {
        parent: (node, side, rotate, parent) => [
            `Node ${node} is a red ${side} child of a red ${rotate} child`,
            `Rotate parent ${parent} ${rotate}`,
        ],
        grandparent: (node, side, grandparent, rotate) => [
            `Node ${node} is a red ${side} child of a red ${side} child`,
            `Switch colors and rotate grandparent ${grandparent} ${rotate}`,
        ],
        redSibling: (parent, right, rightChild, left) => [
            `Parent ${parent} is black, and its ${right} child ${rightChild} is red:`,
            `Switch colors and rotate ${left}`,
        ],
        redDistantChild: (right, rightChild, left) => [
            `${right} child ${rightChild} is black, its ${right} child is red:`,
            `Switch colors and rotate ${left}`,
        ],
        redCloseChild: (right, rightChild, left) => [
            `${right} child ${rightChild} is black, its ${left} child is red:`,
            `Switch colors and rotate child ${right}`,
        ],
    },
};
DS.updateDefault(DS.RedBlack.messages, DS.BST.messages);

