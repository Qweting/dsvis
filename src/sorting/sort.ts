import { Engine, MessagesObject, NBSP } from "~/engine";
import { DSArray } from "~/objects/dsarray";
import { TextCircle } from "~/objects/text-circle";
import { Sorter } from "~/sorting";

export const SortMessages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a: string, b: string) => `Compare ${a} and ${b}`,
        swap: (a: string, b: string) => `Swap ${a} and ${b}`,
    },
} as const satisfies MessagesObject;

export class Sort extends Engine implements Sorter {
    initialValues: Array<string> = [];
    compensate: number = 0;
    sortArray: DSArray;
    indexLength: number = 0;
    messages: MessagesObject = SortMessages;

    constructor(containerSelector: string) {
        super(containerSelector);

        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new DSArray(1, this.getObjectSize())
        ).init(1, xRoot, yRoot + this.$Svg.margin * 4);
    }

    initialise(initialValues = []) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.indexLength = 0;
        this.Svg.put(this.sortArray);
        this.sortArray.setSize(1);
        this.sortArray.setValue(0, NBSP);
        this.sortArray.setDisabled(0, false);
        if (this.initialValues) {
            this.state.runWhileResetting(
                async () => await this.insert(...this.initialValues)
            );
        }
    }

    async insert(...values: Array<number | string>) {
        this.sortArray.setSize(this.sortArray.getSize() + values.length);
        this.sortArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async swap(arr: DSArray, j: number, k: number) {
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
        await this.pause(
            "sort.swap",
            this.sortArray.getValue(j),
            this.sortArray.getValue(k)
        );
    }

    async insertOne(value: number | string) {
        value = String(value);
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

    async sort() {
        throw new Error("Sort not implemented");
    }
}
