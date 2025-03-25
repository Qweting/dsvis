import { MessagesObject, compare } from "src/engine";
import { Sort } from "./sort";

export const SelectionSortMessages = {
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
        foundNewMin: (a: string) => `Found a smaller value ${a}`,
    },
};

export class SelectionSort extends Sort {
    messages: MessagesObject = SelectionSortMessages;
    async sort() {
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }
        let sortSize = this.sortArray.getSize();
        if (sortSize <= 1) {
            await this.pause("general.empty");
            return;
        }

        for (let i = 0; i < sortSize - 1; i++) {
            let minIndex = i;

            // Find the index of the minimum element in the unsorted part of the array
            for (let j = i + 1; j < sortSize; j++) {
                // Highlight the current element and the minimum element
                this.sortArray.setBlueHighlight(j, true);
                this.sortArray.setBlueHighlight(minIndex, true);

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
                    this.sortArray.setBlueHighlight(minIndex, false);

                    minIndex = j;

                    // Message: Found a new minimum element
                    await this.pause(
                        "sort.foundNewMin",
                        this.sortArray.getValue(minIndex)
                    );
                } else {
                    // Unhighlight the current element
                    this.sortArray.setBlueHighlight(j, false);
                }
                // Unhighlight the minimum element and the current element
                this.sortArray.setBlueHighlight(j, false);
                this.sortArray.setBlueHighlight(minIndex, false);
            }
            // If we found a new minimum, swap it with the current element
            if (minIndex !== i) {
                await this.swap(
                    this.sortArray,
                    i,
                    minIndex,
                    "sort.swap",
                    this.sortArray.getValue(i),
                    this.sortArray.getValue(minIndex)
                );
            }
            // Highlight the sorted part of the array
            this.sortArray.setIndexHighlight(i, true);
        }
        this.sortArray.setIndexHighlight(sortSize - 1, true);
        await this.pause("general.finished");

        // Reset the highlights
        for (let i = 0; i < sortSize; i++) {
            this.sortArray.setIndexHighlight(i, false);
        }
    }
}
