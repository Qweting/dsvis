import { compare } from "../../src/engine";
import { BinaryNode } from "../../src/objects/binary-node";
import { BST, BSTMessages } from "./BST";

export class SplayTree extends BST {
    // @ts-expect-error TODO: Error because change of delete.root from object to string
    messages = {
        ...BSTMessages,
        ...SplayTreeMessages,
        rotate: {
            ...BSTMessages.rotate,
            ...SplayTreeMessages.rotate,
        },
        delete: {
            ...BSTMessages.delete,
            ...SplayTreeMessages.delete,
        },
    };
    async find(value: string | number) {
        const found = await super.find(value);
        if (found?.node) {
            await this.splayUp(found.node);
        }
        return found;
    }

    async insertOne(value: string) {
        const result = await super.insertOne(value);
        if (result?.node) {
            if (!result.success) {
                await this.pause("insert.exists", result.node);
            }
            await this.splayUp(result.node);
        }
        return result;
    }

    async delete(value: string): Promise<{
        success: boolean;
        direction: "left" | "right" | null;
        parent: BinaryNode | null;
    } | null> {
        if (!this.treeRoot) {
            return { success: false, direction: null, parent: null };
        }

        await this.find(value);
        if (compare(value, this.treeRoot?.getText()) !== 0) {
            await this.pause("delete.notexists", value);
            return { success: false, parent: null, direction: null };
        }

        this.treeRoot.setHighlight(true);
        await this.pause("delete.root");
        if (!(this.treeRoot.getLeft() && this.treeRoot.getRight())) {
            // TODO: Fix variable names
            const left = this.treeRoot.getLeft() ? "left" : "right";
            const right = left === "left" ? "right" : "left";
            const child =
                this.treeRoot.getLeft() || (this.treeRoot.getRight() as BinaryNode);
            const newRoot = child.setHighlight(true);
            await this.pause("delete.singleChild", right, left);
            this.treeRoot.remove();
            this.treeRoot = newRoot;
            this.resizeTree();
            await this.pause(undefined);
            return { success: true, parent: this.treeRoot, direction: left };
        }

        const right = this.treeRoot.getRight();
        const left = this.treeRoot.getLeft();
        this.treeRoot.remove();
        await this.pause("delete.splayLargest");

        let largestLeft = left as BinaryNode; // TODO: Check if i can do this
        largestLeft.setHighlight(true);
        await this.pause(undefined);
        if (largestLeft.getRight()) {
            while (largestLeft.getRight()) {
                largestLeft.setHighlight(false);
                largestLeft = largestLeft.getRight()!;
                largestLeft.setHighlight(true);
                await this.pause(undefined);
            }
        }
        largestLeft.setHighlight(false);
        await this.splayUp(largestLeft);
        await this.pause("delete.connectLeftRight");
        largestLeft.setHighlight(true);
        await this.pause(undefined);
        largestLeft.setHighlight(false);
        largestLeft.setRight(right as BinaryNode, this.getStrokeWidth());
        this.treeRoot = largestLeft;
        this.resizeTree();
        await this.pause(undefined);
        return { success: true, parent: this.treeRoot, direction: null }; // TODO: update direction
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Splay a node to the root of the tree

    async splayUp(node: BinaryNode) {
        if (node === this.treeRoot) {
            return;
        }
        node.setHighlight(true);
        await this.pause("rotate.splayUp", node);
        node.setHighlight(false);
        while (node.getParent()) {
            const parent = node.getParent()!;
            const left = node.isLeftChild() ? "left" : "right";
            const right = left === "left" ? "right" : "left";
            if (!parent.getParent()) {
                node = await this.singleRotate(right, parent);
            } else if (parent.isChild(right)) {
                node = await this.doubleRotate(left, parent.getParent()!);
                // this.splayHelper(node);
            } else {
                // node = await this.singleRotate(right, parent);
                node = await this.zigZig(right, parent.getParent()!);
                // this.splayHelper(node);
            }
        }
    }

    async splayHelper(node: BinaryNode) {
        const parent = node.getParent();
        if (!parent) {
            return;
        }

        const left = node.isLeftChild() ? "left" : "right";
        const right = left === "left" ? "right" : "left";
        if (!parent?.getParent()) {
            this.singleRotate(left, parent);
        } else if (parent.isChild(right)) {
            this.doubleRotate(left, parent.getParent()!);
            this.splayHelper(node);
        } else {
            this.zigZig(right, parent.getParent()!);
            this.splayHelper(node);
        }
    }

    async zigZig(left: "left" | "right", node: BinaryNode) {
        // Note: 'left' and 'right' are variables that can have values "left" or "right"!
        const right = left === "left" ? "right" : "left";
        const child = node.getChild(right);

        if (!child) {
            return node;
        }

        await this.pause("rotate.zigzig", node, left, child);
        await this.singleRotate(left, node);
        return await this.singleRotate(left, child);
    }
}

const SplayTreeMessages = {
    delete: {
        root: "Remove root, leaving left and right trees",
        singleChild: (right: "left" | "right", left: "left" | "right") =>
            `No ${right} tree, make ${left} tree the root`,
        splayLargest: "Splay largest element in left tree to root",
        connectLeftRight:
            "Left tree now has no right subtree, connect left and right trees",
    },
    rotate: {
        splayUp: (node: BinaryNode) => `Now splaying ${node} up to the root`,
        zigzig: (node: BinaryNode, left: "left" | "right", child: BinaryNode) =>
            `Zig-zig: Rotate ${node} ${left}, then rotate ${child} ${left}`,
    },
};
