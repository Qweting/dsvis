import { DSArray } from "src/objects/dsarray";
import { MessagesObject, NBSP } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { Sorter } from "~/sorting";
import { Sort, SortMessages } from "~/sorting/sort";

export const QuickSortMessages = {
    sort: {
        findPivot: "Pivot is selected",
        lowBig: "Element bigger than pivot",
        highSmall: "Element smaller than pivot",
        pivotSwap: "Swap pivot into correct place",
        sorting: (low: number, high: number) =>
            `Sorting array from index ${low} to index ${high}`,
        singleElement: "Single element arrays are automatically sorted",
    },
} as const satisfies MessagesObject;

export class QuickSort extends Sort implements Sorter {
    messages: MessagesObject = updateDefault(QuickSortMessages, SortMessages);

    async sort() {
        if (this.sortArray.getSize() <= 1) {
            await this.pause("general.empty");
            return;
        }

        if (this.sortArray.getValue(this.sortArray.getSize() - 1) === NBSP) {
            this.sortArray.setSize(this.sortArray.getSize() - 1);
        }

        //Center the array depending on its size
        this.sortArray.center(
            this.getTreeRoot()[0] + this.compensate,
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );

        //Ensures there are no highlights when starting the algorithm
        for (let i = 0; i < this.sortArray.getSize(); i++) {
            this.sortArray.setIndexHighlight(i, false);
        }

        //Start recursive calls to quicksort
        await this.quickSort(this.sortArray, 0, this.sortArray.getSize() - 1);

        //Enable array again after completion
        for (let i = 0; i < this.sortArray.getSize(); i++) {
            this.sortArray.setDisabled(i, false);
        }

        //Message done
        await this.pause("general.finished");
    }

    async quickSort(array: DSArray, low: number, high: number) {
        //Colors single element arrays green and return since they are sorted
        if (low >= high || low < 0) {
            await this.pause(`sort.singleElement`);
            this.sortArray.setIndexHighlight(low, true, "Green");
            return;
        }

        //Partition
        const p = await this.partition(low, high);

        //Recursively call quicksort on the subarrays created by partition
        await this.pause(`sort.sorting`, low, p - 1);
        await this.quickSort(array, low, p - 1);

        await this.pause(`sort.sorting`, p + 1, high);
        await this.quickSort(array, p + 1, high);
    }

    async partition(left: number, right: number) {
        const leftArrowId: string = "ArrowLow";
        const rightArrowId: string = "ArrowHigh";
        const blue = "#00C";
        const green = "green";
        const red = "#C00";
        let low = left;
        let high = right;

        //Makes only the current section being partitioned enabled
        for (let i = 0; i < this.sortArray.getSize(); i++) {
            if (i < low || i > high) {
                this.sortArray.setDisabled(i, true);
            } else {
                this.sortArray.setDisabled(i, false);
            }
        }

        //Makes pivot the middle element in the list
        let pivot = Math.floor((low + high) / 2);
        const pivotValue = this.sortArray.getValue(pivot);

        await this.pause(`sort.findPivot`);

        //Marks pivot and swaps pivot with the first value of the range
        this.sortArray.setIndexHighlight(pivot, true);
        await this.swap(
            this.sortArray,
            low,
            pivot,
            `sort.swap`,
            this.sortArray.getValue(low),
            this.sortArray.getValue(pivot)
        );
        this.sortArray.setIndexHighlight(pivot, false);

        //Set pivots new index, disable pivot and increment low
        pivot = low;
        this.sortArray.setIndexHighlight(low, false);
        this.sortArray.setDisabled(pivot, true);
        low += 1;

        //Adds arrows to indicate low and high
        this.sortArray.addArrow(low, leftArrowId, red);
        this.sortArray.addArrow(high, rightArrowId, blue);

        while (true) {
            this.sortArray.setIndexHighlight(low, true, red);
            this.sortArray.setIndexHighlight(high, true, blue);

            //Moves low as far right in the array as possible
            //Stops moving if equal to pivot or if it gets farther right then high
            //Also moves the highlights and arrow along with it
            while (
                low <= high &&
                compare(this.sortArray.getValue(low), pivotValue) < 0
            ) {
                this.sortArray.setIndexHighlight(low, true);
                await this.pause(
                    "sort.compare",
                    this.sortArray.getValue(low),
                    pivotValue
                );
                this.sortArray.setIndexHighlight(low, false);
                low += 1;
                this.sortArray.moveArrow(leftArrowId, low);
            }

            //Checks so low isn't out of the sorting range before highlighting it
            if (low < right) {
                this.sortArray.setIndexHighlight(low, true);
            }

            await this.pause("sort.lowBig");

            //Moves high as far left in the array as possible
            //Stops moving if equal to pivot or if it gets farther left then low
            //Also moves the highlights and arrow along with it
            while (
                low <= high &&
                compare(this.sortArray.getValue(high), pivotValue) > 0
            ) {
                this.sortArray.setIndexHighlight(high, true, blue);
                await this.pause(
                    "sort.compare",
                    this.sortArray.getValue(high),
                    pivotValue
                );
                this.sortArray.setIndexHighlight(high, false, blue);
                high -= 1;
                this.sortArray.moveArrow(rightArrowId, high);
            }

            await this.pause("sort.highSmall");

            this.sortArray.setIndexHighlight(high, true, blue);

            if (low > high) {
                break;
            }

            //Swap low and high since low is now higher than or equal to the pivot
            //And higher is lower than or equal to the pivot
            await this.swap(
                this.sortArray,
                low,
                high,
                `sort.swap`,
                this.sortArray.getValue(low),
                this.sortArray.getValue(high)
            );

            //Remove highlights
            this.sortArray.setIndexHighlight(low, false);
            this.sortArray.setIndexHighlight(high, false);

            low += 1;
            high -= 1;

            //Only put them back if low and high are not out of bounds
            if (low < right && high > left) {
                this.sortArray.setIndexHighlight(low, true);
                this.sortArray.setIndexHighlight(high, true, blue);
            }

            this.sortArray.moveArrow(leftArrowId, low);
            this.sortArray.moveArrow(rightArrowId, high);
        }

        //Only remove lows highlight if its not out of bounds so we don't remove green highlight
        //indicating the correct position has been reached
        if (low < right) {
            this.sortArray.setIndexHighlight(low, false);
        }

        //Swap the pivot back into its original position and now correct sorted position in the array
        await this.pause("sort.pivotSwap");
        await this.swap(
            this.sortArray,
            pivot,
            high,
            `sort.swap`,
            this.sortArray.getValue(pivot),
            this.sortArray.getValue(high)
        );
        //Color pivot green since it is sorted into its right place
        this.sortArray.setIndexHighlight(high, true, green);

        this.sortArray.removeArrow(leftArrowId);
        this.sortArray.removeArrow(rightArrowId);

        return high;
    }
}
