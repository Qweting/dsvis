import { NBSP } from "../../src/engine";
import {compare} from "../../src/helpers"
import {Sort} from "../../src/sorting/sort"


export const InsertionSortmessages = {
    general: {
        empty: "Heap is empty!",
        full: "Heap is full!",
        finished: "Finished",
    },
    insert: {
        value: (value: string) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a: string, b: string) => `Compare ${a} and ${b}`,
        swap: (a: string, b: string) => `Swap ${a} and ${b} since ${a} is smaller`,
        smallerLeft:(a: string, b: string) => `${a} is smaller than ${b} no swap`,
        record: (a: string) => `The record is set to ${a}` 
    },
};

export class InsertionSort extends Sort {
    messages = InsertionSortmessages;

    async sort() {
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }

        const sortSize = this.sortArray.getSize()
    
        if (sortSize <= 1) {
            await this.pause('general.empty');
            return;
        }

        if(this.sortArray.getValue(this.sortArray.getSize()-1) === NBSP){
            this.sortArray.setSize(this.sortArray.getSize() - 1);
        }
                
        //Center the array depending on its size
        this.sortArray.center(this.getTreeRoot()[0]+this.compensate, this.getTreeRoot()[1]+this.$Svg.margin*4);
        
        for (let i=1; i < sortSize; i++) {
            let j = i;
            
            
            while (j > 0) {
    

                this.sortArray.setIndexHighlight(j, true);
                this.sortArray.setIndexHighlight(j-1, true);
                await this.pause('sort.compare', this.sortArray.getValue(j), this.sortArray.getValue(j-1));
                
                //Check if the current element is larger than the element to its left
                if (compare( this.sortArray.getValue(j), this.sortArray.getValue(j-1)) >= 0){
                    //Then messsage this, disable the highlights and break
                    await this.pause('sort.smallerLeft', this.sortArray.getValue(j-1), this.sortArray.getValue(j));
                    this.sortArray.setIndexHighlight(j, false);
                    this.sortArray.setIndexHighlight(j-1, false);
                    break;
                }
                
                //If the current element is smaller then swap it with the left neighbour
                await this.swap(this.sortArray, j, j-1, 'sort.swap', this.sortArray.getValue(j), this.sortArray.getValue(j-1));
                

                this.sortArray.setIndexHighlight(j, false);
                this.sortArray.setIndexHighlight(j-1, false);
                j -= 1;
                
                
            }
            
        }
        


        
    }

    

};
