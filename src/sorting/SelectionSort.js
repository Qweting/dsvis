DSVis.SelectionSort = class SelectionSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;

    initialise(initialValues = null) {
        this.initialValues = initialValues;
        super.initialise();
        
    }

    async drawViewbox(right, down, zoom) {
        this.SVG.viewbox(right, down, this.$Svg.width*zoom, this.$Svg.height*zoom);
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.SVG.dsArray(this.arraySize, xRoot, yRoot+this.$Svg.margin*4);
        if (this.sortArray.x() < this.$Svg.margin)
            this.sortArray.x(this.$Svg.margin);
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
        this.sortArray.swap(j, k, true);
        this.sortArray.setIndexHighlight(j, true);
        await this.pause(message, ...args);
    }

    async insertOne(value) {
        if (this.sortSize >= this.arraySize) {
            await this.pause('general.full');
            return;
        }

        let currentIndex = this.sortSize;
        const arrayLabel = this.SVG.textCircle(value, ...this.getNodeStart());
        await this.pause('insert.value', value);

        arrayLabel.setCenter(this.sortArray.getCX(currentIndex), this.sortArray.cy(), true);
        await this.pause();

        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.sortSize++;


        this.sortArray.setIndexHighlight(currentIndex, false);
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
                this.sortArray.setBlueHighlight(j, true);
                this.sortArray.setBlueHighlight(minIndex, true);

                // Message: Compare the current element with the minimum element
                await this.pause('sort.compare', this.sortArray.getValue(j), this.sortArray.getValue(minIndex));


                if (this.sortArray.getValue(j) < this.sortArray.getValue(minIndex)) {
                    // Unhighlight the previous minimum element
                    this.sortArray.setBlueHighlight(minIndex, false);

                    minIndex = j;

                    // Message: Found a new minimum element
                    await this.pause('sort.foundNewMin', this.sortArray.getValue(minIndex));
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
                await this.swap(i, minIndex, 'sort.swap', this.sortArray.getValue(i), this.sortArray.getValue(minIndex));
            }
            // Highlight the sorted part of the array
            this.sortArray.setIndexHighlight(i, true);
        }
        this.sortArray.setIndexHighlight(this.sortSize-1, true);
        await this.pause('general.finished');

        // Reset the highlights
        for (let i = 0; i < this.sortSize; i++) {
            this.sortArray.setIndexHighlight(i, false);
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


    