import {BinaryNode} from "src/objects/binary-node";
import {BST, BSTMessages} from "./BST";

export class RedBlack extends BST {
    messages = {
        ...BSTMessages,
        ...RedBlackMessages,
        rotate: {
            ...BSTMessages.rotate,
            ...RedBlackMessages.rotate,
        },
    };

    newNode(text: string) {
        return super.newNode(text).addClass("red");
    }

    async insertOne(value: string) {
        const result = await super.insertOne(value);
        if (result?.success && result.node) {
            await this.fixDoubleRed(result.node);
            if (this.treeRoot && this.isRed(this.treeRoot)) {
                await this.pause("color.redRootBlack");
                this.colorBlack(this.treeRoot);
            }
        }
        return result;
    }

    async fixDoubleRed(node: BinaryNode) {
        let parent = node.getParent();
        if (!parent) return;
        if (!this.isRed(parent)) return;

        let grandparent = parent.getParent();
        if (!grandparent) return;

        const pibling = parent.getSibling();
        if (pibling && this.isRed(pibling)) {
            node.setHighlight(true);
            parent.setHighlight(true);
            pibling.setHighlight(true);
            await this.pause("color.pushDownBlack", node, parent, pibling);
            node.setHighlight(false);
            parent.setHighlight(false);
            pibling.setHighlight(false);
            this.colorBlack(pibling);
            this.colorBlack(parent);
            this.colorRed(grandparent);
            await this.pause(undefined);
            await this.fixDoubleRed(grandparent);
            return;
        }

        let side: "left" | "right" = node.isLeftChild() ? "left" : "right";
        let rotate: "left" | "right" = parent.isLeftChild() ? "left" : "right";
        if (side !== rotate) {
            node.setHighlight(true);
            parent.setHighlight(true);
            grandparent.setHighlight(true);
            await this.pause("rotate.parent", node, side, rotate, parent),
            node.setHighlight(false);
            parent.setHighlight(false);
            grandparent.setHighlight(false);
            node = (await this.singleRotate(rotate, parent)).getChild(
                rotate
            ) as BinaryNode;
        }

        side = node.isLeftChild() ? "left" : "right";
        rotate = side === "left" ? "right" : "left";
        parent = node.getParent();
        grandparent = parent?.getParent() || null;

        if (!parent || !grandparent)
            throw new Error("Missing parent or grandparent");

        node.setHighlight(true);
        parent.setHighlight(true);
        grandparent?.setHighlight(true);
        await this.pause("rotate.grandparent", node, side, grandparent, rotate);
        node.setHighlight(false);
        parent.setHighlight(false);
        grandparent?.setHighlight(false);
        this.colorBlack(parent);
        this.colorRed(grandparent);
        await this.singleRotate(rotate, grandparent as BinaryNode);
    }

    async delete(value: string | number) {
        const result = await super.delete(value);
        if (result?.success) {
            if (result.parent && result.direction) {
                await this.fixDeleteImbalance(result.parent, result.direction);
            }
            if (this.treeRoot && this.isRed(this.treeRoot)) {
                this.colorBlack(this.treeRoot);
                await this.pause("color.rootBlack");
            }
        }
        return result;
    }

    async fixDeleteImbalance(parent: BinaryNode, dir: "left" | "right") {
        const child = parent.getChild(dir);
        if (child && this.isRed(child)) {
            this.colorBlack(child);
            child.setHighlight(true);
            await this.pause("color.nodeBlack", child);
            child.setHighlight(false);
        } else if (!parent.isLeaf()) {
            await this.fixDoubleBlack(parent, dir);
        }
    }

