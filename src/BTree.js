
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
                return {success: found, node: node};
            }

            if (found) i++;
            await DS.pause(`${cmpStr}: Look into ${this.getOrdinal(i, node.numChildren())} child`);
            node.setHighlight(false);
            parent = node;
            node = parent.getChild(i);
        }
        pointer.remove();
        return {success: false, node: parent};
    }

    async insertOne(value) {
        if (!value) return null;
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

        let i = 0;
        while (i < node.numValues()) {
            if (DS.compare(value, node.getText(i)) < 0) break;
            i++;
        }
        
        node.setHighlight(true);
        node.insertValue(i, value);
        this.resizeTree();
        await DS.pause(`Insert ${value} as ${this.getOrdinal(i, node.numValues())} value in the node`);
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
        const risingX = node.x() + DS.getNodeSize() * (rightSplit - 1/2);
        const risingNode = DS.SVG().bTreeNode(false, 1, risingX, node.cy());
        risingNode.setHighlight(true);
        risingNode.setText(0, risingValue);

        const rightValues = node.numValues() - rightSplit;
        const rightX = risingX + DS.getNodeSize() * (rightValues + 1) / 2;
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
            risingNode.setCenter(parent.x() + DS.getNodeSize() * parentIndex, parent.cy(), true);
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


    async delete(value) {
        await DS.pause("B-tree deletion is not implemented yet!");
        return null;
    }


};

