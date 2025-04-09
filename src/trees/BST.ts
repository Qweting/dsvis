import { Text } from "@svgdotjs/svg.js";
import { Collection } from "~/collections";
import { Engine, MessagesObject } from "~/engine";
import { BSTGeneralControls } from "~/general-controls/BST-general-controls";
import { compare, parseValues } from "~/helpers";
import { BinaryDir, BinaryNode } from "~/objects/binary-node";
import { HighlightCircle } from "~/objects/highlight-circle";
import { TextCircle } from "~/objects/text-circle";

export const BSTMessages = {
    general: {
        empty: "Tree is empty",
    },
    find: {
        start: (value: string) => `Searching for ${value}`,
        found: (value: string) => `Found ${value}`,
        notfound: (value: string) => `Did not find ${value}`,
        look: (direction: BinaryDir) => `Look into ${direction} child`,
    },
    insert: {
        newroot: (value: string) => `Create a new tree root ${value}`,
        search: (value: string) => `Searching for node to insert ${value}`,
        exists: (node: string) => `There is already a node ${node}`,
        child: (value: string, direction: BinaryDir) =>
            `Insert ${value} as ${direction} child`,
    },
    delete: {
        search: (value: string) => `Searching for node to delete ${value}`,
        notexists: (value: string) => `There is no node ${value}`,
        found: (value: string) => `Found node ${value} to delete`,
        predecessor: {
            search: (node: string) => `Finding the predecessor node of ${node}`,
            replace: (node: string, predecessor: string) =>
                `Replace the value of ${node} with ${predecessor}`,
            delete: (predecessor: string) =>
                `Now delete the predecessor ${predecessor}`,
        },
        redirect: (parent: string, child: string) =>
            `Redirect parent ${parent} to child ${child}`,
        root: {
            singleton: (root: string) => `Remove the root node ${root}`,
            onechild: (child: string, root: string) =>
                `Make the child ${child} the new root,\nand remove node ${root}`,
        },
        node: (node: string) => `Remove node ${node}`,
        leaf: (node: string) => `Remove leaf node ${node}`,
    },
    rotate: {
        single: (node: string, dir: BinaryDir) => `Rotate ${node} ${dir}`,
        zigzag: (
            child: string,
            dir1: BinaryDir,
            node: string,
            dir2: BinaryDir
        ) => `Zig-zag: Rotate ${child} ${dir1}, then rotate ${node} ${dir2}`,
    },
} as const satisfies MessagesObject;

