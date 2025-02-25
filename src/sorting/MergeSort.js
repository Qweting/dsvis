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
        this.heapArray = this.SVG.dsArray(1, xRoot, yRoot+this.$Svg.margin*4);
        /*this.mergeArray1 = this.SVG.dsArray(this.arraySize/2, xRoot+xRoot/2*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*4*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray2 = this.SVG.dsArray(this.arraySize/2, xRoot-xRoot/2*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*4*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray3 = this.SVG.dsArray(this.arraySize/4, xRoot-xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray4 = this.SVG.dsArray(this.arraySize/4, xRoot+xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray5 = this.SVG.dsArray(this.arraySize/4, xRoot-3*xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);
        this.mergeArray6 = this.SVG.dsArray(this.arraySize/4, xRoot+3*xRoot/4*this.getObjectSize()/28+this.compensate, yRoot+this.$Svg.margin*8*this.getObjectSize()/28+this.$Svg.margin*4);*/
        
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
        this.heapArray.setSize(this.heapArray.getSize() + values.length);
        this.heapArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);
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
        this.heapArray.setSize(this.heapArray.getSize() - 1);
        this.heapArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);
        this.mergeSort(this.heapArray, 0, this.heapArray.getSize(), 1);
    }
    async mergeSort(arr, left, right, iteration) {
        if (left >= right){
            return;}
    
        const mid = Math.floor(left + (right - left) / 2);
        const [xCenter,yCenter] = this.getTreeRoot();
        const baseY = this.$Svg.margin*4;
        const CX = arr.getCX(0);
        console.log(CX);
        if(arr.getSize() > 2){
            const mergeArray1 = this.SVG.dsArray(mid-left, CX, arr.cy());
            for(let k = 0; k < mid; k++){
                mergeArray1.setValue(k, arr.getValue(k));
            }
            this.animate(mergeArray1).cx(CX-arr.engine().getObjectSize()*2/iteration+this.compensate).cy(yCenter+baseY*iteration*this.getObjectSize()/28+baseY);
            
            const mergeArray2 = this.SVG.dsArray(right-mid, arr.getCX(mid), arr.cy());
            for(let k = 0; k+mid < right; k++){
                mergeArray2.setValue(k, arr.getValue(k+mid));
            }
            this.animate(mergeArray2).cx(arr.getCX(arr.getSize()-1)+arr.engine().getObjectSize()*2/iteration+this.compensate).cy(yCenter+baseY*iteration*this.getObjectSize()/28+baseY);
            console.log(arr.getCX(0));
            await this.mergeSort(mergeArray1, left, mid, iteration+1);
            //this.mergeArray2 = this.SVG.dsArray(right-mid, arr.getCX(arr.getSize()-1)+arr.engine().getObjectSize()*2/iteration+this.compensate, yCenter+baseY*iteration*this.getObjectSize()/28+baseY);
            await this.mergeSort(mergeArray2, 0, right-mid, iteration+1);
        }
        this.merge(arr, left, mid, right);
    }

    async merge(array,left,mid,right) {
       return;
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