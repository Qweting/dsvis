import { Collection } from "@/collections";
import { Engine, MessagesObject } from "@/engine";
import { compare, parseValues } from "@/helpers";
import { BinaryDir, BinaryNode } from "@/objects/binary-node";
import { HighlightCircle } from "@/objects/highlight-circle";
import { TextCircle } from "@/objects/text-circle";
import { BSTToolbar } from "@/toolbars/BST-toolbar";
import { Text } from "@svgdotjs/svg.js";

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
};

export class BST<Node extends BinaryNode = BinaryNode>
    extends Engine
    implements Collection
{
    messages: MessagesObject = BSTMessages;
    initialValues: (string | number)[] = [];
    treeRoot: Node | null = null;
    toolbar: BSTToolbar;

    constructor(containerSelector: string) {
        super(containerSelector);

        this.toolbar = new BSTToolbar(this.container);
    }

    initialise(initialValues: string[] | null = null): this {
        this.initialValues = parseValues(initialValues);
        super.initialise();
        return this;
    }

    async resetAlgorithm(): Promise<void> {
        await super.resetAlgorithm();
        this.treeRoot = null;

        await this.state.runWhileResetting(async () => {
            if (this.initialValues) {
                await this.insert(...this.initialValues);
            }
        });
    }

    initToolbar(): void {
        super.initToolbar();

        this.toolbar.showNullNodes.addEventListener("change", () =>
            this.toggleNullNodes(null)
        );

        this.toggleNullNodes(true);
    }

    toggleNullNodes(show: boolean | null): this {
        if (show === null) {
            show = this.toolbar.showNullNodes.checked;
        }

        this.toolbar.showNullNodes.checked = show;

        if (show) {
            this.Svg.addClass("shownullnodes");
        } else {
            this.Svg.removeClass("shownullnodes");
        }
        return this;
    }

    newNode(text: string): BinaryNode {
        return this.Svg.put(
            new BinaryNode(text, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
    }

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

    async insert(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async find(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.findOne(val);
        }
    }

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

        found.node.setHighlight(true);
        const path = found.success ? "find.found" : "find.notfound";
        await this.pause(path, value);
        found.node.setHighlight(false);

        return found;
    }

    async findHelper(value: string | number) {
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
        return { success: false, node: parent };
    }

    async insertOne(value: string | number): Promise<{
        success: boolean;
        node: Node | null;
    }> {
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
        const cmp = compare(value, found.node.getText());
        const direction = cmp < 0 ? "left" : "right";

        found.node.setChild(direction, child, this.getStrokeWidth());
        child.setHighlight(true);
        found.node.setChildHighlight(direction, true);
        await this.pause("insert.child", value, direction);
        found.node.setChildHighlight(direction, false);
        child.setHighlight(false);

        this.resizeTree();
        await this.pause(undefined);

        return { success: true, node: child };
    }

    async delete(...values: (string | number)[]) {
        for (const val of values) {
            await this.deleteOne(val);
        }
    }

    // TODO: update type with separate for success true and false
    async deleteOne(value: string | number): Promise<{
        success: boolean;
        direction: BinaryDir | null;
        parent: Node | null;
    } | null> {
        if (!this.treeRoot) {
            await this.pause("general.empty");
            return null;
        }

        await this.pause("delete.search", value);
        const found = await this.findHelper(value);
        if (!found.success) {
            found.node.setHighlight(true);
            await this.pause("delete.notexists", value);
            found.node.setHighlight(false);
            const direction =
                compare(value, found.node.getText()) < 0 ? "left" : "right";
            return { success: false, direction: direction, parent: found.node };
        }

        found.node.setHighlight(true);
        await this.pause("delete.found", value);
        return await this.deleteHelper(found.node);
    }

    async deleteHelper(node: Node) {
        if (!(node?.getLeft() && node?.getRight())) {
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

        let predecessor = node.getLeft()!;
        while (true) {
            predecessor.setParentHighlight(true);
            pointer.setCenter(
                predecessor.cx(),
                predecessor.cy(),
                this.getAnimationSpeed()
            );
            await this.pause(undefined);
            predecessor.setParentHighlight(false);
            if (!predecessor.getRight()) {
                break;
            }

            predecessor = predecessor.getRight()!;
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

    async deleteNode(node: Node): Promise<{
        success: true;
        direction: BinaryDir | null;
        parent: Node | null;
    }> {
        // The node will NOT have two children - this has been taken care of by deleteHelper
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
                node.dmoveCenter(
                    -node.getSize(),
                    -node.getSize() / 2,
                    this.getAnimationSpeed()
                );
            }

            if (child === parent.getRight()?.getRight()) {
                node.dmoveCenter(
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

    async resetHeight(node: unknown) {
        // BSTs do not store the height in the nodes, so do nothing
        // This is implemented by, e.g., AVL trees
    }

    async doubleRotate(firstDir: BinaryDir, node: Node): Promise<Node> {
        const secondDir = firstDir === "left" ? "right" : "left";
        const child = node.getChild(secondDir);

        if (child === undefined || child === null) {
            throw new Error("Invalid B node in singleRotate");
        }

        await this.pause("rotate.zigzag", child, secondDir, node, firstDir);
        await this.singleRotate(secondDir, child);
        return await this.singleRotate(firstDir, node);
    }

    async singleRotate(firstDir: BinaryDir, node: Node): Promise<Node> {
        // Note: 'left' and 'right' are variables that can have values "left" or "right"!
        // So, if left==="right", then we rotate right.
        const secondDir = firstDir === "left" ? "right" : "left";

        const A = node;
        const B = A.getChild(secondDir) as Node | null;

        if (B === undefined || B === null) {
            throw new Error("Invalid B node in singleRotate");
        }

        const C = B.getChild(firstDir) as Node | null;

        A.setChildHighlight(secondDir, true);
        B.setHighlight(true);
        await this.pause("rotate.single", A, firstDir);

        const parent = A.getParent();
        if (parent) {
            const direction = parent.getLeft() === A ? "left" : "right";
            B.setParent(direction, parent, this.getStrokeWidth());
        } else {
            this.treeRoot = B;
        }

        A.setChild(secondDir, C, this.getStrokeWidth());
        B.setChild(firstDir, A, this.getStrokeWidth());

        B.setChildHighlight(firstDir, true);
        A.setHighlight(true);
        await this.pause(undefined);
        this.resizeTree();
        await this.pause(undefined);

        B.setChildHighlight(firstDir, false);
        A.setHighlight(false);
        await this.resetHeight(A);
        await this.resetHeight(B);

        return B;
    }
}
