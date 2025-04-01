import { MessagesObject, NBSP } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { DSArray } from "~/objects/dsarray";
import { TextCircle } from "~/objects/text-circle";
import { Sorter } from "~/sorting";
import { Sort, SortMessages } from "./sort";

export const MergeSortMessages = {
    sort: {
        split: (a: string, b: string) => `Split ${a} from ${b}`,
        move: (a: string) => `Move ${a} to upper array`,
        foundNewMin: (a: string) => `Found a smaller value ${a}`,
    },
} as const satisfies MessagesObject;

export class MergeSort extends Sort implements Sorter {
    mergeArrayList: DSArray[] = [];
    messages: MessagesObject = updateDefault(MergeSortMessages, SortMessages);
    async sort() {
        //Check if array is empty
        const sortSize = this.sortArray.getSize();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }
        //Delete old merge arrays
        for (let i = 0; i < this.mergeArrayList.length; i++) {
            this.mergeArrayList[i].remove();
        }
        //Reset variables
        this.compensate = 0;
        this.mergeArrayList = [];

        //Remove empty space from the end of the array
        this.sortArray.getValues();
        if (this.sortArray.getValue(this.sortArray.getSize() - 1) === NBSP) {
            this.sortArray.setSize(this.sortArray.getSize() - 1);
        }
        //Set all elements to disabled to grey them out
        for (let i = 0; i < this.sortArray.getSize(); i++) {
            this.sortArray.setDisabled(i, true);
        }
        //Centers the array
        this.sortArray.center(
            this.getTreeRoot()[0],
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );
        //Start recursive calls to mergeSort
        await this.mergeSort(this.sortArray, 0, this.sortArray.getSize(), 1);
        //Finish the algorithm
        await this.pause("general.finished");
    }
    async mergeSort(
        arr: DSArray,
        left: number,
        right: number,
        iteration: number
    ) {
        {
            //Check if the array is empty
            if (left >= right) {
                return;
            }
            //Split the array in half
            const mid = Math.ceil(left + (right - left) / 2);
            const yCenter = this.getTreeRoot()[1];
            const baseY = this.$Svg.margin * 4;
            const CX = arr.getCX(0);

            //When the array is larger than 2 elements split into two arrays
            if (arr.getSize() > 2) {
                const mergeArray1 = this.Svg.put(
                    new DSArray(mid - left, this.getObjectSize())
                ).init(mid - left, CX, arr.cy());
                for (let k = 0; k < mid; k++) {
                    mergeArray1.setValue(k, arr.getValue(k));
                }
                this.animate(mergeArray1)
                    .cx(CX - (arr.engine().getObjectSize() * 2) / iteration)
                    .cy(
                        yCenter +
                            (baseY * iteration * this.getObjectSize()) / 28 +
                            baseY
                    );
                await this.pause(
                    "sort.split",
                    mergeArray1.getValues(),
                    arr.getValues()
                );

                const mergeArray2 = this.Svg.put(
                    new DSArray(right - mid, this.getObjectSize())
                ).init(right - mid, arr.getCX(mid), arr.cy());
                for (let k = 0; k + mid < right; k++) {
                    mergeArray2.setValue(k, arr.getValue(k + mid));
                }
                this.animate(mergeArray2)
                    .cx(
                        arr.getCX(arr.getSize() - 1) +
                            (arr.engine().getObjectSize() * 2) / iteration
                    )
                    .cy(
                        yCenter +
                            (baseY * iteration * this.getObjectSize()) / 28 +
                            baseY
                    );
                await this.pause(
                    "sort.split",
                    mergeArray2.getValues(),
                    arr.getValues()
                );

                //Push the new arrays to the mergeArrayList
                this.mergeArrayList.push(mergeArray1);
                this.mergeArrayList.push(mergeArray2);

                //Compensation to keep the array within the viewbox
                if (mergeArray1.getCX(0) < 0) {
                    this.compensate =
                        mergeArray1.getCX(0) * -1 + this.$Svg.margin;

                    const sortArrayCenter = this.sortArray.getCX(
                        this.sortArray.getSize() / 2
                    );
                    this.sortArray.center(
                        sortArrayCenter + this.compensate,
                        this.sortArray.cy()
                    );

                    for (let j = 0; j < this.mergeArrayList.length; j++) {
                        const midPoint = this.mergeArrayList[j].getSize() / 2;
                        const centerCords =
                            this.mergeArrayList[j].getCX(midPoint);
                        this.mergeArrayList[j].center(
                            centerCords + this.compensate,
                            this.mergeArrayList[j].cy()
                        );
                    }
                }

                //Recursively call mergeSort on the new arrays
                await this.mergeSort(mergeArray1, left, mid, iteration + 1);

                await this.mergeSort(
                    mergeArray2,
                    0,
                    right - mid,
                    iteration + 1
                );
                //Merge the return of the two mergeSort calls
                await this.merge(arr, mergeArray1, mergeArray2);
            } else if (arr.getSize() === 2) {
                //If the array is 2 elements, compare and swap them
                await this.pause(
                    "sort.compare",
                    arr.getValue(0),
                    arr.getValue(1)
                );
                if (arr.getValue(0) > arr.getValue(1)) {
                    await this.swap(
                        arr,
                        0,
                        1,
                        "sort.swap",
                        arr.getValue(0),
                        arr.getValue(1)
                    );
                    arr.setIndexHighlight(0, false);
                    arr.setIndexHighlight(1, false);
                }
                arr.setDisabled(0, false);
                arr.setDisabled(1, false);
            } else {
                //If the array is 1 element, set it to enabled
                arr.setDisabled(0, false);
            }
        }
    }

    async merge(array: DSArray, subarray1: DSArray, subarray2: DSArray) {
        let i;
        let a1i = 0;
        let a2i = 0;
        //Empty the parent array
        for (i = 0; i < array.getSize(); i++) {
            array.setValue(i, NBSP);
        }
        //Merge the two subarrays into the parent array
        for (i = 0; i < array.getSize(); i++) {
            await this.pause(
                "sort.compare",
                a1i < subarray1.getSize()
                    ? subarray1.getValue(a1i)
                    : "empty array",
                a2i < subarray2.getSize()
                    ? subarray2.getValue(a2i)
                    : "empty array"
            );
            if (
                a2i >= subarray2.getSize() ||
                (a1i < subarray1.getSize() &&
                    compare(subarray1.getValue(a1i), subarray2.getValue(a2i)) <
                        0)
            ) {
                await this.pause("sort.move", subarray1.getValue(a1i));
                //Move the value from the first subarray to the parent array
                const svgValue = this.Svg.put(
                    new TextCircle(
                        subarray1.getValue(a1i),
                        this.getObjectSize(),
                        this.getStrokeWidth()
                    )
                ).init(subarray1.getCX(a1i), subarray1.cy());
                this.animate(svgValue).center(array.getCX(i), array.cy());
                await this.pause(undefined);
                //Remove the text circle
                svgValue.remove();
                //Set the value to disabled and set the value in the parent array
                subarray1.setDisabled(a1i, true);
                array.setDisabled(i, false);
                array.setValue(i, subarray1.getValue(a1i));
                a1i++;
            } else {
                await this.pause("sort.move", subarray2.getValue(a2i));
                //Move the value from the second subarray to the parent array
                const svgValue = this.Svg.put(
                    new TextCircle(
                        subarray2.getValue(a2i),
                        this.getObjectSize(),
                        this.getStrokeWidth()
                    )
                ).init(subarray2.getCX(a2i), subarray2.cy());
                this.animate(svgValue).center(array.getCX(i), array.cy());
                await this.pause(undefined);
                //Remove the text circle
                svgValue.remove();
                //Set the value to disabled and set the value in the parent array
                subarray2.setDisabled(a2i, true);
                array.setDisabled(i, false);
                array.setValue(i, subarray2.getValue(a2i));
                a2i++;
            }
        }
        return array;
    }
}
