import { addReturnSubmit, compare, NBSP } from "../../src/engine";
import { AVLNode } from "../../src/objects/avl-node";
import { BinaryDir } from "../../src/objects/binary-node";
import { HighlightCircle } from "../../src/objects/highlight-circle";
import { TextCircle } from "../../src/objects/text-circle";
import { BST } from "../../src/trees/BST";
import { AVLQuizToolbar } from "../toolbars/AVL-quiz-toolbar";

export class AVLQuiz extends BST<AVLNode> {
    mark: AVLNode | null = null;
    current: AVLNode | null = null;

    async resetAlgorithm() {
        await super.resetAlgorithm();
        await this.setCurrent(this.treeRoot, false);
        this.mark = null;
    }

    getHeight(node: AVLNode) {
        return node ? node.getHeight() : 0;
    }

    isBST() {
        try {
            this._validateBST(
                this.treeRoot,
                "" //Number.MIN_SAFE_INTEGER
            );
        } catch (error) {
            if (error instanceof Error) {
                console.warn(error.toString());
            } else {
                console.error("An unexpected error occurred:", error);
            }
            return false;
        }
        return true;
    }

    _validateBST(node: AVLNode | null, min: string) {
        if (!node) {
            return min;
        }
        const left = node.getLeft();
        if (left) {
            min = this._validateBST(left, min);
        }
        if (compare(min, node.getText()) >= 0) {
            throw new Error(`Order mismatch: ${min} > ${node.getText()}`);
        }
        min = node.getText();
        const right = node.getRight();
        if (right) {
            min = this._validateBST(right, min);
        }
        return min;
    }

    isUnbalanced() {
        for (const node of this.Svg.find("g")) {
            if (node instanceof AVLNode) {
                if (node.getHeightHighlight()) {
                    return true;
                }
            }
        }
        return false;
    }

    setIdleTitle() {
        const isBST = this.isBST();
        const unbalanced = this.isUnbalanced();
        const message =
            !isBST && unbalanced
                ? "Tree is not a BST, and it's unbalanced!"
                : !isBST
                ? "Tree is not a BST!"
                : unbalanced
                ? "Tree is unbalanced!"
                : "Tree is a correct AVL tree";
        this.info.setTitle(message);
        this.info.setBody(NBSP);
    }

