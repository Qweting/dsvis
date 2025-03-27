import { PrioQueueAlgorithmControl } from "~/algorithm-controls/prioqueue-algorithm-controls";
import { Engine, MessagesObject } from "~/engine";
import { compare } from "~/helpers";
import { BinaryDir, BinaryNode } from "~/objects/binary-node";
import { DSArray } from "~/objects/dsarray";
import { TextCircle } from "~/objects/text-circle";
import { Prioqueue } from "~/prioqueues";

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

export class BinaryHeap extends Engine implements Prioqueue {
    messages: MessagesObject = BinaryHeapMessages;
    arraySize: number = 28;
    initialValues: Array<string> | null = null;
    treeRoot: BinaryNode | null = null;
    treeNodes: Array<BinaryNode> | null = null;
    heapArray: DSArray | null = null;
    heapSize: number | null = null;
    algorithmControls: PrioQueueAlgorithmControl;

    constructor(containerSelector: string) {
        super(containerSelector);

        this.algorithmControls = new PrioQueueAlgorithmControl(
            this.container,
            this
        );
    }

    initialise(initialValues: Array<string> | null = null) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.treeRoot = null;
        this.treeNodes = new Array(this.arraySize);
        const [xRoot, yRoot] = this.canvas.getTreeRoot();
        this.heapArray = this.canvas.Svg.put(
            new DSArray(this.arraySize, this.canvas.getObjectSize(), true)
        ).init(this.arraySize, xRoot, this.canvas.Svg.viewbox().height - yRoot);
        if (Number(this.heapArray.x()) < this.canvas.$Svg.margin) {
            this.heapArray.x(this.canvas.$Svg.margin);
        }
        this.heapSize = 0;
        await this.state.runWhileResetting(async () => {
            if (this.initialValues) {
                await this.insert(...this.initialValues);
            }
        });
    }

    resizeTree() {
        const animate = !this.state.isResetting();
        this.treeRoot?.resize(
            ...this.canvas.getTreeRoot(),
            this.canvas.$Svg.margin,
            this.canvas.getNodeSpacing(),
            animate ? this.canvas.getAnimationSpeed() : 0
        );
    }

    async insert(...values: (string | number)[]) {
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

        const jLabel = this.canvas.Svg.put(
            new TextCircle(
                jNode.getText(),
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(jNode.cx(), jNode.cy());
        const kLabel = this.canvas.Svg.put(
            new TextCircle(
                kNode.getText(),
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(kNode.cx(), kNode.cy());
        this.canvas.setCenter(
            jLabel,
            kLabel.cx(),
            kLabel.cy(),
            this.canvas.getAnimationSpeed()
        );
        this.canvas.setCenter(
            kLabel,
            jLabel.cx(),
            jLabel.cy(),
            this.canvas.getAnimationSpeed()
        );
        this.heapArray.swap(j, k, true);
        await this.pause(message, ...args);
        jNode.setText(kLabel.getText());
        kNode.setText(jLabel.getText());
        jLabel.remove();
        kLabel.remove();
    }

    /// IDEA OF THE CENTURY: separera modelldelen av engine och kontrolldelen av engine!!??

    async insertOne(value: string | number) {
        value = String(value); //TODO: Check if this can be handled better
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
        const arrayLabel = this.canvas.Svg.put(
            new TextCircle(
                value,
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(...this.canvas.getNodeStart());
        let treeNode = this.canvas.Svg.put(
            new BinaryNode(
                value,
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(...this.canvas.getNodeStart());

        this.treeNodes[currentIndex] = treeNode;
        await this.pause("insert.value", value);

        this.canvas.setCenter(
            arrayLabel,
            this.heapArray.getCX(currentIndex),
            this.heapArray.cy(),
            this.canvas.getAnimationSpeed()
        );
        if (currentIndex === 0) {
            this.treeRoot = treeNode;
        } else {
            const direction =
                (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChild(
                direction,
                treeNode,
                this.canvas.getStrokeWidth()
            );
        }
        this.resizeTree();
        await this.pause(undefined);

        arrayLabel.remove();
        this.heapArray.setDisabled(currentIndex, false);
        this.heapArray.setValue(currentIndex, value);
        this.heapArray.setIndexHighlight(currentIndex, true);
        this.heapSize++;

        while (currentIndex > 0) {
            this.canvas.setHighlight(treeNode, true);
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
                this.canvas.setHighlight(treeNode, false);
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
            this.canvas.setHighlight(treeNode, false);
            parentNode.setChildHighlight(direction, false);
            currentIndex = parentIndex;
            treeNode = parentNode;
        }
        this.heapArray.setIndexHighlight(currentIndex, false);
        this.canvas.setHighlight(treeNode, false);
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

        const arrayLabel = this.canvas.Svg.put(
            new TextCircle(
                minValue,
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(this.heapArray.getCX(0), this.heapArray.cy());
        if (this.heapSize === 0) {
            await this.pause("delete.root", minValue);
            this.heapArray.setValue(0, "");
            this.canvas.setCenter(
                arrayLabel,
                ...this.canvas.getNodeStart(),
                this.canvas.getAnimationSpeed()
            );
            this.treeRoot.setCenter(
                ...this.canvas.getNodeStart(),
                this.canvas.getAnimationSpeed()
            );
            await this.pause(undefined);
            arrayLabel.remove();
            this.heapArray.setDisabled(0, true);
            this.treeRoot.remove();
            this.treeRoot = null;
            return;
        }

        const treeLabel = this.canvas.Svg.put(
            new TextCircle(
                minValue,
                this.canvas.getObjectSize(),
                this.canvas.getStrokeWidth()
            )
        ).init(this.treeRoot.cx(), this.treeRoot.cy());
        await this.pause("remove.minValue", minValue);
        this.heapArray.setValue(0, "");
        this.treeRoot.setText(null);
        this.canvas.setCenter(
            arrayLabel,
            ...this.canvas.getNodeStart(),
            this.canvas.getAnimationSpeed()
        );
        this.canvas.setCenter(
            treeLabel,
            ...this.canvas.getNodeStart(),
            this.canvas.getAnimationSpeed()
        );
        const currentValue = this.heapArray.getValue(this.heapSize);
        await this.pause(undefined);
        await this.swap(0, this.heapSize, "swap.lastToFirst", currentValue);
        this.treeNodes[this.heapSize].remove();
        this.heapArray.setDisabled(this.heapSize, true);
        await this.pause("delete.lastHeap");

        let currentIndex = 0;
        let currentNode = this.treeNodes[currentIndex];
        while (currentIndex < this.heapSize) {
            this.canvas.setHighlight(currentNode, true);
            this.heapArray.setIndexHighlight(currentIndex, true);
            let childIndex = currentIndex * 2 + 1;
            if (childIndex >= this.heapSize) {
                await this.pause("finished");
                this.canvas.setHighlight(currentNode, false);
                this.heapArray.setIndexHighlight(currentIndex, false);
                break;
            }

            await this.pause("delete.shiftDown");
            let direction: BinaryDir = "left";
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
            this.canvas.setHighlight(childNode, true);

            const cmp = compare(currentValue, childValue);
            if (cmp <= 0) {
                await this.pause("delete.stopShift", currentValue, childValue);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(childIndex, false);
                currentNode.setChildHighlight(direction, false);
                this.canvas.setHighlight(childNode, false);
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
            this.canvas.setHighlight(childNode, false);
            currentIndex = childIndex;
            currentNode = childNode;
        }

        await this.pause(undefined);
        arrayLabel.remove();
        treeLabel.remove();
        this.resizeTree();
    }
}
