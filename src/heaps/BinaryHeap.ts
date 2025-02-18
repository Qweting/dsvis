import { compare, Engine } from "../../src/engine";
import { BinaryNode, Children } from "../../src/objects/binary-node";
import { DSArray } from "../../src/objects/dsarray";

export class BinaryHeap extends Engine {
    // @ts-expect-error TODO fix message typing
    messages = BinaryHeapMessages;

    arraySize: number = 28;
    initialValues: Array<string> | null = null;
    treeRoot: BinaryNode | null = null;
    treeNodes: Array<BinaryNode> | null = null;
    heapArray: DSArray | null = null;
    heapSize: number | null = null;

    initialise(initialValues: Array<string> | null = null) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.treeRoot = null;
        this.treeNodes = new Array(this.arraySize);
        const [xRoot, yRoot] = this.getTreeRoot();
        this.heapArray = this.Svg.dsArray(
            this.arraySize,
            xRoot,
            this.Svg.viewbox().height - yRoot,
            true
        );
        if (Number(this.heapArray.x()) < this.$Svg.margin) {
            this.heapArray.x(this.$Svg.margin);
        }
        this.heapSize = 0;
        if (this.initialValues) {
            this.State.resetting = true;
            await this.insert(...this.initialValues);
            this.State.resetting = false;
        }
    }

    resizeTree() {
        const animate = !this.State.resetting;
        this.treeRoot?.resize(
            ...this.getTreeRoot(),
            this.$Svg.margin,
            this.getNodeSpacing(),
            animate ? this.getAnimationSpeed() : 0
        );
    }

    async insert(...values: Array<string>) {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async swap(j: number, k: number, message: string, ...args: Array<string>) {
        if (this.treeNodes === null) {
            throw new Error("Tree nodes not initialised");
        }
        if (this.heapArray === null) {
            throw new Error("Heap array not initialised");
        }
        const jNode = this.treeNodes[j],
            kNode = this.treeNodes[k];
        const jLabel = this.Svg.textCircle(
            jNode.getText(),
            jNode.cx(),
            jNode.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        const kLabel = this.Svg.textCircle(
            kNode.getText(),
            kNode.cx(),
            kNode.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        jLabel.setCenter(kLabel.cx(), kLabel.cy(), this.getAnimationSpeed());
        kLabel.setCenter(jLabel.cx(), jLabel.cy(), this.getAnimationSpeed());
        this.heapArray.swap(j, k, true);
        await this.pause(message, ...args);
        jNode.setText(kLabel.getText());
        kNode.setText(jLabel.getText());
        jLabel.remove();
        kLabel.remove();
    }

    async insertOne(value: string) {
        if (this.heapSize === null) {
            throw new Error("Heap size not initialised");
        }
        if (this.treeNodes === null) {
            throw new Error("Tree nodes not initialised");
        }
        if (this.heapArray === null) {
            throw new Error("Heap array not initialised");
        }
        if (this.heapSize >= this.arraySize) {
            await this.pause("general.full");
            return;
        }

        let currentIndex = this.heapSize;
        let parentIndex = Math.floor((currentIndex - 1) / 2);
        let parentNode = this.treeNodes[parentIndex];
        const arrayLabel = this.Svg.textCircle(
            value,
            ...this.getNodeStart(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        let treeNode = this.Svg.binaryNode(
            value,
            ...this.getNodeStart(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        this.treeNodes[currentIndex] = treeNode;
        await this.pause("insert.value", value);

        arrayLabel.setCenter(
            this.heapArray.getCX(currentIndex),
            this.heapArray.cy(),
            this.getAnimationSpeed()
        );
        if (currentIndex === 0) {
            this.treeRoot = treeNode;
        } else {
            const direction =
                (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChild(direction, treeNode, this.getStrokeWidth());
        }
        this.resizeTree();
        await this.pause(undefined);

        arrayLabel.remove();
        this.heapArray.setDisabled(currentIndex, false);
        this.heapArray.setValue(currentIndex, value);
        this.heapArray.setIndexHighlight(currentIndex, true);
        this.heapSize++;

        while (currentIndex > 0) {
            treeNode.setHighlight(true);
            await this.pause("insert.shiftUp");
            parentIndex = Math.floor((currentIndex - 1) / 2);
            parentNode = this.treeNodes[parentIndex];
            const parentValue = this.heapArray.getValue(parentIndex);
            this.heapArray.setIndexHighlight(parentIndex, true);
            const direction =
                (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChildHighlight(direction, true);
            const cmp = compare(value, parentValue);
            if (cmp >= 0) {
                await this.pause("insert.stopShift", parentValue);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(parentIndex, false);
                treeNode.setHighlight(false);
                parentNode.setChildHighlight(direction, false);
                break;
            }
            await this.pause("insert.shiftAgain", parentValue);
            await this.swap(
                currentIndex,
                parentIndex,
                "swap.swap",
                value,
                parentValue
            );
            this.heapArray.setIndexHighlight(currentIndex, false);
            treeNode.setHighlight(false);
            parentNode.setChildHighlight(direction, false);
            currentIndex = parentIndex;
            treeNode = parentNode;
        }
        this.heapArray.setIndexHighlight(currentIndex, false);
        treeNode.setHighlight(false);
    }

    async deleteMin() {
        if (this.heapSize === null) {
            throw new Error("Heap size not initialised");
        }
        if (this.treeNodes === null) {
            throw new Error("Tree nodes not initialised");
        }
        if (this.heapArray === null) {
            throw new Error("Heap array not initialised");
        }
        if (this.treeRoot === null) {
            throw new Error("Tree root not initialised");
        }
        if (this.heapSize === 0) {
            await this.pause("general.empty");
            return;
        }
        this.heapSize--;
        const minValue = this.heapArray.getValue(0);

        const arrayLabel = this.Svg.textCircle(
            minValue,
            this.heapArray.getCX(0),
            this.heapArray.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        if (this.heapSize === 0) {
            await this.pause("delete.root", minValue);
            this.heapArray.setValue(0, "");
            arrayLabel.setCenter(
                ...this.getNodeStart(),
                this.getAnimationSpeed()
            );
            this.treeRoot.setCenter(
                ...this.getNodeStart(),
                this.getAnimationSpeed()
            );
            await this.pause(undefined);
            arrayLabel.remove();
            this.heapArray.setDisabled(0, true);
            this.treeRoot.remove();
            this.treeRoot = null;
            return;
        }

        const treeLabel = this.Svg.textCircle(
            minValue,
            this.treeRoot.cx(),
            this.treeRoot.cy(),
            this.getObjectSize(),
            this.getStrokeWidth()
        );
        await this.pause("remove.minValue", minValue);
        this.heapArray.setValue(0, "");
        this.treeRoot.setText(null);
        arrayLabel.setCenter(...this.getNodeStart(), this.getAnimationSpeed());
        treeLabel.setCenter(...this.getNodeStart(), this.getAnimationSpeed());
        const currentValue = this.heapArray.getValue(this.heapSize);
        await this.pause(undefined);
        await this.swap(0, this.heapSize, "swap.lastToFirst", currentValue);
        this.treeNodes[this.heapSize].remove();
        this.heapArray.setDisabled(this.heapSize, true);
        await this.pause("delete.lastHeap");

        let currentIndex = 0;
        let currentNode = this.treeNodes[currentIndex];
        while (currentIndex < this.heapSize) {
            currentNode.setHighlight(true);
            this.heapArray.setIndexHighlight(currentIndex, true);
            let childIndex = currentIndex * 2 + 1;
            if (childIndex >= this.heapSize) {
                await this.pause("finished");
                currentNode.setHighlight(false);
                this.heapArray.setIndexHighlight(currentIndex, false);
                break;
            }

            await this.pause("delete.shiftDown");
            let direction: Children = "left";
            let childValue = this.heapArray.getValue(childIndex);
            if (
                childIndex + 1 < this.heapSize &&
                compare(childValue, this.heapArray.getValue(childIndex + 1)) > 0
            ) {
                direction = "right";
                childIndex++;
                childValue = this.heapArray.getValue(childIndex);
            }
            const childNode = this.treeNodes[childIndex];

            this.heapArray.setIndexHighlight(childIndex, true);
            currentNode.setChildHighlight(direction, true);
            childNode.setHighlight(true);

            const cmp = compare(currentValue, childValue);
            if (cmp <= 0) {
                await this.pause("delete.stopShift", currentValue, childValue);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(childIndex, false);
                currentNode.setChildHighlight(direction, false);
                childNode.setHighlight(false);
                break;
            }

            await this.pause("delete.shiftAgain", currentValue, childValue);
            await this.swap(
                currentIndex,
                childIndex,
                "swap.swap",
                currentValue,
                childValue
            );
            this.heapArray.setIndexHighlight(currentIndex, false);
            this.heapArray.setIndexHighlight(childIndex, false);
            currentNode.setChildHighlight(direction, false);
            childNode.setHighlight(false);
            currentIndex = childIndex;
            currentNode = childNode;
        }

        await this.pause(undefined);
        arrayLabel.remove();
        treeLabel.remove();
        this.resizeTree();
    }
}

export const BinaryHeapMessages = {
    general: {
        empty: "Heap is empty!",
        full: "Heap is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
        shiftUp: "Shift the value upwards",
        stopShift: (parentValue: string) =>
            `The parent ${parentValue} is not larger: stop here`,
        shiftAgain: (parentValue: string) =>
            `The parent ${parentValue} is larger`,
    },
    delete: {
        root: (minValue: string) => `Remove the root: ${minValue}`,
        minValue: (minValue: string) => `Remove the minimum value: ${minValue}`,
        lastHeap: "Remove the new last heap value",
        shiftDown: "Shift the value downwards",
        stopShift: (currentValue: string, childValue: string) =>
            `The value ${currentValue} is not larger than the smallest child ${childValue}: stop here`,
        shiftAgain: (currentValue: string, childValue: string) =>
            `The value ${currentValue} is larger than the smallest child ${childValue}`,
    },
    swap: {
        swap: (a: number, b: number) => `Swap ${a} and ${b}`,
        lastToFirst: (val: number) =>
            `Swap in the last heap value to the first position: ${val}`,
    },
};