export class BST<Node extends BinaryNode = BinaryNode>
    extends Engine
    implements Collection
{
    messages: MessagesObject = BSTMessages;
    treeRoot: Node | null = null;
    generalControls: BSTGeneralControls;

    constructor(containerSelector: string) {
        super(containerSelector);

        this.generalControls = new BSTGeneralControls(this.container, this);
    }

    resetAlgorithm() {
        super.resetAlgorithm();
        this.treeRoot = null;
    }

    /**
     * Creates a new `BinaryNode` SVG element with the given text.
     *
     * @param text - The text content for the new node.
     * @returns The initialized `BinaryNode` SVG element.
     */
    newNode(text: string): BinaryNode {
        return this.Svg.put(
            new BinaryNode(text, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
    }

    /**
     * Recalculates and animates the layout of the tree from the root down.
     * Skips animation if the tree is in a resetting state.
     *
     * @returns The current instance for chaining.
     */
    resizeTree(): this {
        const animate = !this.state.isResetting();
        this.treeRoot?.resize(
            ...this.getTreeRoot(),
            this.$Svg.margin,
            this.getNodeSpacing(),
            animate ? this.$Svg.animationSpeed : 0
        );

        return this;
    }

    /**
     * Inserts multiple values into the binary tree.
     *
     * @param values - An array of values to insert into the tree.
     * @returns A promise that resolves once all values are inserted.
     */
    async insert(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    /**
     * Searches for multiple values in the binary tree.
     *
     * @param values - An array of values to search for in the tree.
     * @returns A promise that resolves once all values are searched.
     */
    async find(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.findOne(val);
        }
    }

    /**
     * Searches for a node with the given value and highlights the result.
     * Uses `findHelper` internally and adds visual feedback.
     *
     * @param value - The value to search for in the tree.
     * @returns A promise that resolves to an object containing:
     * - `success`: Whether the node was found.
     * - `node`: The found node, or the last visited node if not found.
     */
    async findOne(value: string | number): Promise<{
        success: boolean;
        node: Node | null;
    }> {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return { success: false, node: null };
        }

        await this.pause("find.start", value);
        const found = await this.findHelper(value);
        const node = found.success ? found.node : found.parent;

        node.setHighlight(true);
        const path = found.success ? "find.found" : "find.notfound";
        await this.pause(path, value);
        node.setHighlight(false);

        return { node, success: found.success };
    }

    /**
     * Searches for a node with the given value in the tree.
     * Returns the node if found, or the last visited parent if not.
     *
     * @param value - The value to search for in the tree.
     * @returns A promise that resolves to an object:
     * - `success: true` and the found node, or
     * - `success: false` and the last parent node encountered.
     *
     * @throws If the tree is empty when the function is called.
     */
    async findHelper(value: string | number): Promise<
        | {
              success: true;
              node: Node;
          }
        | {
              success: false;
              parent: Node;
          }
    > {
        if (!this.treeRoot) {
            throw new Error(
                "Expected root node to exist when find helper was called"
            );
        }

        let parent: Node = this.treeRoot;
        let node: Node | null = this.treeRoot;
        const pointer = this.Svg.put(new HighlightCircle()).init(
            this.treeRoot.cx(),
            this.treeRoot.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );

        while (node) {
            node.setHighlight(true);
            const cmp = compare(value, node.getText());
            if (cmp === 0) {
                pointer.remove();
                node.setHighlight(false);
                return { success: true, node: node };
            }

            const direction = cmp < 0 ? "left" : "right";
            node.setChildHighlight(direction, true);
            parent = node;
            node = parent.getChild(direction);
            if (node) {
                pointer.setCenter(
                    node.cx(),
                    node.cy(),
                    this.getAnimationSpeed()
                );
            }

            await this.pause("find.look", direction);
            parent.setChildHighlight(direction, false);
        }

        pointer.remove();
        return { success: false, parent };
    }

    /**
     * Inserts a value into the binary tree. If the tree is empty, creates a new root.
     * If the value already exists, highlights the existing node and aborts insertion.
     *
     * @param value - The value to insert into the tree.
     * @returns A promise that resolves to an object containing:
     * - `success`: Whether the insertion was successful.
     * - `node`: The inserted node, or the existing node if the value was already present.
     */
    async insertOne(value: string | number) {
        value = String(value); //TODO: Check if this can be handled better
        if (!this.treeRoot) {
            this.treeRoot = this.newNode(value) as Node;
            await this.pause("insert.newroot", value);
            this.resizeTree();
            await this.pause(undefined);
            return { success: true, node: this.treeRoot };
        }

        await this.pause("insert.search", value);
        const found = await this.findHelper(value);
        if (found.success) {
            found.node.setHighlight(true);
            await this.pause("insert.exists", found.node);
            found.node.setHighlight(false);
            return { success: false, node: found.node };
        }

        const child = this.newNode(value) as Node;
        const cmp = compare(value, found.parent.getText());
        const direction = cmp < 0 ? "left" : "right";

        found.parent.setChild(direction, child, this.getStrokeWidth());
        child.setHighlight(true);
        found.parent.setChildHighlight(direction, true);
        await this.pause("insert.child", value, direction);
        found.parent.setChildHighlight(direction, false);
        child.setHighlight(false);

        this.resizeTree();
        await this.pause(undefined);

        return { success: true, node: child };
    }

    /**
     * Deletes multiple values from the binary tree.
     *
     * @param values - An array of values to delete from the tree.
     * @returns A promise that resolves once all values are deleted.
     */
    async delete(...values: (string | number)[]) {
        for (const val of values) {
            await this.deleteOne(val);
        }
    }

    /**
     * Deletes a node with the given value from the tree.
     * If the node exists, it is removed; otherwise, a failure result is returned.
     *
     * @param value - The value to delete from the tree.
     * @returns A promise that resolves to an object indicating success,
     * the parent of the deleted node (if any), and the direction from the parent.
     */
    async deleteOne(value: string | number): Promise<{
        success: boolean;
        direction: BinaryDir | null;
        parent: Node | null;
    }> {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return { success: false, parent: null, direction: null };
        }

        await this.pause("delete.search", value);
        const found = await this.findHelper(value);
        if (!found.success) {
            found.parent.setHighlight(true);
            await this.pause("delete.notexists", value);
            found.parent.setHighlight(false);
            const direction =
                compare(value, found.parent.getText()) < 0 ? "left" : "right";
            return {
                success: false,
                direction: direction,
                parent: found.parent,
            };
        }

        found.node.setHighlight(true);
        await this.pause("delete.found", value);
        return await this.deleteHelper(found.node);
    }

    /**
     * Handles deletion of a node that has up to two children by replacing it with its in-order predecessor.
     * The actual removal is then delegated to `deleteNode`, which handles the simplified case.
     *
     * @param node - The node to delete. Can have both left and right children.
     * @returns A promise that resolves once the deletion (and visual updates) are complete.
     * @returns A promise that resolves to an object containing:
     * - `success`: If the removal was successful
     * - `direction`: The direction from the parent to the deleted node ("left" or "right"), or `null` if the node was the root.
     * - `parent`: The parent of the deleted node, or `null` if it was the root.
     *
     */
    async deleteHelper(node: Node) {
        const leftChild = node.getLeft();
        if (!(leftChild && node.getRight())) {
            return await this.deleteNode(node);
        }

        // Below we know that we have both left and right children

        const pointer = this.Svg.put(new HighlightCircle()).init(
            node.cx(),
            node.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );

        node.setHighlight(false);
        node.addClass("marked");
        await this.pause("delete.predecessor.search", node);

        let predecessor = leftChild;
        while (true) {
            predecessor.setParentHighlight(true);
            pointer.setCenter(
                predecessor.cx(),
                predecessor.cy(),
                this.getAnimationSpeed()
            );
            await this.pause(undefined);
            predecessor.setParentHighlight(false);
            const rightChild = predecessor.getRight();
            if (!rightChild) {
                break;
            }

            predecessor = rightChild;
        }

        predecessor.setHighlight(true);
        pointer.remove();
        const newText = predecessor.getText();
        const moving = this.Svg.put(
            new TextCircle(newText, this.getObjectSize(), this.getStrokeWidth())
        ).init(predecessor.cx(), predecessor.cy());
        moving.addClass("unfilled");
        moving.setHighlight(true);
        await this.pause("delete.predecessor.replace", node, predecessor);

        moving.setCenter(node.cx(), node.cy(), this.getAnimationSpeed());
        node.setText("");
        await this.pause(undefined);

        node.setText(newText);
        moving.remove();
        node.removeClass("marked");
        await this.pause("delete.predecessor.delete", predecessor);

        return await this.deleteNode(predecessor);
    }

    /**
     * Deletes a node from the binary tree.
     * This function assumes that the node has at most one child.
     * Cases with two children should be handled by `deleteHelper`.
     *
     * @param node - The node to delete. Can at most have one child.
     * @returns A promise that resolves to an object containing:
     * - `success`: Always `true` when resolved.
     * - `direction`: The direction from the parent to the deleted node ("left" or "right"), or `null` if the node was the root.
     * - `parent`: The parent of the deleted node, or `null` if it was the root.
     *
     * @throws Will throw an error if the node has two children, which violates the function's assumption.
     */
    async deleteNode(node: Node): Promise<{
        success: true;
        direction: BinaryDir | null;
        parent: Node | null;
    }> {
        if (node.getLeft() && node.getRight()) {
            throw new Error(
                "Expected node to only have one or zero children when delete node was called"
            );
        }

        const child = node.getLeft() || node.getRight();
        const parent = node.getParent();

        if (!parent) {
            if (!child) {
                this.treeRoot = null;
                await this.pause("delete.root.singleton", node);
            } else {
                this.treeRoot = child;
                await this.pause("delete.root.onechild", child, node);
            }

            node.remove();
            this.resizeTree();
            await this.pause(undefined);

            return { success: true, direction: null, parent: null };
        }

        const direction = parent.getLeft() === node ? "left" : "right";

        if (child) {
            node.setHighlight(false);

            if (child === parent.getLeft()?.getLeft()) {
                node.dMoveCenter(
                    -node.getSize(),
                    -node.getSize() / 2,
                    this.getAnimationSpeed()
                );
            }

            if (child === parent.getRight()?.getRight()) {
                node.dMoveCenter(
                    node.getSize(),
                    -node.getSize() / 2,
                    this.getAnimationSpeed()
                );
            }

            parent.setChild(direction, child, this.getStrokeWidth());
            child.setHighlight(true);
            parent.setChildHighlight(direction, true);
            await this.pause("delete.redirect", parent, child);
            parent.setChildHighlight(direction, false);
            child.setHighlight(false);
            node.setHighlight(true);
            await this.pause("delete.node", node);
        } else {
            await this.pause("delete.leaf", node);
        }

        node.remove();
        this.resizeTree();
        await this.pause(undefined);

        return { success: true, direction: direction, parent: parent };
    }

    /**
     * Prints all nodes of the binary tree starting from the root.
     *
     * @returns A promise that resolves once all nodes are printed.
     */
    async print(): Promise<void> {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return;
        }

        const { x, y } = this.info.printer.bbox();

        const printed = [
            this.Svg.text("Printed nodes: ").addClass("printer").x(x).y(y),
        ];

        const pointer = this.Svg.put(new HighlightCircle()).init(
            ...this.getNodeStart(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );

        await this.printHelper(this.treeRoot, pointer, printed);

        pointer.remove();

        await this.pause(undefined);

        for (const lbl of printed) {
            lbl.remove();
        }
    }

    /**
     * Recursively prints the nodes of the tree starting from the given node,
     * traversing in an in-order manner.
     *
     * @param node - The node to start printing from.
     * @param pointer - A `HighlightCircle` to visually follow the traversal.
     * @param printed - An array of printed `Text` elements to manage layout.
     * @returns A promise that resolves once all nodes are printed.
     */
    async printHelper(
        node: Node,
        pointer: HighlightCircle,
        printed: Text[]
    ): Promise<void> {
        pointer.setCenter(node.cx(), node.cy(), this.getAnimationSpeed());
        await this.pause(undefined);

        if (node.getLeft()) {
            await this.printHelper(node.getLeft()!, pointer, printed); // ! Because checked above
            pointer.setCenter(node.cx(), node.cy(), this.getAnimationSpeed());
            await this.pause(undefined);
        }

        const lbl = this.Svg.text(node.getText()).center(node.cx(), node.cy());
        await this.pause(undefined);

        const last = printed[printed.length - 1];
        const spacing = this.getNodeSpacing() / 2;
        this.animate(lbl)
            .cy(last.cy())
            .x(last.bbox().x2 + spacing);

        printed.push(lbl);
        await this.pause(undefined);

        if (node.getRight()) {
            await this.printHelper(node.getRight()!, pointer, printed);
            pointer.setCenter(node.cx(), node.cy(), this.getAnimationSpeed());
            await this.pause(undefined);
        }
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Rotate the tree
    // These are not used by BST, but by self-balancing subclasses
    // The following rotations are implemented:
    //  - Single Rotate: Left and Right (also known as Zig)
    //  - Double Rotate: Left-Right and Right-Left (also known as Zig-Zag)

    /**
     * BSTs do not store the height in the nodes, so do nothing
     * This is implemented by, e.g., AVL trees
     */
    async resetHeight(node: Node) {}

    /**
     * Performs a double rotation on the given node to maintain AVL tree balance.
     *
     * @param firstDir - The primary rotation direction. Same as first part of "left-right" or "right-left"
     * @param node - The node to rotate.
     * @returns A promise resolving to the new root of the rotated subtree.
     * @throws Error If the necessary child nodes for the rotation is missing.
     */
    async doubleRotate(firstDir: BinaryDir, node: Node): Promise<Node> {
        const secondDir = firstDir === "left" ? "right" : "left";
        const child = node.getChild(secondDir);

        if (child === null) {
            throw new Error("Missing child for the secondary rotation");
        }

        await this.pause("rotate.zigzag", child, secondDir, node, firstDir);
        await this.singleRotate(secondDir, child);
        return await this.singleRotate(firstDir, node);
    }

    /**
     * Performs a single rotation on the given node in the specified direction.
     *
     * @param dir - The direction of the initial rotation.
     * @param node - The node to rotate.
     * @returns A promise resolving to the new root of the rotated subtree.
     * @throws Error If the necessary child node for rotation is missing.
     */
    async singleRotate(dir: BinaryDir, node: Node): Promise<Node> {
        const oppositeDir = dir === "left" ? "right" : "left";

        const A = node;
        const B = A.getChild(oppositeDir);

        if (B === null) {
            throw new Error("Invalid B node in singleRotate");
        }

        const C = B.getChild(dir);

        A.setChildHighlight(oppositeDir, true);
        B.setHighlight(true);
        await this.pause("rotate.single", A, dir);

        const parent = A.getParent();
        if (parent) {
            const direction = parent.getLeft() === A ? "left" : "right";
            B.setParent(direction, parent, this.getStrokeWidth());
        } else {
            this.treeRoot = B;
        }

        A.setChild(oppositeDir, C, this.getStrokeWidth());
        B.setChild(dir, A, this.getStrokeWidth());

        B.setChildHighlight(dir, true);
        A.setHighlight(true);
        await this.pause(undefined);
        this.resizeTree();
        await this.pause(undefined);

        B.setChildHighlight(dir, false);
        A.setHighlight(false);
        await this.resetHeight(A);
        await this.resetHeight(B);

        return B;
    }
}
