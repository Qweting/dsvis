import { MessagesObject, NBSP } from "~/engine";
import { compare, updateDefault } from "~/helpers";
import { Sorter } from "~/sorting";
import { Sort, SortMessages } from "./sort";

export const SelectionSortMessages = {
    sort: {
        foundNewMin: (a: string) => `Found a smaller value ${a}`,
    },
} as const satisfies MessagesObject;

export class SelectionSort extends Sort implements Sorter {
    messages: MessagesObject = updateDefault(
        SelectionSortMessages,
        SortMessages
    );
    async sort() {
        let sortSize = this.sortArray.getSize();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }

        if (this.sortArray.getValue(this.sortArray.getSize() - 1) === NBSP) {
            this.sortArray.setSize(this.sortArray.getSize() - 1);
            sortSize--;
        }
        //Center the array depending on its size
        this.sortArray.center(
            this.getTreeRoot()[0] + this.compensate,
            this.getTreeRoot()[1] + this.$Svg.margin * 4
        );

        for (let i = 0; i < sortSize - 1; i++) {
            let minIndex = i;

            // Find the index of the minimum element in the unsorted part of the array
            for (let j = i + 1; j < sortSize; j++) {
                // Highlight the current element and the minimum element
                this.sortArray.setIndexHighlight(j, true);
                this.sortArray.setIndexHighlight(minIndex, true, "Blue");

                // Message: Compare the current element with the minimum element
                await this.pause(
                    "sort.compare",
                    this.sortArray.getValue(j),
                    this.sortArray.getValue(minIndex)
                );

                if (
                    compare(
                        this.sortArray.getValue(j),
                        this.sortArray.getValue(minIndex)
                    ) < 0
                ) {
                    // Unhighlight the previous minimum element
                    this.sortArray.setIndexHighlight(minIndex, false);
                    this.sortArray.setIndexHighlight(j, true, "Blue");

                    minIndex = j;

                    // Message: Found a new minimum element
                    await this.pause(
                        "sort.foundNewMin",
                        this.sortArray.getValue(minIndex)
                    );
                } else {
                    // Unhighlight the current element
                    this.sortArray.setIndexHighlight(j, false);
                }
                // Unhighlight the minimum element and the current element
                this.sortArray.setIndexHighlight(j, false);
                this.sortArray.setIndexHighlight(minIndex, false);
            }
            // If we found a new minimum, swap it with the current element
            if (minIndex !== i) {
                await this.swap(this.sortArray, i, minIndex);
            }
            // Highlight the sorted part of the array
            this.sortArray.setIndexHighlight(i, true, "Green");
        }
        this.sortArray.setIndexHighlight(sortSize - 1, true, "Green");
        await this.pause("general.finished");

        // Reset the highlights
        for (let i = 0; i < sortSize; i++) {
            this.sortArray.setIndexHighlight(i, false);
        }
    }
}
