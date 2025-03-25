DSVis.MergeSort = class MergeSort extends DSVis.Engine {

    arraySize = 28;
    initialValues;
    compensate = 0;
    mergeArrayList = [];
    
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
        this.sortArray.center(this.getTreeRoot()[0], this.getTreeRoot()[1]+this.$Svg.margin*4);
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
        for(let i = 0; i < this.mergeArrayList.length; i++){
            this.mergeArrayList[i].remove();
        }
        this.compensate = 0;
        this.mergeArrayList = [];
        this.sortArray.getValues()
        if(this.sortArray.getValue(this.sortArray.getSize()-1) === DSVis.NBSP){
        this.sortArray.setSize(this.sortArray.getSize() - 1);
    }
        for(let i = 0; i < this.sortArray.getSize(); i++){
            this.sortArray.setDisabled(i, true);
        }
        this.sortArray.center(this.getTreeRoot()[0], this.getTreeRoot()[1]+this.$Svg.margin*4);


        await this.mergeSort(this.sortArray, 0, this.sortArray.getSize(), 1);
        await this.pause('general.finished');
    }
    async mergeSort(arr, left, right, iteration) {
        if (left >= right){
            return;}
    
        const mid = Math.ceil(left + (right - left) / 2);
        const [xCenter,yCenter] = this.getTreeRoot();
        const baseY = this.$Svg.margin*4;
        const CX = arr.getCX(0);

        if(arr.getSize() > 2){
            const mergeArray1 = this.SVG.dsArray(mid-left, CX, arr.cy());
            for(let k = 0; k < mid; k++){
                mergeArray1.setValue(k, arr.getValue(k));
            }
            this.animate(mergeArray1).cx(CX-arr.engine().getObjectSize()*2/iteration).cy(yCenter+baseY*iteration*this.getObjectSize()/28+baseY);
            await this.pause('sort.split', mergeArray1.getValues(), arr.getValues());

            const mergeArray2 = this.SVG.dsArray(right-mid, arr.getCX(mid), arr.cy());
            for(let k = 0; k+mid < right; k++){
                mergeArray2.setValue(k, arr.getValue(k+mid));
            }
            this.animate(mergeArray2).cx(arr.getCX(arr.getSize()-1)+arr.engine().getObjectSize()*2/iteration).cy(yCenter+baseY*iteration*this.getObjectSize()/28+baseY);
            await this.pause('sort.split', mergeArray2.getValues(), arr.getValues());
            this.mergeArrayList.push(mergeArray1);
            this.mergeArrayList.push(mergeArray2);
            //Compensation to keep the array within the viewbox
            console.log(mergeArray1.getCX(0));
            if(mergeArray1.getCX(0) < 0){
                this.compensate = mergeArray1.getCX(0)*(-1) + this.$Svg.margin;

                const sortArrayCenter = this.sortArray.getCX(this.sortArray.getSize()/2);
                this.sortArray.center(sortArrayCenter + this.compensate, this.sortArray.cy());
                
                for(let j = 0; j < this.mergeArrayList.length; j++){
                    const midPoint = this.mergeArrayList[j].getSize()/2;
                    const centerCords = this.mergeArrayList[j].getCX(midPoint);
                    this.mergeArrayList[j].center(centerCords + this.compensate, this.mergeArrayList[j].cy());
                }
            }
            await this.mergeSort(mergeArray1, left, mid, iteration+1);

            await this.mergeSort(mergeArray2, 0, right-mid, iteration+1);
            
            await this.merge(arr, mergeArray1, mergeArray2);
        }
        else if(arr.getSize() == 2){
            await this.pause('sort.compare', arr.getValue(0), arr.getValue(1));
            if(arr.getValue(0) > arr.getValue(1)){
                await this.swap(arr, 0, 1, 'sort.swap', arr.getValue(0), arr.getValue(1));
                arr.setIndexHighlight(0, false);
                arr.setIndexHighlight(1, false);
            }
            arr.setDisabled(0, false);
            arr.setDisabled(1, false);
        }else{
            arr.setDisabled(0, false);
        }
    }

    async merge(array, subarray1, subarray2) {
        let i
        let a1i = 0;
        let a2i = 0;
        for(i=0; i < array.getSize(); i++){
            array.setValue(i, DSVis.NBSP);
        }
        for(i = 0; i < array.getSize(); i++){
            await this.pause('sort.compare', (a1i < subarray1.getSize() ? subarray1.getValue(a1i) : 'empty array'), (a2i < subarray2.getSize() ? subarray2.getValue(a2i) : 'empty array'));
            if(a2i >= subarray2.getSize() || (a1i < subarray1.getSize() && subarray1.getValue(a1i) < subarray2.getValue(a2i))){
                await this.pause('sort.move', subarray1.getValue(a1i));
                let svgValue = this.SVG.textCircle(subarray1.getValue(a1i), subarray1.getCX(a1i), subarray1.cy());
                this.animate(svgValue).center(array.getCX(i), array.cy(), true);
                await this.pause();
                svgValue.remove();
                subarray1.setDisabled(a1i, true);
                array.setDisabled(i, false);
                array.setValue(i, subarray1.getValue(a1i));
                a1i++;
            }
            else{
                await this.pause('sort.move', subarray2.getValue(a2i));
                let svgValue = this.SVG.textCircle(subarray2.getValue(a2i), subarray2.getCX(a2i), subarray2.cy());
                this.animate(svgValue).center(array.getCX(i), array.cy(), true);
                await this.pause();
                svgValue.remove();
                subarray2.setDisabled(a2i, true);
                array.setDisabled(i, false);
                array.setValue(i, subarray2.getValue(a2i));
                a2i++;
            }
        }
       return array;
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
            split: (a, b) => `Split ${a} from ${b}`,
            move: (a) => `Move ${a} to upper array`,
            foundNewMin:(a) => `Found a smaller value ${a}`,
        },
    };