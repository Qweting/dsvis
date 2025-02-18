DSVis.SelectionSort = class SelectionSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;

    initialise(initialValues = null) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        const [xRoot, yRoot] = this.getTreeRoot();
        this.heapArray = this.SVG.dsArray(this.arraySize, xRoot, this.SVG.viewbox().height - yRoot);
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
            for (let j = i + 1; j < this.sortSize; j++) {
                this.heapArray.setIndexHighlight(j, true);
                await this.pause('sort.compare', this.heapArray.getValue(j), this.heapArray.getValue(minIndex));
                if (this.heapArray.getValue(j) < this.heapArray.getValue(minIndex)) {
                    await this.pause('sort.foundMin', this.heapArray.setIndexHighlight(minIndex, false));
                    minIndex = j;
                } else {
                    this.heapArray.setIndexHighlight(j, false);
                }
            }

            if (minIndex !== i) {
                await this.swap(i, minIndex, 'sort.swap', this.heapArray.getValue(i), this.heapArray.getValue(minIndex));
            }
        }

        await this.pause('general.finished');
    }

};


DSVis.BinaryHeap.messages = {
    general: {
        empty: "Heap is empty!",
        full: "Heap is full!",
        finished: "Finished",
    },
    insert: {
        value: (value) => `Insert value: ${value}`,
        shiftUp: "Shift the value upwards",
        stopShift: (parentValue) => `The parent ${parentValue} is not larger: stop here`,
        shiftAgain: (parentValue) => `The parent ${parentValue} is larger`,
    },
    sort: {
        compare: (a, b) => `Compare ${a} and ${b}`,
        swap: (a, b) => `Swap ${a} and ${b}`,
    },
    swap: {
        swap: (a, b) => `Swap ${a} and ${b}`,
        lastToFirst: (val) => `Swap in the last heap value to the first position: ${val}`,
    },
};


    