    newNode(text: string) {
        return this.Svg.put(
            new AVLNode(text, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
    }

    async setCurrent(node: AVLNode | null, animate: boolean) {
        this.current?.setHighlight(false);
        if (animate && this.current && node) {
            const cursor = this.Svg.put(new HighlightCircle()).init(
                this.current.cx(),
                this.current.cy(),
                this.getObjectSize(),
                this.getStrokeWidth()
            );
            cursor.setCenter(
                node.cx(),
                node.cy(),
                animate ? this.getAnimationSpeed() : 0
            );
            await this.pause(undefined);
            cursor.remove();
        }
        this.current = node;
        this.current?.setHighlight(true);
    }

    async moveParent() {
        const parent = this.current?.getParent();
        if (!parent) {
            await this.pause("The root node doesn't have a parent!");
            return;
        }
        await this.setCurrent(parent, true);
    }

    async moveChild(direction: BinaryDir) {
        const child = this.current?.getChild(direction);
        if (!child) {
            await this.pause(`There is no ${direction} child!`);
            return;
        }
        await this.setCurrent(child, true);
    }

    async markNode() {
        if (this.mark) {
            this.mark.removeClass("marked");
            if (this.mark === this.current) {
                this.mark = null;
                return;
            }
        }
        this.mark = this.current;
        this.mark?.addClass("marked");
    }

    async copyToMark() {
        if (!this.mark || !this.current) {
            return;
        }
        if (this.mark === this.current) {
            return;
        }

        const moving = this.Svg.put(
            new TextCircle(
                this.current.getText(),
                this.getObjectSize(),
                this.getStrokeWidth()
            )
        ).init(this.current.cx(), this.current.cy());
        moving.setHighlight(true);
        await this.pause(
            `Replace the value of ${this.mark} with ${this.current}`
        );
        moving.setCenter(
            this.mark.cx(),
            this.mark.cy(),
            this.getAnimationSpeed()
        );
        await this.pause(undefined);
        this.mark.setText(this.current.getText());
        moving.remove();
    }

    async insertLeft(value: string) {
        await this.insertBelow("left", value);
    }

    async insertRight(value: string) {
        await this.insertBelow("right", value);
    }

    async insertBelow(direction: BinaryDir, value: string) {
        if (!this.current) {
            throw new Error("There is no current node");
            return;
        }
        if (this.current.getChild(direction)) {
            await this.pause(`There is already a ${direction} child!`);
            return;
        }
        const child = this.newNode(value);
        this.current.setChild(direction, child, this.getStrokeWidth());
        child.setHighlight(true);
        this.current.setChildHighlight(direction, true);
        await this.pause(`Insert ${value} as ${direction} child`);
        this.current.setChildHighlight(direction, false);
        // this.cursor.hide();
        this.resizeTree();
        await this.pause(undefined);
        child.setHighlight(false);
        await this.setCurrent(child, false);
        await this.pause("Updating heights");
        this.updateHeights();
    }

    async deleteCurrent() {
        if (!this.current) {
            throw new Error("Can not delete a node that is null");
        }
        if (this.current.getLeft() || this.current.getRight()) {
            await this.pause("Not a leaf node!");
            return;
        }
        const parent = this.current.getParent();
        if (!parent) {
            await this.pause("Cannot remove the root!");
            return;
        }
        this.current.remove();
        await this.setCurrent(parent, true);
        this.resizeTree();
        await this.pause("Updating heights");
        this.updateHeights();
    }

    async rotateCurrent(direction: BinaryDir) {
        if (!this.current) {
            throw new Error("Can not rotate a node that is null");
        }
        const right = direction === "left" ? "right" : "left";
        const child = this.current?.getChild(right);
        if (!child) {
            await this.pause(
                `Cannot rotate ${direction}\nNode doesn't have a ${right} child!`
            );
            return;
        }
        const node = await this.singleRotate(direction, this.current);
        await this.setCurrent(node, false);
        await this.pause("Updating heights");
        this.updateHeights();
    }

    updateHeights() {
        this.updateHeightsHelper(this.treeRoot);
    }

    updateHeightsHelper(node: AVLNode | null): number {
        if (!node) {
            return 0;
        }
        const leftHeight = this.updateHeightsHelper(node.getLeft());
        const rightHeight = this.updateHeightsHelper(node.getRight());

        const height = 1 + Math.max(leftHeight, rightHeight);
        node.setHeight(height);
        const unbalanced = Math.abs(leftHeight - rightHeight) > 1;
        node.setHeightHighlight(unbalanced);
        return height;
    }
}

function initialiseAVLQuiz(containerID: string) {
    const AVLEngine = new AVLQuiz(containerID);
    AVLEngine.initialise(["K"]);

    const toolbar = new AVLQuizToolbar(AVLEngine.container);

    addReturnSubmit(toolbar.insertField, "ALPHANUM");
    toolbar.createLeft.addEventListener("click", () =>
        AVLEngine.submit("insertLeft", toolbar.insertField)
    );
    toolbar.createRight.addEventListener("click", () =>
        AVLEngine.submit("insertRight", toolbar.insertField)
    );
    toolbar.moveParent.addEventListener("click", () =>
        AVLEngine.execute("moveParent")
    );
    toolbar.moveLeft.addEventListener("click", () =>
        AVLEngine.execute("moveChild", ["left"])
    );
    toolbar.moveRight.addEventListener("click", () =>
        AVLEngine.execute("moveChild", ["right"])
    );
    toolbar.rotateLeft.addEventListener("click", () =>
        AVLEngine.execute("rotateCurrent", ["left"])
    );
    toolbar.rotateRight.addEventListener("click", () =>
        AVLEngine.execute("rotateCurrent", ["right"])
    );
    toolbar.markNode.addEventListener("click", () =>
        AVLEngine.execute("markNode")
    );
    toolbar.copyToMark.addEventListener("click", () =>
        AVLEngine.execute("copyToMark")
    );
    toolbar.deleteNode.addEventListener("click", () =>
        AVLEngine.execute("deleteCurrent")
    );
    toolbar.restartQuiz.addEventListener("click", () => AVLEngine.resetAll());
}

initialiseAVLQuiz("#avlquizContainer");
