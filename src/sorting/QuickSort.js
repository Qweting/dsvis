DSVis.QuickSort = class QuickSort extends DSVis.Engine {

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
        this.sortArray = this.SVG.dsArray(1, xRoot, yRoot+this.$Svg.margin*4);
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
        this.sortArray.setSize(this.sortArray.getSize() + values.length);
        this.sortArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);
        for (const val of values) await this.insertOne(val); 
    }

    async swap(arr, j, k, message, ...args) {
        arr.swap(j, k, true);
        arr.setIndexHighlight(j, true);
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

        arrayLabel.setCenter(this.sortArray.getCX(currentIndex), this.sortArray.cy(), true);
        sortArray.push(value);
        await this.pause();

        arrayLabel.remove();
        this.sortArray.setDisabled(currentIndex, false);
        this.sortArray.setValue(currentIndex, value);
        this.sortArray.setIndexHighlight(currentIndex, true);
        this.sortSize++;


        this.sortArray.setIndexHighlight(currentIndex, false);
    }

    async sort() {
        for (let i = 0; i < array.getSize(); i++){
            array.setIndexHighlight(i, false);
        }

        if (this.sortSize <= 1) {
            await this.pause('general.empty');
            return;
        }
        
        if(this.sortArray.getValue(this.sortArray.getSize()-1) === DSVis.NBSP){
            this.sortArray.setSize(this.sortArray.getSize() - 1);
        }
        
        this.sortArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);

        await this.quickSort(this.sortArray, 0, this.sortArray.getSize()-1);

        for (let i = 0; i < this.sortArray.getSize(); i++){
            this.sortArray.setDisabled(i, false);
        }

        await this.pause('general.finished');

    }

    async quickSort(array, low, high){ 
        if(low >= high || low < 0){
            array.setIndexHighlight(low, true, "Green");
            return;
        }

        const p = await this.partition(array, low, high);

        await this.quickSort(array, low, p-1);
        await this.quickSort(array, p+1, high);


    }

    async partition(array, left, right) {
        const blue = "#00C";
        let low = left;
        let high = right;


        for (let i = 0; i < array.getSize(); i++){
            if (i < low || i > high){
                this.sortArray.setDisabled(i, true);
            }
            else{
                this.sortArray.setDisabled(i, false);
            }
        }

        let pivot = Math.floor((low + high)/2);
        const pivotValue = array.getValue(pivot);
        
        await this.pause(`sort.findPivot`);

        array.setIndexHighlight(pivot, true);
        await this.swap(array, low, pivot, `sort.swap`, array.getValue(low), array.getValue(pivot));
        array.setIndexHighlight(pivot, false);
        pivot = low;
        array.setIndexHighlight(low, false);
        array.setDisabled(pivot, true);
        low += 1;

        array.addArrow(low, "arrowLow");
        array.setArrowHighlight("arrowLow", low);
        array.addArrow(high, "arrowHigh");
        array.setArrowHighlight("arrowHigh", high, blue);

        while (true) {
            
            array.setIndexHighlight(low, true);
            array.setIndexHighlight(high, true, blue);
             
            while (low <= high && DSVis.compare(array.getValue(low), pivotValue) < 0) {
                array.setIndexHighlight(low, true);
                await this.pause('sort.compare', array.getValue(low), pivotValue);
                array.setIndexHighlight(low, false);
                low += 1;
                array.moveArrow("arrowLow", low);
                
            }

            if (low < right){
                     array.setIndexHighlight(low, true);
            }

            await this.pause('sort.lowBig')

            while (low <= high && DSVis.compare(array.getValue(high), pivotValue) > 0) {
                array.setIndexHighlight(high, true, blue);
                await this.pause('sort.compare', array.getValue(high), pivotValue);
                array.setIndexHighlight(high, false, blue);
                high -= 1;
                array.moveArrow("arrowHigh", high);
            }
            await this.pause('sort.highSmall');
            array.setIndexHighlight(high, true, blue);

            if (low > high) break;

            
            await this.swap(array, low, high, `sort.swap`, array.getValue(low), array.getValue(high));
            
            array.setIndexHighlight(low, false);
            array.setIndexHighlight(high, false);
            

            low += 1; 
            high -= 1;
            if (low < right && high > left){
                array.setIndexHighlight(low, true);
                array.setIndexHighlight(high, true, blue);
            }   
            array.moveArrow("arrowLow", low);
            array.moveArrow("arrowHigh", high);
        }

        if (low < right){
            array.setIndexHighlight(low, false);
        }
        await this.pause('sort.pivotSwap');
        await this.swap(array ,pivot, high, `sort.swap`, array.getValue(pivot), array.getValue(high));
        array.setIndexHighlight(high, true, "green");
        if (array.getSize() <= 2) {
            array.setIndexHighlight(pivot, true, "green");
        }
        array.removeArrow("arrowLow", low);
        array.removeArrow("arrowHigh", high);

        return high;
    }
}


    DSVis.QuickSort.messages = {
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
            findPivot: "Pivot is selected",
            lowBig: "Element bigger than pivot",
            highSmall: "Element smaller than pivot",
            pivotSwap: "Swap pivot into correct place"
            
            
        },
    };