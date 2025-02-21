DSVis.SelectionSort = class SelectionSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;

    initialise(initialValues = null) {
        this.initialValues = initialValues;
        super.initialise();
        
    }

    async drawViewbox(right, down) {
        this.SVG.viewbox(right, down, this.$Svg.width, this.$Svg.height);
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        const [xRoot, yRoot] = this.getTreeRoot();
        this.heapArray = this.SVG.dsArray(this.arraySize, xRoot, yRoot+this.$Svg.margin*4);
        if (this.heapArray.x() < this.$Svg.margin)
            this.heapArray.x(this.$Svg.margin);
        this.sortSize = 0;
        if (this.initialValues) {
            this.State.resetting = true;
            await this.insert(...this.initialValues);
            this.State.resetting = false;
        }
        
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
        
    }

    async swap(j, k, message, ...args) {
        this.heapArray.swap(j, k, true);
        this.heapArray.setIndexHighlight(j, true);
        await this.pause(message, ...args);
    }

    async insertOne(value) {
        if (this.sortSize >= this.arraySize) {
            await this.pause('general.full');
            return;
        }

        let currentIndex = this.sortSize;
        const arrayLabel = this.SVG.textCircle(value, ...this.getNodeStart());
        let sortArray = []
        await this.pause('insert.value', value);

        arrayLabel.setCenter(this.heapArray.getCX(currentIndex), this.heapArray.cy(), true);
        sortArray.push(value);
        await this.pause();

        arrayLabel.remove();
        this.heapArray.setDisabled(currentIndex, false);
        this.heapArray.setValue(currentIndex, value);
        this.heapArray.setIndexHighlight(currentIndex, true);
        this.sortSize++;


        this.heapArray.setIndexHighlight(currentIndex, false);
    }


    async sort() {
        if (this.sortSize <= 1) {
            await this.pause('general.empty');
            return;
        }

        for (let i = 0; i < this.sortSize - 1; i++) {
            let minIndex = i;

            // Find the index of the minimum element in the unsorted part of the array
            for (let j = i + 1; j < this.sortSize; j++) {

                // Highlight the current element and the minimum element
                this.heapArray.setBlueHighlight(j, true);
                this.heapArray.setBlueHighlight(minIndex, true);

                // Message: Compare the current element with the minimum element
                await this.pause('sort.compare', this.heapArray.getValue(j), this.heapArray.getValue(minIndex));


                if (this.heapArray.getValue(j) < this.heapArray.getValue(minIndex)) {
                    // Unhighlight the previous minimum element
                    this.heapArray.setBlueHighlight(minIndex, false);

                    minIndex = j;

                    // Message: Found a new minimum element
                    await this.pause('sort.foundNewMin', this.heapArray.getValue(minIndex));
                } else {
                    // Unhighlight the current element
                    this.heapArray.setBlueHighlight(j, false);
                }
                // Unhighlight the minimum element and the current element
                this.heapArray.setBlueHighlight(j, false);
                this.heapArray.setBlueHighlight(minIndex, false);
            }
            // If we found a new minimum, swap it with the current element
            if (minIndex !== i) {
                await this.swap(i, minIndex, 'sort.swap', this.heapArray.getValue(i), this.heapArray.getValue(minIndex));
            }
            // Highlight the sorted part of the array
            this.heapArray.setIndexHighlight(i, true);
        }
        this.heapArray.setIndexHighlight(this.sortSize-1, true);
        await this.pause('general.finished');

        // Reset the highlights
        for (let i = 0; i < this.sortSize; i++) {
            this.heapArray.setIndexHighlight(i, false);
        }
    }

    

};





DSVis.SelectionSort.messages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a, b) => `Compare ${a} and ${b}`,
        swap: (a, b) => `Swap ${a} and ${b}`,
        foundNewMin:(a) => `Found a smaller value ${a}`,
    },
};


    