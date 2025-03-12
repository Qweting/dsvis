DSVis.InsertionSort = class InsertionSort extends DSVis.Engine {

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

        for (let i=1; i < this.sortSize; i++) {
            let j = i;
            
            
            while (j > 0) {
    

                this.heapArray.setIndexHighlight(j, true);
                this.heapArray.setIndexHighlight(j-1, true);
                await this.pause('sort.compare', this.heapArray.getValue(j), this.heapArray.getValue(j-1));
                

                if (DSVis.compare( this.heapArray.getValue(j), this.heapArray.getValue(j-1)) >= 0){
                    await this.pause('sort.smallerLeft', this.heapArray.getValue(j-1), this.heapArray.getValue(j));
                    this.heapArray.setIndexHighlight(j, false);
                    this.heapArray.setIndexHighlight(j-1, false);
                    break;
                }
                
                await this.swap(j, j-1, 'sort.swap', this.heapArray.getValue(j), this.heapArray.getValue(j-1));
                

                this.heapArray.setIndexHighlight(j, false);
                this.heapArray.setIndexHighlight(j-1, false);
                j -= 1;
                
                
            }
            
        }
        


        
    }

    

};


DSVis.InsertionSort.messages = {
    general: {
        empty: "Heap is empty!",
        full: "Heap is full!",
        finished: "Finished",
    },
    insert: {
        value: (value) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a, b) => `Compare ${a} and ${b}`,
        swap: (a, b) => `Swap ${a} and ${b} since ${a} is smaller`,
        smallerLeft:(a,b) => `${a} is smaller than ${b} no swap`,
        record: (a) => `The record is set to ${a}` 
    },
};
