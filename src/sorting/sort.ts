import { SortingAlgorithmControls } from "~/algorithm-controls/sorting-algorithm-controls";
import { Engine } from "../../src/engine";
import { BinaryNode } from "../../src/objects/binary-node";
import { DSArray } from "../../src/objects/dsarray";
import { TextCircle } from "../../src/objects/text-circle";

export class Sort extends Engine {
    arraySize: number = 28;
    initialValues: Array<string> = [];
    treeRoot: BinaryNode | null = null;
    treeNodes: Array<BinaryNode> | null = null;
    compensate: number = 0;
    sortArray: DSArray | null = null;
    indexLength: number = 0;
    algorithmControls: SortingAlgorithmControls;


    constructor(containerSelector: string) {
        super(containerSelector);
        this.algorithmControls = new SortingAlgorithmControls(this.container, this);
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.indexLength = 0;
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new DSArray(1, this.getObjectSize())
        ).init(1, xRoot, yRoot + this.$Svg.margin * 4);
        if (this.sortArray && Number(this.sortArray.x()) < this.$Svg.margin) {
            this.sortArray.x(this.$Svg.margin);
        }
        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
    }

    async insert(...values: Array<number | string>) {
        if (this.sortArray) {
            this.sortArray.setSize(this.sortArray.getSize() + values.length);
            this.sortArray.center(
                this.getTreeRoot()[0],
                this.getTreeRoot()[1] + this.$Svg.margin * 4
            );
            for (const val of values) {
                await this.insertOne(val);
            }
        }
    }

    async swap(
        arr: DSArray | null = this.sortArray,
        j: number,
        k: number,
        message: string,
        ...args: Array<number | string>
    ) {
        if (!arr) {
            throw new Error("Sort array not initialised");
        }
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
        await this.pause(message, ...args);
    }

    async insertOne(value: number | string) {
        value = String(value);
        if (!this.sortArray) {
            throw new Error("Sort array not initialised");
        }
        const arrayLabel = this.Svg.put(
            new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
        ).init(...this.getNodeStart());
        await this.pause("insert.value", value);
        const currentIndex = this.indexLength;
        arrayLabel.setCenter(
            this.sortArray.getCX(currentIndex),
            this.sortArray.cy(),
            this.getAnimationSpeed()
        );
        await this.pause(undefined);

        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.indexLength++;
        this.sortArray.setIndexHighlight(currentIndex, false);
    }

    async sort() {}
}
