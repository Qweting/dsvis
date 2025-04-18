import { Collection } from "~/collections";
import { MessagesObject } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { BinaryDir, BinaryNode } from "~/objects/binary-node";
import { BST, BSTMessages } from "./BST";

const SplayTreeMessages = {
    delete: {
        root: "Remove root, leaving left and right trees",
        singleChild: (right: BinaryDir, left: BinaryDir) =>
            `No ${right} tree, make ${left} tree the root`,
        splayLargest: "Splay largest element in left tree to root",
        connectLeftRight:
            "Left tree now has no right subtree, connect left and right trees",
    },
    rotate: {
        splayUp: (node: BinaryNode) => `Now splaying ${node} up to the root`,
        zigzig: (node: BinaryNode, left: BinaryDir, child: BinaryNode) =>
            `Zig-zig: Rotate ${node} ${left}, then rotate ${child} ${left}`,
    },
} as const satisfies MessagesObject;

export class SplayTree extends BST implements Collection {
    messages: MessagesObject = updateDefault(SplayTreeMessages, BSTMessages);
    async findOne(value: string | number) {
        const found = await super.findOne(value);
        if (found.node) {
            await this.splayUp(found.node);
        }
        return found;
    }

    async insertOne(value: string) {
        const result = await super.insertOne(value);
        if (result.node) {
            if (!result.success) {
                await this.pause("insert.exists", result.node);
            }
            await this.splayUp(result.node);
        }
        return result;
    }

    async deleteOne(value: string): Promise<{
        success: boolean;
        direction: BinaryDir | null;
        parent: BinaryNode | null;
    }> {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return { success: false, direction: null, parent: null };
        }

        await this.findOne(value);
        if (compare(value, this.treeRoot.getText()) !== 0) {
            await this.pause("delete.notexists", value);
            return { success: false, parent: null, direction: null };
        }

        const rightNode = this.treeRoot.getRight();
        const leftNode = this.treeRoot.getLeft();

        this.treeRoot.setHighlight(true);
        await this.pause("delete.root");
        if (!(leftNode && rightNode)) {
            const newRoot = leftNode || rightNode;
            // TODO: Fix variable names
            const left = newRoot
                ? this.treeRoot.getLeft()
                    ? "left"
                    : "right"
                : null;
            const right = left === "left" ? "right" : "left";

            this.treeRoot.remove();

            if (newRoot) {
                newRoot.setHighlight(true);
                await this.pause("delete.singleChild", right, left);
            }
            this.treeRoot = newRoot;
            this.resizeTree();

            await this.pause(undefined);
            return { success: true, parent: this.treeRoot, direction: left };
        }

        this.treeRoot.remove();
        await this.pause("delete.splayLargest");

        let largestLeft = leftNode;
        largestLeft.setHighlight(true);
        await this.pause(undefined);
        while (largestLeft.getRight()) {
            largestLeft.setHighlight(false);
            largestLeft = largestLeft.getRight()!;
            largestLeft.setHighlight(true);
            await this.pause(undefined);
        }
        largestLeft.setHighlight(false);
        await this.splayUp(largestLeft);
        await this.pause("delete.connectLeftRight");
        largestLeft.setHighlight(true);
        await this.pause(undefined);
        largestLeft.setHighlight(false);
        largestLeft.setRight(rightNode, this.getStrokeWidth());
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
            const grandparent = parent.getParent();
            if (!grandparent) {
                node = await this.singleRotate(right, parent);
            } else if (parent.isChild(right)) {
                node = await this.doubleRotate(left, grandparent);
                // this.splayHelper(node);
            } else {
                // node = await this.singleRotate(right, parent);
                node = await this.zigZig(right, grandparent);
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
        const grandparent = parent.getParent();
        if (!grandparent) {
            this.singleRotate(left, parent);
        } else if (parent.isChild(right)) {
            this.doubleRotate(left, grandparent);
            this.splayHelper(node);
        } else {
            this.zigZig(right, grandparent);
            this.splayHelper(node);
        }
    }

    async zigZig(left: BinaryDir, node: BinaryNode) {
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
