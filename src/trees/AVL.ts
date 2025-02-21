import { MessagesObject, updateDefault } from "../../src/engine";
import { AVLNode } from "../../src/objects/avl-node";
import { BinaryDir } from "../../src/objects/binary-node";
import { HighlightCircle } from "../../src/objects/highlight-circle";
import { BST, BSTMessages } from "./BST";

export const AVLmessages = {
    node: {
        updateHeight: "Update node heights",
        unbalanced: "Node is unbalanced!",
        balanced: "Node is now balanced",
    },
};

export class AVL extends BST {
    messages: MessagesObject = updateDefault(AVLmessages, BSTMessages);
    treeRoot: AVLNode | null = null;
    pointer: HighlightCircle | null = null;

    newNode(text: string) {
        return this.Svg.avlNode(
            text,
            ...this.getNodeStart(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
    }

    getHeight(node: AVLNode | null | undefined) {
        return node ? node.getHeight() : 0;
    }

    async insertOne(value: string): Promise<{
        success: boolean;
        node: AVLNode | null;
    }> {
        const result = (await super.insertOne(value)) as {
            success: boolean;
            node: AVLNode | null;
        };

        if (result.success && result.node) {
            result.node.updateHeightPosition();
            await this.updateHeights(result.node, undefined);
            await this.updateHeightPositions();
        }
        return result;
    }

    async delete(value: string | number) {
        const result = (await super.delete(value)) as {
            success: boolean;
            direction: BinaryDir | null;
            parent: AVLNode | null;
        } | null;

        if (result?.success) {
            if (result.parent) {
                await this.updateHeights(result.parent, result.direction);
            }
            await this.updateHeightPositions();
        }
        return result;
    }

    async updateHeightPositions() {
        this.Svg.find("g").forEach((node) => {
            if (node instanceof AVLNode) {
                node.updateHeightPosition();
            }
        });
    }

    async updateHeights(
        startNode: AVLNode,
        fromchild: BinaryDir | undefined | null
    ) {
        const child = (fromchild && startNode.getChild(fromchild)) || startNode;
        this.pointer = this.Svg.highlightCircle(
            child.cx(),
            child.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );

        let node: AVLNode | null = startNode;

        while (node) {
            this.pointer.setCenter(
                node.cx(),
                node.cy(),
                this.getAnimationSpeed()
            );
            await this.pause("node.updateHeight");
            const leftHeight = this.getHeight(node.getLeft()),
                rightHeight = this.getHeight(node.getRight());

            const height = 1 + Math.max(leftHeight, rightHeight);

            if (height !== this.getHeight(node)) {
                node.setHeightHighlight(true);
                node.setHeight(height);
                await this.pause(undefined);
                node.setHeightHighlight(false);
            }

            node = await this.rebalance(node);
            node = node.getParent();
        }
        this.pointer.remove();
    }

    async rebalance(node: AVLNode) {
        const leftHeight = this.getHeight(node.getLeft());
        const rightHeight = this.getHeight(node.getRight());

        if (Math.abs(leftHeight - rightHeight) <= 1) {
            return node;
        }

        await this.pause("node.unbalanced");

        const left = leftHeight < rightHeight ? "left" : "right";
        const right = left === "left" ? "right" : "left";

        const child = node.getChild(right);
        const childLeft = this.getHeight(child?.getChild(left)),
            childRight = this.getHeight(child?.getChild(right));
        this.pointer?.hide();
        if (childLeft <= childRight) {
            node = await this.singleRotate(left, node);
        } else {
            node = await this.doubleRotate(left, node);
        }
        this.pointer = this.Svg.highlightCircle(
            node.cx(),
            node.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        await this.pause("node.balanced");
        return node;
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Rotate the tree

    async resetHeight(node: AVLNode) {
        const height =
            1 +
            Math.max(
                this.getHeight(node.getLeft()),
                this.getHeight(node.getRight())
            );

        if (height !== this.getHeight(node)) {
            node.setHeight(height);
        }
    }
}
