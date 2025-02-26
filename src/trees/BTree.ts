import { Text } from "@svgdotjs/svg.js";
import {
    compare,
    Engine,
    MessagesObject,
    parseValues,
    updateDefault,
} from "../../src/engine";
import { BTreeNode } from "../../src/objects/btree-node";
import { HighlightCircle } from "../../src/objects/highlight-circle";
import { BTreeToolbar } from "../../src/toolbars/BTree-toolbar";
import { BSTMessages } from "./BST";

const BTreeMessages = {
    find: {
        predecessor: (val: string) => `Find the predecessor value of ${val}`,
    },
    insert: {
        nth: (val: string, nth: number) =>
            `Insert ${val} as ${nth} value in the node`,
    },
    delete: {
        root: {
            empty: "Remove empty tree root",
        },
        leaf: {
            nth: (leaf: BTreeNode, nth: number) =>
                `Delete the ${nth} value in leaf ${leaf}`,
            value: (val: string, leaf: BTreeNode) =>
                `Now delete ${val} in the leaf node ${leaf}`,
        },
        replace: (val: string, newVal: string) =>
            `Replace the value ${val} with ${newVal}`,
    },
    node: {
        lookNthChild: (nth: number) => `Look into ${nth} child`,
        split: (node: BTreeNode) => `Splitting node ${node}`,
        tooFew: (node: BTreeNode) => `Node ${node} has too few values`,
        mergeRight: (node: BTreeNode, parent: BTreeNode, rightSib: BTreeNode) =>
            `Merging nodes:\n${node} + [${parent}] + ${rightSib}`,
        steal: {
            right: (node: BTreeNode, left: BTreeNode, right: BTreeNode) =>
                `Stealing from right sibling:\n${node} ← [${left}] ← [${right}]`,

            left: (node: BTreeNode, left: BTreeNode, right: BTreeNode) =>
                `Stealing from left sibling:\n[${left}] → [${right}] → ${node}`,
        },
    },
};

export class BTree extends Engine {
    initialValues: (string | number)[] = [];
    treeRoot: BTreeNode | null = null;

    messages: MessagesObject = updateDefault(BTreeMessages, BSTMessages);

    toolbar: BTreeToolbar;

    constructor(containerSelector: string) {
        super(containerSelector);

        this.toolbar = new BTreeToolbar(this.container);
    }

    initialise(initialValues = null) {
        this.initialValues = parseValues(initialValues);
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.treeRoot = null;
        if (this.initialValues) {
            this.state.resetting = true;
            await this.insert(...this.initialValues);
            this.state.resetting = false;
        }
    }

    initToolbar() {
        super.initToolbar();

        this.toolbar.maxDegree.addEventListener("change", () =>
            this.confirmResetAll()
        );
    }

