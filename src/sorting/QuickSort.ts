import { DSArray } from "src/objects/dsarray";
import {compare, NBSP} from "../../src/engine";
import {Sort} from "../../src/sorting/sort"

export const QuickSortMessages = {
    general: {
        empty: "Array is empty!",
        full: "Array is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a: string, b: string) => `Compare ${a} and ${b}`,
        swap: (a: string, b: string) => `Swap ${a} and ${b}`,
        findPivot: "Pivot is selected",
        lowBig: "Element bigger than pivot",
        highSmall: "Element smaller than pivot",
        pivotSwap: "Swap pivot into correct place"
        
        
    },
};

export class QuickSort extends Sort {

    async sort() {
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }

        for (let i = 0; i < this.sortArray.getSize(); i++){
            this.sortArray.setIndexHighlight(i, false);
        }

        if (this.sortArray.getSize() <= 1) {
            await this.pause('general.empty');
            return;
        }
        
        if(this.sortArray.getValue(this.sortArray.getSize()-1) === NBSP){
            this.sortArray.setSize(this.sortArray.getSize() - 1);
        }
        
        this.sortArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);

        await this.quickSort(this.sortArray, 0, this.sortArray.getSize()-1);

        for (let i = 0; i < this.sortArray.getSize(); i++){
            this.sortArray.setDisabled(i, false);
        }

        await this.pause('general.finished');

    }

    async quickSort(array: DSArray, low: number, high: number){ 
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }

        if(low >= high || low < 0){
            this.sortArray.setIndexHighlight(low, true, "Green");
            return;
        }

        const p = await this.partition(low, high);

        await this.quickSort(array, low, p-1);
        await this.quickSort(array, p+1, high);


    }

    async partition(left: number, right: number) {
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }
        
        const leftArrowId: string = "ArrowLow";
        const rightArrowId: string = "ArrowHigh";
        const blue = "#00C";
        const green = "green";
        let low = left;
        let high = right;


        for (let i = 0; i < this.sortArray.getSize(); i++){
            if (i < low || i > high){
                this.sortArray.setDisabled(i, true);
            }
            else{
                this.sortArray.setDisabled(i, false);
            }
        }

        let pivot = Math.floor((low + high)/2);
        const pivotValue = this.sortArray.getValue(pivot);
        
        await this.pause(`sort.findPivot`);

        this.sortArray.setIndexHighlight(pivot, true);
        await this.swap(this.sortArray, low, pivot, `sort.swap`, this.sortArray.getValue(low), this.sortArray.getValue(pivot));
        this.sortArray.setIndexHighlight(pivot, false);
        pivot = low;
        this.sortArray.setIndexHighlight(low, false);
        this.sortArray.setDisabled(pivot, true);
        low += 1;

        this.sortArray.addArrow(low, leftArrowId);
        this.sortArray.setArrowHighlight(leftArrowId, true);
        this.sortArray.addArrow(high, rightArrowId);
        this.sortArray.setArrowHighlight(rightArrowId, true, blue);

        while (true) {
            
            this.sortArray.setIndexHighlight(low, true);
            this.sortArray.setIndexHighlight(high, true, blue);
             
            while (low <= high && compare(this.sortArray.getValue(low), pivotValue) < 0) {
                this.sortArray.setIndexHighlight(low, true);
                await this.pause('sort.compare', this.sortArray.getValue(low), pivotValue);
                this.sortArray.setIndexHighlight(low, false);
                low += 1;
                this.sortArray.moveArrow(leftArrowId, low);
                
            }

            if (low < right){
                this.sortArray.setIndexHighlight(low, true);
            }

            await this.pause('sort.lowBig')

            while (low <= high && compare(this.sortArray.getValue(high), pivotValue) > 0) {
                this.sortArray.setIndexHighlight(high, true, blue);
                await this.pause('sort.compare', this.sortArray.getValue(high), pivotValue);
                this.sortArray.setIndexHighlight(high, false, blue);
                high -= 1;
                this.sortArray.moveArrow(rightArrowId, high);
            }
            await this.pause('sort.highSmall');
            this.sortArray.setIndexHighlight(high, true, blue);

            if (low > high) {break;}

            
            await this.swap(this.sortArray, low, high, `sort.swap`, this.sortArray.getValue(low), this.sortArray.getValue(high));
            
            this.sortArray.setIndexHighlight(low, false);
            this.sortArray.setIndexHighlight(high, false);
            

            low += 1; 
            high -= 1;
            if (low < right && high > left){
                this.sortArray.setIndexHighlight(low, true);
                this.sortArray.setIndexHighlight(high, true, blue);
            }   
            this.sortArray.moveArrow(leftArrowId, low);
            this.sortArray.moveArrow(rightArrowId, high);
        }

        if (low < right){
            this.sortArray.setIndexHighlight(low, false);
        }
        await this.pause('sort.pivotSwap');
        await this.swap(this.sortArray ,pivot, high, `sort.swap`, this.sortArray.getValue(pivot), this.sortArray.getValue(high));
        this.sortArray.setIndexHighlight(high, true, green);
        if (this.sortArray.getSize() <= 2) {
            this.sortArray.setIndexHighlight(pivot, true, green);
        }
        this.sortArray.removeArrow(leftArrowId);
        this.sortArray.removeArrow(rightArrowId);

        return high;
    }
}
