import { Collection } from "~/collections";
import { MessagesObject } from "~/engine";
import { updateDefault } from "~/helpers";
import { BinaryDir } from "~/objects/binary-node";
import { RedBlackNode } from "~/objects/red-black-node";
import { BST, BSTMessages } from "./BST";

const RedBlackMessages = {
    color: {
        redRootBlack: "Tree root is red: Color it black",
        rootBlack: "Color the root black",
        nodeBlack: (n: RedBlackNode) => `Color node ${n} black`,
        pushDownBlack: (
            node: RedBlackNode,
            parent: RedBlackNode,
            pibling: RedBlackNode
        ) =>
            `Node ${node}, parent ${parent} and parent's sibling ${pibling} are all red\nPush blackness down from grandparent`,
        switch: (
            parent: RedBlackNode,
            dir: BinaryDir,
            dirChild: RedBlackNode
        ) =>
            `Parent ${parent} is red,\n${dir} child ${dirChild} and its children are black:\nSwitch colors`,
        childRed: (
            parent: RedBlackNode,
            dir: BinaryDir,
            dirChild: RedBlackNode
        ) =>
            `Parent ${parent}, ${dir} child ${dirChild} and its children are black:\nColor ${dir} child red`,
    },
    balancing: {
        parentImbalanced: (parent: RedBlackNode) =>
            `Parent ${parent} is imbalanced`,
    },
    rotate: {
        parent: (
            node: RedBlackNode,
            side: BinaryDir,
            rotate: BinaryDir,
            parent: RedBlackNode
        ) =>
            `Node ${node} is a red ${side} child of a red ${rotate} child\nRotate parent ${parent} ${rotate}`,
        grandparent: (
            node: RedBlackNode,
            side: BinaryDir,
            grandparent: RedBlackNode,
            rotate: BinaryDir
        ) =>
            `Node ${node} is a red ${side} child of a red ${side} child\nSwitch colors and rotate grandparent ${grandparent} ${rotate}`,
        redSibling: (
            parent: RedBlackNode,
            right: BinaryDir,
            rightChild: RedBlackNode,
            left: BinaryDir
        ) =>
            `Parent ${parent} is black, and its ${right} child ${rightChild} is red:\nSwitch colors and rotate ${left}`,
        redDistantChild: (
            right: BinaryDir,
            rightChild: RedBlackNode,
            left: BinaryDir
        ) =>
            `${right} child ${rightChild} is black, its ${right} child is red:\nSwitch colors and rotate ${left}`,
        redCloseChild: (
            right: BinaryDir,
            rightChild: RedBlackNode,
            left: BinaryDir
        ) =>
            `${right} child ${rightChild} is black, its ${left} child is red:\nSwitch colors and rotate child ${right}`,
    },
} as const satisfies MessagesObject;

export class RedBlack extends BST<RedBlackNode> implements Collection {
    messages: MessagesObject = updateDefault(RedBlackMessages, BSTMessages);

