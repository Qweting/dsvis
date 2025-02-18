import { MessagesObject, updateDefault } from "../../src/engine";
import { AVLNode } from "../../src/objects/avl-node";
import { HighlightCircle } from "../../src/objects/highlight-circle";
import { BST, BSTMessages } from "./BST";

export class AVL extends BST {
    messages = updateDefault(AVLmessages, BSTMessages);
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
        const result = await super.insertOne(value);
        if (result.success && result.node) {
            (result.node as AVLNode).updateHeightPosition();
            await this.updateHeights(result.node as AVLNode, undefined);
            await this.updateHeightPositions();
        }
        return result as {
            success: boolean;
            node: AVLNode | null;
        };
    }

    async delete(value: string | number) {
        const result = await super.delete(value);
        if (result?.success) {
            if (result.parent) {
                await this.updateHeights(
                    result.parent as AVLNode,
                    result.direction
                );
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
        node: AVLNode,
        fromchild: "left" | "right" | undefined | null
    ) {
        const child = (fromchild && node.getChild(fromchild)) || node;
        this.pointer = this.Svg.highlightCircle(
            child.cx(),
            child.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        while (node) {
            this.pointer.setCenter(
                node.cx(),
                node.cy(),
                this.getAnimationSpeed()
            );
            await this.pause("node.updateHeight");
            const leftHeight = this.getHeight(
                    node.getLeft() as AVLNode | null | undefined
                ),
                rightHeight = this.getHeight(
                    node.getRight() as AVLNode | null | undefined
                );

            const height = 1 + Math.max(leftHeight, rightHeight);

            if (height !== this.getHeight(node)) {
                node.setHeightHighlight(true);
                node.setHeight(height);
                await this.pause(undefined);
                node.setHeightHighlight(false);
            }

            node = await this.rebalance(node);
            // @ts-expect-error TODO update types
            node = node.getParent() as AVLNode | null | undefined;
        }
        this.pointer.remove();
    }

    async rebalance(node: AVLNode) {
        const leftHeight = this.getHeight(
                node.getLeft() as AVLNode | null | undefined
            ),
            rightHeight = this.getHeight(
                node.getRight() as AVLNode | null | undefined
            );
        if (Math.abs(leftHeight - rightHeight) <= 1) {
            return node;
        }
        await this.pause("node.unbalanced");
        const left = leftHeight < rightHeight ? "left" : "right";
        const right = left === "left" ? "right" : "left";
        const child = node.getChild(right);
        const childLeft = this.getHeight(
                child?.getChild(left) as AVLNode | null | undefined
            ),
            childRight = this.getHeight(
                child?.getChild(right) as AVLNode | null | undefined
            );
        this.pointer?.hide();
        if (childLeft <= childRight) {
            node = (await this.singleRotate(left, node)) as AVLNode;
        } else {
            node = (await this.doubleRotate(left, node)) as AVLNode;
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
                this.getHeight(node.getLeft() as AVLNode),
                this.getHeight(node.getRight() as AVLNode)
            );
        if (height !== this.getHeight(node)) {
            node.setHeight(height);
        }
    }
}

export const AVLmessages: MessagesObject = {
    node: {
        updateHeight: "Update node heights",
        unbalanced: "Node is unbalanced!",
        balanced: "Node is now balanced",
    },
};
