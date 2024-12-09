
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS, SVG */
///////////////////////////////////////////////////////////////////////////////

DS.AVL = class AVL extends DS.BST {

    newNode(text) {
        return this.SVG().avlNode(text, this.getStartX(), this.getStartY());
    }

    getHeight(node) {
        return node ? node.getHeight() : 0;
    }

    async insertOne(value) {
        const result = await super.insertOne(value);
        if (result?.success) {
            result.node.updateHeightPosition();
            await this.updateHeights(result.node);
            await this.updateHeightPositions();
        }
    }

    async delete(value) {
        const result = await super.delete(value);
        if (result?.success) {
            if (result.parent) {
                await this.updateHeights(result.parent, result.direction);
            }
            await this.updateHeightPositions();
        }
    }

    async updateHeightPositions() {
        SVG.find("g").forEach((node) => {
            if (node instanceof SVG.AVLNode) node.updateHeightPosition();
        });
    }

    async updateHeights(node, fromchild) {
        const child = node.getChild(fromchild) || node;
        this.pointer = this.SVG().highlightCircle(child.cx(), child.cy());
        while (node) {
            this.pointer.setCenter(node.cx(), node.cy(), true);
            await this.pause('node.updateHeight');
            const leftHeight = this.getHeight(node.getLeft()), rightHeight = this.getHeight(node.getRight());
            const height = 1 + Math.max(leftHeight, rightHeight);
            if (height !== this.getHeight(node)) {
                node.setHeightHighlight(true);
                node.setHeight(height);
                await this.pause();
                node.setHeightHighlight(false);
            }
            node = await this.rebalance(node);
            node = node.getParent();
        }
        this.pointer.remove();
    }

    async rebalance(node) {
        const leftHeight = this.getHeight(node.getLeft()), rightHeight = this.getHeight(node.getRight());
        if (Math.abs(leftHeight - rightHeight) <= 1) return node;
        await this.pause('node.unbalanced');
        const left = leftHeight < rightHeight ? "left" : "right";
        const right = left === "left" ? "right" : "left";
        const child = node.getChild(right);
        const childLeft = this.getHeight(child.getChild(left)), childRight = this.getHeight(child.getChild(right));
        this.pointer.hide();
        if (childLeft <= childRight) {
            node = await this.singleRotate(left, node);
        } else {
            node = await this.doubleRotate(left, node);
        }
        this.pointer = this.SVG().highlightCircle(node.cx(), node.cy());
        await this.pause('node.balanced');
        return node;
    }


    ///////////////////////////////////////////////////////////////////////////////
    // Rotate the tree

    async resetHeight(node) {
        const height = 1 + Math.max(this.getHeight(node.getLeft()), this.getHeight(node.getRight()));
        if (height !== this.getHeight(node)) {
            node.setHeight(height);
        }
    }
};


SVG.AVLNode = class AVLNode extends SVG.BinaryNode {
    init(text, x, y) {
        const d = this.engine().getObjectSize();
        this.$height = this.text(1).center(-0.6 * d, -0.5 * d).addClass("avlheight");
        return super.init(text, x, y);
    }

    getHeight() {
        return parseInt(this.$height.text());
    }

    setHeight(height) {
        this.$height.text(height);
        return this;
    }

    updateHeightPosition(side) {
        const hx = this.$height.cx(), cx = this.cx();
        if (this.isRightChild() && hx - cx < 0) this.$height.cx(2 * cx - hx);
        if (this.isLeftChild() && hx - cx > 0) this.$height.cx(2 * cx - hx);
    }

    getHeightHighlight() {
        return this.$height.getHighlight();
    }

    setHeightHighlight(high) {
        this.$height.setHighlight(high);
        return this;
    }
};


SVG.extend(SVG.Container, {
    avlNode: function(text, x, y) {
        return this.put(new SVG.AVLNode()).init(text, x, y);
    },
});


DS.AVL.messages = {
    node: {
        updateHeight: "Update node heights",
        unbalanced: "Node is unbalanced!",
        balanced: "Node is now balanced",
    },
};
DS.updateDefault(DS.AVL.messages, DS.BST.messages);

