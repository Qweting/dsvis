DSVis.MergeSort = class MergeSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;
    compensate = 0;
    
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
        
        if((xRoot-3*xRoot/4*this.getObjectSize()/28) < 0){this.compensate = this.arraySize*6+3*xRoot/4*this.getObjectSize()/28-xRoot}
        else{this.compensate = 0}
        
        this.heapArray = this.SVG.dsArray(this.arraySize, xRoot+this.compensate, yRoot+this.$Svg.margin*4);
        this.mergeArray1 = this.SVG.dsArray(this.arraySize/2, xRoot+xRoot/2*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*4*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray2 = this.SVG.dsArray(this.arraySize/2, xRoot-xRoot/2*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*4*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray3 = this.SVG.dsArray(this.arraySize/4, xRoot-xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray4 = this.SVG.dsArray(this.arraySize/4, xRoot+xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray5 = this.SVG.dsArray(this.arraySize/4, xRoot-3*xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray6 = this.SVG.dsArray(this.arraySize/4, xRoot+3*xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        
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
}


    DSVis.MergeSort.messages = {
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