import {addReturnSubmit, compare, NBSP} from "../../src/engine";
import {AVLNode} from "../../src/objects/avl-node";
import {Children} from "../../src/objects/binary-node";
import {BST} from "../../src/trees/BST";

export class AVLQuiz extends BST {
    mark: AVLNode | null = null;
    current: AVLNode | null = null;
    async resetAlgorithm() {
        await super.resetAlgorithm();
        await this.setCurrent(this.treeRoot as AVLNode | null, false);
        this.mark = null;
    }

    getHeight(node: AVLNode) {
        return node ? node.getHeight() : 0;
    }

    isBST() {
        try {
            this._validateBST(
                this.treeRoot as AVLNode | null,
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
        const left = node.getLeft() as AVLNode | null;
        if (left) {
            min = this._validateBST(left, min);
        }
        if (compare(min, node.getText()) >= 0) {
            throw new Error(`Order mismatch: ${min} > ${node.getText()}`);
        }
        min = node.getText();
        const right = node.getRight() as AVLNode | null;
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
        this.Info.title?.text(message);
        this.Info.body?.text(NBSP);
    }

    newNode(text: string) {
        return this.Svg.avlNode(
            text,
            ...this.getNodeStart(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
    }

    async setCurrent(node: AVLNode | null, animate: boolean) {
        this.current?.setHighlight(false);
        if (animate && this.current && node) {
            const cursor = this.Svg.highlightCircle(
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
        const parent = this.current?.getParent() as AVLNode | null;
        if (!parent) {
            await this.pause("The root node doesn't have a parent!");
            return;
        }
        await this.setCurrent(parent, true);
    }

    async moveChild(direction: Children) {
        const child = this.current?.getChild(direction) as
      | AVLNode
      | undefined
      | null;
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

        const moving = this.Svg.textCircle(
            this.current.getText(),
            this.current.cx(),
            this.current.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        moving.setHighlight(true);
        await this.pause(`Replace the value of ${this.mark} with ${this.current}`);
        moving.setCenter(this.mark.cx(), this.mark.cy(), this.getAnimationSpeed());
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

    async insertBelow(direction: Children, value: string) {
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
        const parent = this.current.getParent() as AVLNode | null;
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

    async rotateCurrent(direction: Children) {
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
        const node = (await this.singleRotate(direction, this.current)) as AVLNode;
        await this.setCurrent(node, false);
        await this.pause("Updating heights");
        this.updateHeights();
    }

    updateHeights() {
        this.updateHeightsHelper(this.treeRoot as AVLNode | null);
    }

    updateHeightsHelper(node: AVLNode | null): number {
        if (!node) {
            return 0;
        }
        const leftHeight = this.updateHeightsHelper(
            node.getLeft() as AVLNode | null
        );
        const rightHeight = this.updateHeightsHelper(
            node.getRight() as AVLNode | null
        );
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

    const container = AVLEngine.container;
    const tools = AVLEngine.toolbar;
    const insertField =
    container.querySelector<HTMLInputElement>("input.insertField");
    const createLeft =
    container.querySelector<HTMLInputElement>("input.createLeft");
    const createRight =
    container.querySelector<HTMLInputElement>("input.createRight");
    const moveParent =
    container.querySelector<HTMLInputElement>("input.moveParent");
    const moveLeft = container.querySelector<HTMLInputElement>("input.moveLeft");
    const moveRight =
    container.querySelector<HTMLInputElement>("input.moveRight");
    const rotateLeft =
    container.querySelector<HTMLInputElement>("input.rotateLeft");
    const rotateRight =
    container.querySelector<HTMLInputElement>("input.rotateRight");
    const markNode = container.querySelector<HTMLInputElement>("input.markNode");
    const copyToMark =
    container.querySelector<HTMLInputElement>("input.copyToMark");
    const deleteNode =
    container.querySelector<HTMLInputElement>("input.deleteNode");
    const restartQuiz =
    container.querySelector<HTMLInputElement>("input.restartQuiz");

    if (!insertField) {
        throw new Error("Could not find insert field");
    }
    if (!createLeft) {
        throw new Error("Could not find create left field");
    }
    if (!createRight) {
        throw new Error("Could not find create right field");
    }
    if (!moveParent) {
        throw new Error("Could not find move parent field");
    }
    if (!moveLeft) {
        throw new Error("Could not find move left field");
    }
    if (!moveRight) {
        throw new Error("Could not find move right field");
    }
    if (!rotateLeft) {
        throw new Error("Could not find rotate left field");
    }
    if (!rotateRight) {
        throw new Error("Could not find rotate right field");
    }
    if (!markNode) {
        throw new Error("Could not find mark node field");
    }
    if (!copyToMark) {
        throw new Error("Could not find copy to mark field");
    }
    if (!deleteNode) {
        throw new Error("Could not find delete node field");
    }
    if (!restartQuiz) {
        throw new Error("Could not find restart quiz field");
    }

    addReturnSubmit(insertField, "ALPHANUM");
    createLeft.addEventListener("click", () =>
        AVLEngine.submit("insertLeft", insertField)
    );
    createRight.addEventListener("click", () =>
        AVLEngine.submit("insertRight", insertField)
    );
    moveParent.addEventListener("click", () => AVLEngine.execute("moveParent"));
    moveLeft.addEventListener("click", () =>
        AVLEngine.execute("moveChild", ["left"])
    );
    moveRight.addEventListener("click", () =>
        AVLEngine.execute("moveChild", ["right"])
    );
    rotateLeft.addEventListener("click", () =>
        AVLEngine.execute("rotateCurrent", ["left"])
    );
    rotateRight.addEventListener("click", () =>
        AVLEngine.execute("rotateCurrent", ["right"])
    );
    markNode.addEventListener("click", () => AVLEngine.execute("markNode"));
    copyToMark.addEventListener("click", () => AVLEngine.execute("copyToMark"));
    deleteNode.addEventListener("click", () =>
        AVLEngine.execute("deleteCurrent")
    );
    restartQuiz.addEventListener("click", () => AVLEngine.resetAll());
}

initialiseAVLQuiz("#avlquizContainer");
