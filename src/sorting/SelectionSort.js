DSVis.SelectionSort = class SelectionSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;

    initialise(initialValues = null) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        this.treeRoot = null;
        this.treeNodes = new Array(this.arraySize);
        const [xRoot, yRoot] = this.getTreeRoot();
        this.heapArray = this.SVG.dsArray(this.arraySize, xRoot, this.SVG.viewbox().height - yRoot);
        if (this.heapArray.x() < this.$Svg.margin)
            this.heapArray.x(this.$Svg.margin);
        this.heapSize = 0;
        if (this.initialValues) {
            this.State.resetting = true;
            await this.insert(...this.initialValues);
            this.State.resetting = false;
        }
    }

    resizeTree() {
        const animate = !this.State.resetting;
        this.treeRoot?.resize(...this.getTreeRoot(), animate);
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
    }

    async swap(j, k, message, ...args) {
        const jNode = this.treeNodes[j], kNode = this.treeNodes[k];
        const jLabel = this.SVG.textCircle(jNode.getText(), jNode.cx(), jNode.cy());
        const kLabel = this.SVG.textCircle(kNode.getText(), kNode.cx(), kNode.cy());
        jLabel.setCenter(kLabel.cx(), kLabel.cy(), true);
        kLabel.setCenter(jLabel.cx(), jLabel.cy(), true);
        this.heapArray.swap(j, k, true);
        await this.pause(message, ...args);
        jNode.setText(kLabel.getText());
        kNode.setText(jLabel.getText());
        jLabel.remove();
        kLabel.remove();
    }


    async insertOne(value) {
        if (this.heapSize >= this.arraySize) {
            await this.pause('general.full');
            return;
        }

        let currentIndex = this.heapSize;
        let parentIndex = Math.floor((currentIndex - 1) / 2);
        let parentNode = this.treeNodes[parentIndex];
        const arrayLabel = this.SVG.textCircle(value, ...this.getNodeStart());
        let treeNode = this.SVG.binaryNode(value, ...this.getNodeStart());
        this.treeNodes[currentIndex] = treeNode;
        await this.pause('insert.value', value);

        arrayLabel.setCenter(this.heapArray.getCX(currentIndex), this.heapArray.cy(), true);
        if (currentIndex === 0) {
            this.treeRoot = treeNode;
        } else {
            const direction = (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChild(direction, treeNode);
        }
        this.resizeTree();
        await this.pause();

        arrayLabel.remove();
        this.heapArray.setDisabled(currentIndex, false);
        this.heapArray.setValue(currentIndex, value);
        this.heapArray.setIndexHighlight(currentIndex, true);
        this.heapSize++;


        this.heapArray.setIndexHighlight(currentIndex, false);
        treeNode.setHighlight(false);
    }


    async deleteMin() {
        if (this.heapSize === 0) {
            await this.pause('general.empty');
            return;
        }
        this.heapSize--;
        const minValue = this.heapArray.getValue(0);

        const arrayLabel = this.SVG.textCircle(minValue, this.heapArray.getCX(0), this.heapArray.cy());
        if (this.heapSize === 0) {
            await this.pause('delete.root', minValue);
            this.heapArray.setValue(0);
            arrayLabel.setCenter(...this.getNodeStart(), true);
            this.treeRoot.setCenter(...this.getNodeStart(), true);
            await this.pause();
            arrayLabel.remove();
            this.heapArray.setDisabled(0, true);
            this.treeRoot.remove();
            this.treeRoot = null;
            return;
        }

        const treeLabel = this.SVG.textCircle(minValue, this.treeRoot.cx(), this.treeRoot.cy());
        await this.pause('remove.minValue', minValue);
        this.heapArray.setValue(0);
        this.treeRoot.setText();
        arrayLabel.setCenter(...this.getNodeStart(), true);
        treeLabel.setCenter(...this.getNodeStart(), true);
        const currentValue = this.heapArray.getValue(this.heapSize);
        await this.pause();
        await this.swap(0, this.heapSize, 'swap.lastToFirst', currentValue);
        this.treeNodes[this.heapSize].remove();
        this.heapArray.setDisabled(this.heapSize, true);
        await this.pause('delete.lastHeap');

        let currentIndex = 0;
        let currentNode = this.treeNodes[currentIndex];
        while (currentIndex < this.heapSize) {
            currentNode.setHighlight(true);
            this.heapArray.setIndexHighlight(currentIndex, true);
            let childIndex = currentIndex * 2 + 1;
            if (childIndex >= this.heapSize) {
                await this.pause('finished');
                currentNode.setHighlight(false);
                this.heapArray.setIndexHighlight(currentIndex, false);
                break;
            }

            await this.pause('delete.shiftDown');
            let direction = "left";
            let childValue = this.heapArray.getValue(childIndex);
            if (childIndex + 1 < this.heapSize && DSVis.compare(childValue, this.heapArray.getValue(childIndex + 1)) > 0) {
                direction = "right";
                childIndex++;
                childValue = this.heapArray.getValue(childIndex);
            }
            const childNode = this.treeNodes[childIndex];

            this.heapArray.setIndexHighlight(childIndex, true);
            currentNode.setChildHighlight(direction, true);
            childNode.setHighlight(true);

            const cmp = DSVis.compare(currentValue, childValue);
            if (cmp <= 0) {
                await this.pause('delete.stopShift', currentValue, childValue);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(childIndex, false);
                currentNode.setChildHighlight(direction, false);
                childNode.setHighlight(false);
                break;
            }

            await this.pause('delete.shiftAgain', currentValue, childValue);
            await this.swap(currentIndex, childIndex, 'swap.swap', currentValue, childValue);
            this.heapArray.setIndexHighlight(currentIndex, false);
            this.heapArray.setIndexHighlight(childIndex, false);
            currentNode.setChildHighlight(direction, false);
            childNode.setHighlight(false);
            currentIndex = childIndex;
            currentNode = childNode;
        }

        await this.pause();
        arrayLabel.remove();
        treeLabel.remove();
        this.resizeTree();
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
    delete: {
        root: (minValue) => `Remove the root: ${minValue}`,
        minValue: (minValue) => `Remove the minimum value: ${minValue}`,
        lastHeap: "Remove the new last heap value",
        shiftDown: "Shift the value downwards",
        stopShift: (currentValue, childValue) => `The value ${currentValue} is not larger than the smallest child ${childValue}: stop here`,
        shiftAgain: (currentValue, childValue) => `The value ${currentValue} is larger than the smallest child ${childValue}`,
    },
    swap: {
        swap: (a, b) => `Swap ${a} and ${b}`,
        lastToFirst: (val) => `Swap in the last heap value to the first position: ${val}`,
    },
};


    