    newNode(text: string): RedBlackNode {
        return this.Svg.put(
            new RedBlackNode(text, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
    }

    async insertOne(value: string) {
        const result = await super.insertOne(value);
        if (result.success) {
            await this.fixDoubleRed(result.node);
            if (this.treeRoot && this.treeRoot.isRed()) {
                await this.pause("color.redRootBlack");
                this.treeRoot.colorBlack();
            }
        }
        return result;
    }

    async fixDoubleRed(node: RedBlackNode) {
        let parent = node.getParent();
        if (!parent) {
            return;
        }
        if (!parent.isRed()) {
            return;
        }

        let grandparent = parent.getParent();
        if (!grandparent) {
            return;
        }

        const pibling = parent.getSibling();
        if (pibling && pibling.isRed()) {
            node.setHighlight(true);
            parent.setHighlight(true);
            pibling.setHighlight(true);
            await this.pause("color.pushDownBlack", node, parent, pibling);
            node.setHighlight(false);
            parent.setHighlight(false);
            pibling.setHighlight(false);
            pibling.colorBlack();
            parent.colorBlack();
            grandparent.colorRed();
            await this.pause(undefined);
            await this.fixDoubleRed(grandparent);
            return;
        }

        let side: BinaryDir = node.isLeftChild() ? "left" : "right";
        let rotate: BinaryDir = parent.isLeftChild() ? "left" : "right";
        if (side !== rotate) {
            node.setHighlight(true);
            parent.setHighlight(true);
            grandparent.setHighlight(true);
            await this.pause("rotate.parent", node, side, rotate, parent);
            node.setHighlight(false);
            parent.setHighlight(false);
            grandparent.setHighlight(false);
            node = (await this.singleRotate(rotate, parent)).getChild(
                rotate
            ) as RedBlackNode;
        }

        side = node.isLeftChild() ? "left" : "right";
        rotate = side === "left" ? "right" : "left";
        parent = node.getParent();
        grandparent = parent?.getParent() || null;

        if (!parent || !grandparent) {
            throw new Error("Missing parent or grandparent");
        }

        node.setHighlight(true);
        parent.setHighlight(true);
        grandparent.setHighlight(true);
        await this.pause("rotate.grandparent", node, side, grandparent, rotate);
        node.setHighlight(false);
        parent.setHighlight(false);
        grandparent.setHighlight(false);
        parent.colorBlack();
        grandparent.colorRed();
        await this.singleRotate(rotate, grandparent);
    }

    async deleteOne(value: string | number) {
        const result = await super.deleteOne(value);
        if (result.success) {
            if (result.parent && result.direction) {
                await this.fixDeleteImbalance(result.parent, result.direction);
            }
            if (this.treeRoot && this.treeRoot.isRed()) {
                this.treeRoot.colorBlack();
                await this.pause("color.rootBlack");
            }
        }
        return result;
    }

    async fixDeleteImbalance(parent: RedBlackNode, dir: BinaryDir) {
        const child = parent.getChild(dir);
        if (child && child.isRed()) {
            child.colorBlack();
            child.setHighlight(true);
            await this.pause("color.nodeBlack", child);
            child.setHighlight(false);
        } else if (!parent.isLeaf()) {
            await this.fixDoubleBlack(parent, dir);
        }
    }

    async fixDoubleBlack(parent: RedBlackNode, left: BinaryDir) {
        // TODO: Fix variable names
        const right = left === "left" ? "right" : "left";
        const rightChild = parent.getChild(right);
        const rightGrandchild = rightChild?.getChild(right);
        const leftGrandchild = rightChild?.getChild(left);

        if (!rightChild || !leftGrandchild || !rightGrandchild) {
            throw new Error(
                "Missing right child, left grand child or right grand child"
            );
        }

        parent.setHighlight(true);
        await this.pause("balancing.parentImbalanced", parent);

        // Sibling is red
        if (rightChild.isRed()) {
            parent.setChildHighlight(right, true);
            rightChild.setHighlight(true);
            await this.pause(
                "rotate.redSibling",
                parent,
                right,
                rightChild,
                left
            );
            parent.setChildHighlight(right, false);
            rightChild.setHighlight(false);

            rightChild.colorBlack();
            parent.colorRed();
            await this.singleRotate(left, parent);
            await this.fixDoubleBlack(parent, left);
            return;
        }

        // Sibling's distant child is red
        if (rightGrandchild.isRed()) {
            parent.setChildHighlight(right, true);
            rightChild.setChildHighlight(right, true);
            rightGrandchild.setHighlight(true);
            await this.pause("rotate.redDistantChild", right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setChildHighlight(right, false);
            rightGrandchild.setHighlight(false);

            if (parent.isBlack()) {
                rightChild.colorBlack();
            } else {
                rightChild.colorRed();
            }
            parent.colorBlack();
            rightGrandchild.colorBlack();
            await this.singleRotate(left, parent);
            return;
        }

        // Sibling's close child is red
        if (leftGrandchild.isRed()) {
            parent.setChildHighlight(right, true);
            rightChild.setChildHighlight(left, true);
            leftGrandchild.setHighlight(true);
            await this.pause("rotate.redCloseChild", right, rightChild, left);
            parent.setChildHighlight(right, false);
            rightChild.setChildHighlight(left, false);
            leftGrandchild.setHighlight(false);

            rightChild.colorRed();
            leftGrandchild.colorBlack();
            await this.singleRotate(right, rightChild);
            await this.fixDoubleBlack(parent, left);
            return;
        }

        // Parent is red
        if (parent.isRed()) {
            parent.setChildHighlight(right, true);
            rightChild.setHighlight(true);
            await this.pause("color.switch", parent, right, rightChild);
            parent.setChildHighlight(right, false);
            rightChild.setHighlight(false);

            parent.colorBlack();
            rightChild.colorRed();
            return;
        }

        // All are black
        parent.setChildHighlight(right, true);
        rightChild.setHighlight(true);
        await this.pause("color.childRed", parent, right, rightChild);
        parent.setChildHighlight(right, false);
        rightChild.setHighlight(false);

        rightChild.colorRed();
        const grandparent = parent.getParent();
        if (grandparent) {
            const direction =
                parent === grandparent.getLeft() ? "left" : "right";
            await this.fixDoubleBlack(grandparent, direction);
        }
    }
}
