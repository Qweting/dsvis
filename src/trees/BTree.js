
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

DS.BTree = class BTree {
    constructor() {
        this.reset();
    }

    initToolbar() {
        DS.$Toolbar.algorithmControls.insertAdjacentHTML("beforeend", `
            <label>Max degree: <select id="maxDegree" class="disableWhenRunning">
                <option value="3">2/3-tree</option>
                <option value="4">2/3/4-tree</option>
                <option value="5">Max degree 5</option>
                <option value="6">Max degree 6</option>
            </select></label>`);
        DS.$Toolbar.maxDegree = document.getElementById("maxDegree");
        DS.$Toolbar.maxDegree.addEventListener("change", () => DS.clearTree());
    }

    getMaxDegree() {
        return parseInt(DS.$Toolbar.maxDegree.value);
    }

    getMaxKeys() {
        return this.getMaxDegree() - 1;
    }

    getMinKeys() {
        return Math.floor((this.getMaxDegree() + 1) / 2) - 1;
    }

    getSplitIndex() {
        return Math.floor((this.getMaxDegree() - 1) / 2);
    }


    reset() {
        this.treeRoot = null;
    }

    resizeTree(animate = true) {
        this.treeRoot?.resize(DS.getRootX(), DS.getRootY(), animate);
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
    }


    ///////////////////////////////////////////////////////////////////////////
    // Find a value

    async find(value) {
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

    async findHelper(value, findLeaf = false) {
        let parent = null;
        let node = this.treeRoot;
        const pointer = DS.SVG().highlightCircle(DS.getStartX(), DS.getStartY());
        while (node) {
            pointer.setCenter(node.getCX(0), node.cy(), true);
            node.setHighlight(true);
            await DS.pause();
            let i = 0;
            let cmpStr = value;
            while (i < node.numValues()) {
                const txt = node.getText(i);
                const cmp = DS.compare(value, txt);
                if (cmp === 0) {
                    cmpStr = `${txt} = ${value}`;
                    break;
                } else if (cmp < 0) {
                    cmpStr = `${cmpStr} < ${txt}`;
                    break;
                }
                cmpStr = `${txt} < ${value}`;
                i++;
            }
            const found = i < node.numValues() && DS.compare(value, node.getText(i)) === 0;
            pointer.setCenter(node.getCX(i - (found ? 0 : 1/2)), node.cy(), true);

            if (node.isLeaf() || (found && !findLeaf)) {
                await DS.pause(cmpStr);
                pointer.remove();
                node.setHighlight(false);
                return {success: found, node: node, i: i};
            }

            if (found) i++;
            await DS.pause(`${cmpStr}: Look into ${this.getOrdinal(i, node.numChildren())} child`);
            node.setHighlight(false);
            parent = node;
            node = parent.getChild(i);
        }
        pointer.remove();
        return {success: false, node: parent, i: null};
    }

    ///////////////////////////////////////////////////////////////////////////
    // Insert a value

    async insertOne(value) {
        if (!this.treeRoot) {
            this.treeRoot = DS.SVG().bTreeNode(true, 1, DS.getStartX(), DS.getStartY());
            this.treeRoot.setText(0, value);
            await DS.pause(`Create a new tree root ${value}`);
            this.resizeTree();
            await DS.pause();
            return this.treeRoot;
        }
        await this.insertBottomup(value);
    }

    async insertBottomup(value) {
        await DS.pause(`Searching for node to insert ${value}`);
        const found = await this.findHelper(value);
        const node = found.node;
        if (found.success) {
            node.setHighlight(true);
            await DS.pause(`There is already a node ${found.node}`);
            node.setHighlight(false);
            return null;
        }

        node.setHighlight(true);
        node.insertValue(found.i, value);
        this.resizeTree();
        await DS.pause(`Insert ${value} as ${this.getOrdinal(found.i, node.numValues())} value in the node`);
        node.setHighlight(false);
        await this.insertRepair(node);
        await DS.pause();
    }

    async insertRepair(node) {
        if (node.numValues() > this.getMaxKeys()) {
            if (!node.getParent()) {
                this.treeRoot = await this.split(node);
            } else {
                const newNode = await this.split(node);
                await this.insertRepair(newNode);
            }
        }
    }

    async split(node) {
        node.setHighlight(true);
        await DS.pause(`Splitting node ${node}`);
        const parent = node.getParent();
        const parentIndex = node.getParentIndex();

        let risingValue = node.getText(this.getSplitIndex());
        let rightSplit = this.getSplitIndex() + 1;
        const risingX = node.getCX(rightSplit - 1);
        const risingNode = DS.SVG().bTreeNode(false, 1, risingX, node.cy());
        risingNode.setHighlight(true);
        risingNode.setText(0, risingValue);

        const rightValues = node.numValues() - rightSplit;
        const rightX = node.getCX(rightSplit + rightValues / 2 - 1/2);
        const rightNode = DS.SVG().bTreeNode(node.isLeaf(), rightValues, rightX, node.cy());
        rightNode.setHighlight(true);
        for (let i = rightSplit; i < node.numValues(); i++) {
            const j = i - rightSplit;
            rightNode.setText(j, node.getText(i));
        }
        if (!node.isLeaf()) {
            for (let i = rightSplit; i < node.numChildren(); i++) {
                const j = i - rightSplit;
                rightNode.setChild(j, node.getChild(i));
            }
        }
        node.setNumValues(this.getSplitIndex());
        risingNode.setChild(0, node);
        risingNode.setChild(1, rightNode);

        if (parent) {
            parent.setChild(parentIndex, risingNode);
            await DS.pause();
            risingNode.setCenter(parent.getCX(parentIndex - 1/2), parent.cy(), true);
            node.setHighlight(false);
            rightNode.setHighlight(false);
            await DS.pause();
            parent.insertValue(parentIndex, risingValue);
            parent.setChild(parentIndex, node);
            parent.setChild(parentIndex + 1, rightNode);
            risingNode.remove();
            this.resizeTree()
            return parent;
        }

        this.treeRoot = risingNode;
        this.resizeTree();
        this.treeRoot.setHighlight(false);
        node.setHighlight(false);
        rightNode.setHighlight(false);
    return this.treeRoot;
    }

    getOrdinal(i, n) {
        if (n === 1) {
            return "only";
        } else if (n <= 3) {
            return (
                i === 0 ? "left" :
                i === n - 1 ? "right" :
                "middle"
            );
        } else {
            return (
                i === 0 ? "first" :
                i === 1 ? "second" :
                i === n - 1 ? "last" :
                `${i}rd`
            );
        }
    }


    ///////////////////////////////////////////////////////////////////////////
    // Print all values

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
    }

    async printHelper(node, pointer, printed) {
        if (node.isLeaf()) {
            for (let i = 0; i < node.numValues(); i++) {
                pointer.setCenter(node.getCX(i), node.cy(), true);
                await this.printOneLabel(node, i, printed);
            }
        } else {
            for (let i = 0; i < node.numChildren(); i++) {
                pointer.setCenter(node.getCX(i-0.5), node.y()+node.height(), true);
                await DS.pause();
                await this.printHelper(node.getChild(i), pointer, printed);
                if (i < node.numValues()) {
                    pointer.setCenter(node.getCX(i), node.cy(), true);
                    await this.printOneLabel(node, i, printed);
                } else {
                    pointer.setCenter(node.getCX(i-0.5), node.cy(), true);
                    await DS.pause();
                }
            }
        }
    }

    async printOneLabel(node, i, printed) {
        const lbl = DS.SVG().text(node.getText(i)).center(node.getCX(i), node.cy());
        await DS.pause();
        const last = printed[printed.length - 1];
        DS.animate(lbl).x(last.bbox().x2 + 10).cy(last.cy());
        printed.push(lbl);
        await DS.pause();
    }


    ///////////////////////////////////////////////////////////////////////////
    // Delete a value

    async delete(value) {
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
        found.node.setHighlight(false);
        if (found.node.isLeaf()) {
            await this.deleteLeaf(found.node, found.i);
        } else {
            await this.deleteNonleaf(found.node, found.i);
        }
        if (this.treeRoot.numValues() === 0) {
            this.treeRoot.setHighlight(true);
            await DS.pause("Remove empty tree root");
            const newRoot = this.treeRoot.isLeaf() ? null : this.treeRoot.getLeft();
            this.treeRoot.remove();
            this.treeRoot = newRoot;
            this.resizeTree();
        }
    }

    async deleteLeaf(node, i) {
        node.setHighlight(true);
        await DS.pause(`Delete the ${this.getOrdinal(i, node.numValues())} value in leaf ${node}`);
        node.deleteValue(i);
        this.resizeTree();
        node.setHighlight(false);
        await this.repairAfterDelete(node);
    }

    async deleteNonleaf(node, i) {
        node.addClass("marked");
        const pointer = DS.SVG().highlightCircle(node.getCX(i), node.cy());
        await DS.pause(`Find the predecessor value of ${node.getText(i)}`);
        let maxNode = node.getChild(i);
        let j;
        while (true) {
            j = maxNode.numValues() - 1;
            pointer.setCenter(maxNode.getCX(j), maxNode.cy(), true);
            await DS.pause()
            if (maxNode.isLeaf()) break;
            maxNode = maxNode.getRight();
        }
        const maxValue = maxNode.getText(j);
        const risingNode = DS.SVG().bTreeNode(false, 1, maxNode.getCX(j), maxNode.cy());
        risingNode.setHighlight(true);
        risingNode.setText(0, maxValue);
        await DS.pause(`Replace the value ${node.getText(i)} with ${maxValue}`);
        pointer.remove();
        risingNode.setCenter(node.getCX(i), node.cy(), true);
        node.setText(i, "");
        await DS.pause();
        node.setText(i, maxValue);
        risingNode.remove();
        node.removeClass("marked");
        maxNode.setHighlight(true);
        await DS.pause(`Now delete ${maxValue} in the leaf node ${maxNode}`);
        await this.deleteLeaf(maxNode, j);
    }


    async repairAfterDelete(node) {
        if (node.numValues() >= this.getMinKeys()) return;
        const parent = node.getParent();
        if (!parent) return;

        node.setHighlight(true);
        await DS.pause(`Node ${node} has too few values`);
        const i = node.getParentIndex();
        if (i > 0 && parent.getChild(i - 1).numValues() > this.getMinKeys()) {
            // Steal from left sibling
            await this.stealFromLeft(node, i);
        } else if (i < parent.numValues() && parent.getChild(i + 1).numValues() > this.getMinKeys()) {
            // Steal from right sibling
            await this.stealFromRight(node, i);
        } else if (i < parent.numChildren() - 1) {
            // Merge with right sibling
            const nextNode = await this.mergeRight(node);
            await this.repairAfterDelete(nextNode.getParent());
        } else {
            // Merge with left sibling
            const nextNode = await this.mergeRight(parent.getChild(i - 1));
            await this.repairAfterDelete(nextNode.getParent());
        }
    }

    async mergeRight(node) {
        const parent = node.getParent();
        const parentIndex = node.getParentIndex();
        const parentValue = parent.getText(parentIndex);
        const rightSib = parent.getChild(parentIndex + 1);
        node.setHighlight(true);
        parent.setHighlight(true);
        rightSib.setHighlight(true);
        await DS.pause(["Merging nodes:", `${node} + [${parentValue}] + ${rightSib}`]);

        const sinkingNode = DS.SVG().bTreeNode(false, 1, parent.getCX(parentIndex), parent.cy());
        sinkingNode.setHighlight(true);
        sinkingNode.setText(0, parentValue);
        parent.setText(parentIndex, "");
        const sinkingX = (node.x() + node.width() + rightSib.x()) / 2;
        sinkingNode.setCenter(sinkingX, node.cy(), true);
        node.setCenter(sinkingX - DS.getNodeSize()/2 - node.width()/2, node.cy(), true);
        rightSib.setCenter(sinkingX + DS.getNodeSize()/2 + rightSib.width()/2, node.cy(), true);
        await DS.pause();

        const nodeSize = node.numValues();
        const textsToInsert = [parentValue].concat(rightSib.getTexts());
        node.setNumValues(nodeSize + textsToInsert.length);
        for (let i = 0; i < textsToInsert.length; i++) {
            node.setText(nodeSize + i, textsToInsert[i]);
            if (!node.isLeaf()) {
                node.setChild(nodeSize + i + 1, rightSib.getChild(i));
            }
        }
        parent.deleteValue(parentIndex, false);
        sinkingNode.remove();
        rightSib.remove();
        this.resizeTree();
        await DS.pause();
        node.setHighlight(false);
        parent.setHighlight(false);
        return node;
    }

    async stealFromRight(node, parentIndex) {
        const parent = node.getParent();
        const rightSib = parent.getChild(parentIndex + 1);
        node.setHighlight(true);
        parent.setHighlight(true);
        rightSib.setHighlight(true);

        let leftValue = parent.getText(parentIndex);
        let rightValue = rightSib.getText(0);
        await DS.pause([
            "Stealing from right sibling:",
            `${node} ← [${leftValue}] ← [${rightValue}]`,
        ]);

        const leftNode = DS.SVG().bTreeNode(false, 1, parent.getCX(parentIndex), parent.cy());
        leftNode.setText(0, leftValue);
        leftNode.setHighlight(true);
        const rightNode = DS.SVG().bTreeNode(false, 1, rightSib.getCX(0), rightSib.cy());
        rightNode.setText(0, rightValue);
        rightNode.setHighlight(true);

        node.insertValue(node.numValues(), "");
        parent.setText(parentIndex, "");
        rightSib.setText(0, "");

        leftNode.setCenter(node.getCX(node.numValues() - 1), node.cy(), true);
        rightNode.setCenter(parent.getCX(parentIndex), parent.cy(), true);
        if (!node.isLeaf()) node.setChild(node.numChildren() - 1, rightSib.getChild(0));
        await DS.pause();

        leftNode.remove();
        rightNode.remove();
        rightSib.deleteValue(0);
        parent.setText(parentIndex, rightValue);
        node.setText(node.numValues() - 1, leftValue);
        this.resizeTree();
        await DS.pause();
        node.setHighlight(false);
        parent.setHighlight(false);
        rightSib.setHighlight(false);
        return node;
    }


    async stealFromLeft(node, parentIndex) {
        parentIndex--;
        const parent = node.getParent();
        const leftSib = parent.getChild(parentIndex);
        node.setHighlight(true);
        parent.setHighlight(true);
        leftSib.setHighlight(true);

        let rightValue = parent.getText(parentIndex);
        let leftValue = leftSib.getText(leftSib.numValues() - 1);
        await DS.pause([
            "Stealing from left sibling:",
            `[${leftValue}] → [${rightValue}] → ${node}`,
        ]);

        const rightNode = DS.SVG().bTreeNode(false, 1, parent.getCX(parentIndex), parent.cy());
        rightNode.setText(0, rightValue);
        rightNode.setHighlight(true);
        const leftNode = DS.SVG().bTreeNode(false, 1, leftSib.getCX(leftSib.numValues() - 1), leftSib.cy());
        leftNode.setText(0, leftValue);
        leftNode.setHighlight(true);

        node.insertValue(0, "", true);
        parent.setText(parentIndex, "");
        leftSib.setText(leftSib.numValues() - 1, "");

        rightNode.setCenter(node.getCX(0), node.cy(), true);
        leftNode.setCenter(parent.getCX(parentIndex), parent.cy(), true);
        if (!node.isLeaf()) node.setChild(0, leftSib.getChild(leftSib.numChildren() - 1));
        await DS.pause();

        rightNode.remove();
        leftNode.remove();
        leftSib.deleteValue(leftSib.numValues() - 1, false);
        parent.setText(parentIndex, leftValue);
        node.setText(0, rightValue);
        this.resizeTree();
        await DS.pause();
        node.setHighlight(false);
        parent.setHighlight(false);
        leftSib.setHighlight(false);
        return node;
    }

};