    async fixDoubleBlack(parent: BinaryNode, left: "left" | "right") {
    // TODO: Fix variable names
        const right = left === "left" ? "right" : "left";
        const rightChild = parent.getChild(right);
        const rightGrandchild = rightChild?.getChild(right);
        const leftGrandchild = rightChild?.getChild(left);
        parent.setHighlight(true);
        await this.pause("balancing.parentImbalanced", parent);

        // Sibling is red
        if (rightChild && this.isRed(rightChild)) {
            parent.setChildHighlight(right, true);
            rightChild.setHighlight(true);
            await this.pause("rotate.redSibling", parent, right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setHighlight(false);

            this.colorBlack(rightChild);
            this.colorRed(parent);
            await this.singleRotate(left, parent);
            await this.fixDoubleBlack(parent, left);
            return;
        }

        // Sibling's distant child is red
        if (rightGrandchild && this.isRed(rightGrandchild)) {
            parent.setChildHighlight(right, true);
            rightChild?.setChildHighlight(right, true);
            rightGrandchild.setHighlight(true);
            await this.pause("rotate.redDistantChild", right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild?.setChildHighlight(right, false);
            rightGrandchild.setHighlight(false);

            if (this.isBlack(parent)) this.colorBlack(rightChild as BinaryNode);
            else this.colorRed(rightChild as BinaryNode);
            this.colorBlack(parent);
            this.colorBlack(rightGrandchild);
            await this.singleRotate(left, parent);
            return;
        }

        // Sibling's close child is red
        if (rightChild && leftGrandchild && this.isRed(leftGrandchild)) {
            parent.setChildHighlight(right, true);
            rightChild.setChildHighlight(left, true);
            leftGrandchild.setHighlight(true);
            await this.pause("rotate.redCloseChild", right, rightChild, left);
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
            rightChild?.setHighlight(true);
            await this.pause("color.switch", parent, right, rightChild);
            parent.setChildHighlight(right, false);
            rightChild?.setHighlight(false);

            this.colorBlack(parent);
            this.colorRed(rightChild as BinaryNode);
            return;
        }

        // All are black
        parent.setChildHighlight(right, true);
        rightChild?.setHighlight(true);
        await this.pause("color.childRed", parent, right, rightChild);
        parent.setChildHighlight(right, false);
        rightChild?.setHighlight(false);

        this.colorRed(rightChild as BinaryNode);
        const grandparent = parent.getParent();
        if (grandparent) {
            const direction = parent === grandparent.getLeft() ? "left" : "right";
            await this.fixDoubleBlack(grandparent, direction);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Red/black level

    isBlack(node: BinaryNode) {
        return !node || node.hasClass("black");
    }

    isRed(node: BinaryNode) {
        return !this.isBlack(node);
    }

    colorBlack(node: BinaryNode) {
        node.addClass("black");
    }

    colorRed(node: BinaryNode) {
        node.removeClass("black");
    }
}

const RedBlackMessages = {
    color: {
        redRootBlack: "Tree root is red: Color it black",
        rootBlack: "Color the root black",
        nodeBlack: (n: BinaryNode) => `Color node ${n} black`,
        pushDownBlack: (
            node: BinaryNode,
            parent: BinaryNode,
            pibling: BinaryNode
        ) => [
            `Node ${node}, parent ${parent} and parent's sibling ${pibling} are all red`,
            "Push blackness down from grandparent",
        ],
        switch: (
            parent: BinaryNode,
            dir: "left" | "right",
            dirChild: BinaryNode
        ) => [
            `Parent ${parent} is red,`,
            `${dir} child ${dirChild} and its children are black:`,
            "Switch colors",
        ],
        childRed: (
            parent: BinaryNode,
            dir: "left" | "right",
            dirChild: BinaryNode
        ) => [
            `Parent ${parent}, ${dir} child ${dirChild} and its children are black:`,
            `Color ${dir} child red`,
        ],
    },
    balancing: {
        parentImbalanced: (parent: BinaryNode) => `Parent ${parent} is imbalanced`,
    },
    rotate: {
        parent: (
            node: BinaryNode,
            side: "left" | "right",
            rotate: "left" | "right",
            parent: BinaryNode
        ) => [
            `Node ${node} is a red ${side} child of a red ${rotate} child`,
            `Rotate parent ${parent} ${rotate}`,
        ],
        grandparent: (
            node: BinaryNode,
            side: "left" | "right",
            grandparent: BinaryNode,
            rotate: "left" | "right"
        ) => [
            `Node ${node} is a red ${side} child of a red ${side} child`,
            `Switch colors and rotate grandparent ${grandparent} ${rotate}`,
        ],
        redSibling: (
            parent: BinaryNode,
            right: "left" | "right",
            rightChild: BinaryNode,
            left: "left" | "right"
        ) => [
            `Parent ${parent} is black, and its ${right} child ${rightChild} is red:`,
            `Switch colors and rotate ${left}`,
        ],
        redDistantChild: (
            right: "left" | "right",
            rightChild: BinaryNode,
            left: "left" | "right"
        ) => [
            `${right} child ${rightChild} is black, its ${right} child is red:`,
            `Switch colors and rotate ${left}`,
        ],
        redCloseChild: (
            right: "left" | "right",
            rightChild: BinaryNode,
            left: "left" | "right"
        ) => [
            `${right} child ${rightChild} is black, its ${left} child is red:`,
            `Switch colors and rotate child ${right}`,
        ],
    },
} as const;
