
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DS */
///////////////////////////////////////////////////////////////////////////////

DS.BinaryHeap = class BinaryHeap {
    $arraySize = 28;

    constructor(initialValues = null) {
        this._initialValues = initialValues;
    }

    async reset() {
        this.treeRoot = null;
        this.treeNodes = new Array(this.$arraySize);
        this.heapArray = DS.SVG().dsArray(this.$arraySize, DS.getRootX(), DS.$SvgHeight - DS.getRootY());
        if (this.heapArray.x() < DS.$Info.x) this.heapArray.x(DS.$Info.x);
        this.heapSize = 0;
        if (this._initialValues) {
            DS.$resetting = true;
            await this.insert(...this._initialValues);
            DS.$resetting = false;
        }
    }

    resizeTree() {
        const animate = !DS.$resetting;
        this.treeRoot?.resize(DS.getRootX(), DS.getRootY(), animate);
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
    }

    async swap(j, k, message = "") {
        const jNode = this.treeNodes[j], kNode = this.treeNodes[k];
        const jLabel = DS.SVG().textCircle(jNode.getText(), jNode.cx(), jNode.cy());
        const kLabel = DS.SVG().textCircle(kNode.getText(), kNode.cx(), kNode.cy());
        jLabel.setCenter(kLabel.cx(), kLabel.cy(), true);
        kLabel.setCenter(jLabel.cx(), jLabel.cy(), true);
        this.heapArray.swap(j, k, true);
        await DS.pause(message);
        jNode.setText(kLabel.getText());
        kNode.setText(jLabel.getText());
        jLabel.remove();
        kLabel.remove();
    }


    async insertOne(value) {
        if (this.heapSize >= this.$arraySize) {
            await DS.pause("Heap is full!");
            return;
        }

        let currentIndex = this.heapSize;
        let parentIndex = Math.floor((currentIndex - 1) / 2);
        let parentNode = this.treeNodes[parentIndex];
        const arrayLabel = DS.SVG().textCircle(value, DS.getStartX(), DS.getStartY());
        let treeNode = DS.SVG().binaryNode(value, DS.getStartX(), DS.getStartY());
        this.treeNodes[currentIndex] = treeNode;
        await DS.pause(`Insert value: ${value}`);

        arrayLabel.setCenter(this.heapArray.getCX(currentIndex), this.heapArray.cy(), true);
        if (currentIndex === 0) {
            this.treeRoot = treeNode;
        } else {
            const direction = (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChild(direction, treeNode);
        }
        this.resizeTree();
        await DS.pause();

        arrayLabel.remove();
        this.heapArray.setDisabled(currentIndex, false);
        this.heapArray.setValue(currentIndex, value);
        this.heapArray.setIndexHighlight(currentIndex, true);
        this.heapSize++;

        while (currentIndex > 0) {
            treeNode.setHighlight(true);
            await DS.pause(`Shift the value upwards`);
            parentIndex = Math.floor((currentIndex - 1) / 2);
            parentNode = this.treeNodes[parentIndex];
            const parentValue = this.heapArray.getValue(parentIndex);
            this.heapArray.setIndexHighlight(parentIndex, true);
            const direction = (currentIndex - 1) / 2 === parentIndex ? "left" : "right";
            parentNode.setChildHighlight(direction, true);
            const cmp = DS.compare(value, parentValue);
            if (cmp >= 0) {
                await DS.pause(`The parent ${parentValue} is not larger: stop here`);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(parentIndex, false);
                treeNode.setHighlight(false);
                parentNode.setChildHighlight(direction, false);
                break;
            }
            await DS.pause(`The parent ${parentValue} is larger`);
            await this.swap(currentIndex, parentIndex, `Swap ${value} and ${parentValue}`);
            this.heapArray.setIndexHighlight(currentIndex, false);
            treeNode.setHighlight(false);
            parentNode.setChildHighlight(direction, false);
            currentIndex = parentIndex;
            treeNode = parentNode;
        }
        this.heapArray.setIndexHighlight(currentIndex, false);
        treeNode.setHighlight(false);
    }


    async deleteMin() {
        if (this.heapSize === 0) {
            await DS.pause("Heap is empty!");
            return;
        }
        this.heapSize--;
        const minValue = this.heapArray.getValue(0);

        const arrayLabel = DS.SVG().textCircle(minValue, this.heapArray.getCX(0), this.heapArray.cy());
        if (this.heapSize === 0) {
            await DS.pause(`Remove the root: ${minValue}`);
            this.heapArray.setValue(0);
            arrayLabel.setCenter(DS.getStartX(), DS.getStartY(), true);
            this.treeRoot.setCenter(DS.getStartX(), DS.getStartY(), true);
            await DS.pause();
            arrayLabel.remove();
            this.heapArray.setDisabled(0, true);
            this.treeRoot.remove();
            this.treeRoot = null;
            return;
        }

        const treeLabel = DS.SVG().textCircle(minValue, this.treeRoot.cx(), this.treeRoot.cy());
        await DS.pause(`Remove the minimum value: ${minValue}`);
        this.heapArray.setValue(0);
        this.treeRoot.setText();
        arrayLabel.setCenter(DS.getStartX(), DS.getStartY(), true);
        treeLabel.setCenter(DS.getStartX(), DS.getStartY(), true);
        let currentValue = this.heapArray.getValue(this.heapSize);
        await DS.pause();
        await this.swap(0, this.heapSize, `Swap in the last heap value to the first position: ${currentValue}`);
        this.treeNodes[this.heapSize].remove();
        this.heapArray.setDisabled(this.heapSize, true);
        await DS.pause(`Remove the new last heap value`);

        let currentIndex = 0;
        let currentNode = this.treeNodes[currentIndex];
        while (currentIndex < this.heapSize) {
            currentNode.setHighlight(true);
            this.heapArray.setIndexHighlight(currentIndex, true);
            let childIndex = currentIndex * 2 + 1;
            if (childIndex >= this.heapSize) {
                await DS.pause("Finished");
                currentNode.setHighlight(false);
                this.heapArray.setIndexHighlight(currentIndex, false);
                break;
            }

            await DS.pause(`Shift the value downwards`);
            let direction = "left";
            let childValue = this.heapArray.getValue(childIndex);
            if (childIndex + 1 < this.heapSize && DS.compare(childValue, this.heapArray.getValue(childIndex + 1)) > 0) {
                direction = "right";
                childIndex++;
                childValue = this.heapArray.getValue(childIndex);
            }
            const childNode = this.treeNodes[childIndex];

            this.heapArray.setIndexHighlight(childIndex, true);
            currentNode.setChildHighlight(direction, true);
            childNode.setHighlight(true);

            const cmp = DS.compare(currentValue, childValue);
            if (cmp <= 0) {
                await DS.pause(`The value ${currentValue} is not larger than the smallest child ${childValue}: stop here`);
                this.heapArray.setIndexHighlight(currentIndex, false);
                this.heapArray.setIndexHighlight(childIndex, false);
                currentNode.setChildHighlight(direction, false);
                childNode.setHighlight(false);
                break;
            }

            await DS.pause(`The value ${currentValue} is larger than the smallest child ${childValue}`);
            await this.swap(currentIndex, childIndex, `Swap ${currentValue} and ${childValue}`);
            this.heapArray.setIndexHighlight(currentIndex, false);
            this.heapArray.setIndexHighlight(childIndex, false);
            currentNode.setChildHighlight(direction, false);
            childNode.setHighlight(false);
            currentIndex = childIndex;
            currentNode = childNode;
        }

        await DS.pause();
        arrayLabel.remove();
        treeLabel.remove();
        this.resizeTree();
    }

};