    getMaxDegree() {
        return parseInt(this.toolbar.maxDegree.value);
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

    resizeTree(svgMargin: number, nodeSpacing: number) {
        const animate = !this.state.resetting;
        this.treeRoot?.resize(
            ...this.view.getTreeRoot(),
            svgMargin,
            nodeSpacing,
            animate ? this.view.getAnimationSpeed() : 0
        );
    }

    async insert(...values: (number | string)[]) {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Find a value

    async find(value: number | string) {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return;
        }
        await this.pause("find.start", value);
        const found = await this.findHelper(value);
        found.node?.setHighlight(true);
        const path = found.success ? "find.found" : "find.notfound";
        await this.pause(path, value);
        found.node?.setHighlight(false);
    }

    async findHelper(value: number | string, findLeaf = false) {
        let parent = null;
        let node = this.treeRoot;
        const pointer = this.view.Svg.put(new HighlightCircle()).init(
            ...this.view.getNodeStart(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        while (node) {
            pointer.setCenter(
                node.getCX(0, this.view.getObjectSize()),
                node.cy(),
                this.view.getAnimationSpeed()
            );
            node.setHighlight(true);
            await this.pause(undefined);
            let i = 0;
            let cmpStr = String(value);
            while (i < node.numValues()) {
                const txt = node.getText(i);
                const cmp = compare(value, txt);
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
            const found =
                i < node.numValues() && compare(value, node.getText(i)) === 0;
            pointer.setCenter(
                node.getCX(i - (found ? 0 : 0.5), this.view.getObjectSize()),
                node.cy(),
                this.view.getAnimationSpeed()
            );

            if (node.isLeaf() || (found && !findLeaf)) {
                await this.pause(cmpStr);
                pointer.remove();
                node.setHighlight(false);
                return { success: found, node: node, i: i };
            }

            if (found) {
                i++;
            }
            await this.pause(
                `${cmpStr}: ${this.getMessage(
                    "node.lookNthChild",
                    this.getOrdinal(i, node.numChildren())
                )}`
            );
            node.setHighlight(false);
            parent = node;
            node = parent.getChild(i);
        }
        pointer.remove();
        return { success: false, node: parent, i: null };
    }

    ///////////////////////////////////////////////////////////////////////////
    // Insert a value

    async insertOne(value: string | number) {
        if (this.treeRoot) {
            await this.insertBottomup(value);
        } else {
            this.treeRoot = this.view.Svg.put(new BTreeNode()).init(
                true,
                1,
                ...this.view.getNodeStart(),
                this.view.getObjectSize(),
                this.view.getStrokeWidth()
            );
            this.treeRoot.setText(0, String(value));
            await this.pause("insert.newroot", value);
            this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
            await this.pause(undefined);
        }
    }

    async insertBottomup(value: number | string) {
        await this.pause("insert.search", value);
        const found = await this.findHelper(value);
        const node = found.node;

        if (!node) {
            return;
        }

        node.setHighlight(true);
        if (found.success) {
            await this.pause("insert.exists", found.node);
            node.setHighlight(false);
        } else {
            node.insertValue(
                found.i || 0,
                String(value),
                this.view.getObjectSize(),
                this.view.getStrokeWidth()
            );
            this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
            await this.pause(
                "insert.nth",
                value,
                this.getOrdinal(found.i || 0, node?.numValues())
            );
            node?.setHighlight(false);
            await this.insertRepair(node);
            await this.pause(undefined);
        }
    }

    async insertRepair(node: BTreeNode) {
        if (node.numValues() > this.getMaxKeys()) {
            if (!node.getParent()) {
                this.treeRoot = await this.split(node);
            } else {
                const newNode = await this.split(node);
                await this.insertRepair(newNode);
            }
        }
    }

    async split(node: BTreeNode) {
        node.setHighlight(true);
        await this.pause("node.split", node);
        const parent = node.getParent();
        const parentIndex = node.getParentIndex();

        const risingValue = node.getText(this.getSplitIndex());
        const rightSplit = this.getSplitIndex() + 1;
        const risingX = node.getCX(rightSplit - 1, this.view.getObjectSize());
        const risingNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            risingX,
            node.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        risingNode.setHighlight(true);
        risingNode.setText(0, risingValue);

        const rightValues = node.numValues() - rightSplit;
        const rightX = node.getCX(
            rightSplit + rightValues / 2 - 0.5,
            this.view.getObjectSize()
        );
        const rightNode = this.view.Svg.put(new BTreeNode()).init(
            node.isLeaf(),
            rightValues,
            rightX,
            node.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        rightNode.setHighlight(true);
        for (let i = rightSplit; i < node.numValues(); i++) {
            const j = i - rightSplit;
            rightNode.setText(j, node.getText(i));
        }
        if (!node.isLeaf()) {
            for (let i = rightSplit; i < node.numChildren(); i++) {
                const j = i - rightSplit;
                rightNode.setChild(
                    j,
                    node.getChild(i),
                    this.view.getStrokeWidth()
                );
            }
        }
        node.setNumValues(
            this.getSplitIndex(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        risingNode.setChild(0, node, this.view.getStrokeWidth());
        risingNode.setChild(1, rightNode, this.view.getStrokeWidth());

        if (parent && parentIndex !== null) {
            parent.setChild(
                parentIndex,
                risingNode,
                this.view.getStrokeWidth()
            );
            await this.pause(undefined);
            risingNode.setCenter(
                parent.getCX(parentIndex - 0.5, this.view.getObjectSize()),
                parent.cy(),
                this.view.getAnimationSpeed()
            );
            node.setHighlight(false);
            rightNode.setHighlight(false);
            await this.pause(undefined);
            parent.insertValue(
                parentIndex,
                risingValue,
                this.view.getObjectSize(),
                this.view.getStrokeWidth()
            );
            parent.setChild(parentIndex, node, this.view.getStrokeWidth());
            parent.setChild(
                parentIndex + 1,
                rightNode,
                this.view.getStrokeWidth()
            );
            risingNode.remove();
            this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
            return parent;
        }

        this.treeRoot = risingNode;
        this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        this.treeRoot.setHighlight(false);
        node.setHighlight(false);
        rightNode.setHighlight(false);
        return this.treeRoot;
    }

    getOrdinal(i: number, n: number) {
        if (n === 1) {
            return "only";
        } else if (n <= 3) {
            return i === 0 ? "left" : i === n - 1 ? "right" : "middle";
        } else {
            return i === 0
                ? "first"
                : i === 1
                ? "second"
                : i === n - 1
                ? "last"
                : `${i}rd`;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    // Print all values

    async print() {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return;
        }

        const { x, y } = this.info.printer.bbox();
        const printed = [
            this.view.Svg.text("Printed nodes: ").addClass("printer").x(x).y(y),
        ];
        const pointer = this.view.Svg.put(new HighlightCircle()).init(
            ...this.view.getNodeStart(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        await this.printHelper(this.treeRoot, pointer, printed);
        pointer.remove();
        await this.pause(undefined);
        for (const lbl of printed) {
            lbl.remove();
        }
    }

    async printHelper(
        node: BTreeNode,
        pointer: HighlightCircle,
        printed: Text[]
    ) {
        if (node.isLeaf()) {
            for (let i = 0; i < node.numValues(); i++) {
                pointer.setCenter(
                    node.getCX(i, this.view.getObjectSize()),
                    node.cy(),
                    this.view.getAnimationSpeed()
                );
                await this.printOneLabel(node, i, printed);
            }
        } else {
            for (let i = 0; i < node.numChildren(); i++) {
                pointer.setCenter(
                    node.getCX(i - 0.5, this.view.getObjectSize()),
                    Number(node.y()) + Number(node.height()),
                    this.view.getAnimationSpeed()
                );
                await this.pause(undefined);
                await this.printHelper(node.getChild(i)!, pointer, printed);
                if (i < node.numValues()) {
                    pointer.setCenter(
                        node.getCX(i, this.view.getObjectSize()),
                        node.cy(),
                        this.view.getAnimationSpeed()
                    );
                    await this.printOneLabel(node, i, printed);
                } else {
                    pointer.setCenter(
                        node.getCX(i - 0.5, this.view.getObjectSize()),
                        node.cy(),
                        this.view.getAnimationSpeed()
                    );
                    await this.pause(undefined);
                }
            }
        }
    }

    async printOneLabel(node: BTreeNode, i: number, printed: Text[]) {
        const lbl = this.view.Svg.text(node.getText(i)).center(
            node.getCX(i, this.view.getObjectSize()),
            node.cy()
        );
        await this.pause(undefined);
        const last = printed[printed.length - 1];
        const spacing = this.view.getNodeSpacing() / 2;
        this.animate(lbl)
            .cy(last.cy())
            .x(last.bbox().x2 + spacing);
        printed.push(lbl);
        await this.pause(undefined);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Delete a value

    async delete(value: number | string) {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return;
        }
        await this.pause("delete.search", value);
        const found = await this.findHelper(value);
        if (!found.success) {
            found.node?.setHighlight(true);
            await this.pause("delete.notexists", value);
            found.node?.setHighlight(false);
            return;
        }
        found.node?.setHighlight(true);
        await this.pause("delete.found", value);
        found.node?.setHighlight(false);
        if (found.node?.isLeaf()) {
            await this.deleteLeaf(found.node, found.i || 0);
        } else {
            await this.deleteNonleaf(found.node as BTreeNode, found.i || 0);
        }
        if (this.treeRoot.numValues() === 0) {
            this.treeRoot.setHighlight(true);
            await this.pause("delete.root.empty");
            const newRoot = this.treeRoot.isLeaf()
                ? null
                : this.treeRoot.getLeft();
            this.treeRoot.remove();
            this.treeRoot = newRoot;
            this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        }
    }

    async deleteLeaf(node: BTreeNode, i: number) {
        node.setHighlight(true);
        await this.pause(
            "delete.leaf.nth",
            node,
            this.getOrdinal(i, node.numValues())
        );
        node.deleteValue(
            i,
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        node.setHighlight(false);
        await this.repairAfterDelete(node);
    }

    async deleteNonleaf(node: BTreeNode, i: number) {
        node.addClass("marked");
        const pointer = this.view.Svg.put(new HighlightCircle()).init(
            node.getCX(i, this.view.getObjectSize()),
            node.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        await this.pause("find.predecessor", node.getText(i));
        let maxNode = node.getChild(i);
        let j;
        while (true) {
            j = (maxNode?.numValues() || 0) - 1;
            pointer.setCenter(
                maxNode?.getCX(j, this.view.getObjectSize()) || 0,
                maxNode?.cy() || 0,
                this.view.getAnimationSpeed()
            );
            await this.pause(undefined);
            if (maxNode?.isLeaf()) {
                break;
            }
            maxNode = maxNode?.getRight() || null;
        }
        const maxValue = maxNode.getText(j);
        const risingNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            maxNode.getCX(j, this.view.getObjectSize()),
            maxNode.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        risingNode.setHighlight(true);
        risingNode.setText(0, maxValue);
        await this.pause("delete.replace", node.getText(i), maxValue);
        pointer.remove();
        risingNode.setCenter(
            node.getCX(i, this.view.getObjectSize()),
            node.cy(),
            this.view.getAnimationSpeed()
        );
        node.setText(i, "");
        await this.pause(undefined);
        node.setText(i, maxValue);
        risingNode.remove();
        node.removeClass("marked");
        maxNode.setHighlight(true);
        await this.pause("delete.leaf.value", maxValue, maxNode);
        await this.deleteLeaf(maxNode, j);
    }

    async repairAfterDelete(node: BTreeNode) {
        if (node.numValues() >= this.getMinKeys()) {
            return;
        }
        const parent = node.getParent();
        if (!parent) {
            return;
        }

        node.setHighlight(true);
        await this.pause("node.tooFew", node);
        const i = node.getParentIndex() || 0;
        if (
            i > 0 &&
            parent.getChild(i - 1) !== null &&
            parent.getChild(i - 1)!.numValues() > this.getMinKeys()
        ) {
            // Steal from left sibling
            await this.stealFromLeft(node, i);
        } else if (
            i < parent.numValues() &&
            parent.getChild(i + 1) !== null &&
            parent.getChild(i + 1)!.numValues() > this.getMinKeys()
        ) {
            // Steal from right sibling
            await this.stealFromRight(node, i);
        } else if (i < parent.numChildren() - 1) {
            // Merge with right sibling
            const nextNode = await this.mergeRight(node);
            await this.repairAfterDelete(nextNode.getParent() as BTreeNode);
        } else {
            // Merge with left sibling
            const nextNode = await this.mergeRight(
                parent.getChild(i - 1) as BTreeNode
            );
            await this.repairAfterDelete(nextNode.getParent() as BTreeNode);
        }
    }

    async mergeRight(node: BTreeNode) {
        const parent = node.getParent();
        const parentIndex = node.getParentIndex();

        if (!parent || parentIndex === null) {
            throw new Error("Invalid parent");
        }

        const parentValue = parent?.getText(parentIndex);
        const rightSib = parent.getChild(parentIndex + 1);
        node.setHighlight(true);
        parent.setHighlight(true);
        rightSib?.setHighlight(true);
        await this.pause("node.mergeRight", node, parentValue, rightSib);

        const sinkingNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            parent.getCX(parentIndex, this.view.getObjectSize()),
            parent.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        sinkingNode.setHighlight(true);
        sinkingNode.setText(0, parentValue);
        parent.setText(parentIndex, "");
        const sinkingX =
            (Number(node.x()) + Number(node.width()) + Number(rightSib?.x())) /
            2;
        sinkingNode.setCenter(
            sinkingX,
            node.cy(),
            this.view.getAnimationSpeed()
        );
        node.setCenter(
            sinkingX - (this.view.getObjectSize() + Number(node.width())) / 2,
            node.cy(),
            this.view.getAnimationSpeed()
        );
        rightSib?.setCenter(
            sinkingX +
                (this.view.getObjectSize() + Number(rightSib.width())) / 2,
            node.cy(),
            this.view.getAnimationSpeed()
        );
        await this.pause(undefined);

        const nodeSize = node.numValues();
        const textsToInsert = [parentValue].concat(rightSib?.getTexts() || []);
        node.setNumValues(
            nodeSize + textsToInsert.length,
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        for (let i = 0; i < textsToInsert.length; i++) {
            node.setText(nodeSize + i, textsToInsert[i]);
            if (!node.isLeaf()) {
                node.setChild(
                    nodeSize + i + 1,
                    rightSib?.getChild(i) as BTreeNode,
                    this.view.getStrokeWidth()
                );
            }
        }
        parent.deleteValue(
            parentIndex,
            this.view.getObjectSize(),
            this.view.getStrokeWidth(),
            false
        );
        sinkingNode.remove();
        rightSib?.remove();
        this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        await this.pause(undefined);
        node.setHighlight(false);
        parent.setHighlight(false);
        return node;
    }

    async stealFromRight(node: BTreeNode, parentIndex: number) {
        const parent = node.getParent();
        const rightSib = parent?.getChild(parentIndex + 1);

        if (!parent || !rightSib) {
            throw new Error(
                "Can not steal from right, missing parent or right sibling"
            );
        }

        node.setHighlight(true);
        parent.setHighlight(true);
        rightSib.setHighlight(true);

        const leftValue = parent.getText(parentIndex);
        const rightValue = rightSib.getText(0);
        await this.pause("node.steal.right", node, leftValue, rightValue);

        const leftNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            parent?.getCX(parentIndex, this.view.getObjectSize()),
            parent?.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        leftNode.setText(0, leftValue || "");
        leftNode.setHighlight(true);
        const rightNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            rightSib?.getCX(0, this.view.getObjectSize()),
            rightSib?.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        rightNode.setText(0, rightValue || "");
        rightNode.setHighlight(true);

        node.insertValue(
            node.numValues(),
            "",
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        parent.setText(parentIndex, "");
        rightSib.setText(0, "");

        leftNode.setCenter(
            node.getCX(node.numValues() - 1, this.view.getObjectSize()),
            node.cy(),
            this.view.getAnimationSpeed()
        );
        rightNode.setCenter(
            parent.getCX(parentIndex, this.view.getObjectSize()),
            parent.cy(),
            this.view.getAnimationSpeed()
        );
        if (!node.isLeaf()) {
            node.setChild(
                node.numChildren() - 1,
                rightSib.getChild(0),
                this.view.getStrokeWidth()
            );
        }
        await this.pause(undefined);

        leftNode.remove();
        rightNode.remove();
        rightSib.deleteValue(
            0,
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        parent.setText(parentIndex, rightValue);
        node.setText(node.numValues() - 1, leftValue);
        this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        await this.pause(undefined);
        node.setHighlight(false);
        parent.setHighlight(false);
        rightSib.setHighlight(false);
        return node;
    }

    async stealFromLeft(node: BTreeNode, parentIndex: number) {
        parentIndex--;
        const parent = node.getParent();
        const leftSib = parent?.getChild(parentIndex);

        if (!parent || !leftSib) {
            throw new Error(
                "Can not steal from left, missing parent or left sibling"
            );
        }

        node.setHighlight(true);
        parent.setHighlight(true);
        leftSib.setHighlight(true);

        const rightValue = parent.getText(parentIndex);
        const leftValue = leftSib.getText(leftSib.numValues() - 1);
        await this.pause("node.steal.left", node, leftValue, rightValue);

        const rightNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            parent.getCX(parentIndex, this.view.getObjectSize()),
            parent.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        rightNode.setText(0, rightValue);
        rightNode.setHighlight(true);
        const leftNode = this.view.Svg.put(new BTreeNode()).init(
            false,
            1,
            leftSib.getCX(leftSib.numValues() - 1, this.view.getObjectSize()),
            leftSib.cy(),
            this.view.getObjectSize(),
            this.view.getStrokeWidth()
        );
        leftNode.setText(0, leftValue);
        leftNode.setHighlight(true);

        node.insertValue(
            0,
            "",
            this.view.getObjectSize(),
            this.view.getStrokeWidth(),
            true
        );
        parent.setText(parentIndex, "");
        leftSib.setText(leftSib.numValues() - 1, "");

        rightNode.setCenter(
            node.getCX(0, this.view.getObjectSize()),
            node.cy(),
            this.view.getAnimationSpeed()
        );
        leftNode.setCenter(
            parent.getCX(parentIndex, this.view.getObjectSize()),
            parent.cy(),
            this.view.getAnimationSpeed()
        );
        if (!node.isLeaf()) {
            node.setChild(
                0,
                leftSib.getChild(leftSib.numChildren() - 1),
                this.view.getStrokeWidth()
            );
        }
        await this.pause(undefined);

        rightNode.remove();
        leftNode.remove();
        leftSib.deleteValue(
            leftSib.numValues() - 1,
            this.view.getObjectSize(),
            this.view.getStrokeWidth(),
            false
        );
        parent.setText(parentIndex, leftValue);
        node.setText(0, rightValue);
        this.resizeTree(this.$Svg.margin, this.view.getNodeSpacing());
        await this.pause(undefined);
        node.setHighlight(false);
        parent.setHighlight(false);
        leftSib.setHighlight(false);
        return node;
    }
}
