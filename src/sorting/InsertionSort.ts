import { compare, Engine, MessagesObject } from "../../src/engine";
import { DSArray } from "../../src/objects/dsarray";
import { TextCircle } from "../../src/objects/text-circle";

export class InsertionSort extends Engine {

    arraySize : number = 28;
    initialValues: null | Array<number | string> = [];
    sortArray: DSArray | null = null;
    sortSize: number | null = null;
    


    initialise(initialValues = null) {
        this.initialValues = initialValues;
        super.initialise();
    }

    async drawViewbox(right: number, down: number, zoom: number) {
        this.Svg.viewbox(right, down, this.$Svg.width*zoom, this.$Svg.height*zoom);
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        const [xRoot, yRoot] = this.getTreeRoot();
        this.sortArray = this.Svg.put(
            new DSArray(this.arraySize, this.getObjectSize(), true)
        ).init(this.arraySize, xRoot, yRoot+this.$Svg.margin*4);
        if (Number(this.sortArray.x()) < this.$Svg.margin){
            this.sortArray.x(this.$Svg.margin);
        }
        this.sortSize = 0;
        if (this.initialValues) {
            this.state.resetting = true;
            await this.insert(...this.initialValues);
            this.state.resetting = false;
        }
    }

    async insert(...values : Array<number | string>) {
        for (const val of values) {await this.insertOne(val);}
    }

    async swap(j : number, k : number, message : string, ...args : Array<number | string>) {
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }
        this.sortArray.swap(j, k, true);
        this.sortArray.setIndexHighlight(j, true);
        await this.pause(message, ...args);
    }

    async insertOne(value : number | string) {
        value = String(value);
        if (this.sortArray === null) {
            throw new Error("Sort array not initialised");
        }

        if (this.sortSize === null) {
            throw new Error("Sort size not initialised");
        }

        if (this.sortSize >= this.arraySize) {
            await this.pause('general.full');
            return;
        }

        const currentIndex = this.sortSize;
        const arrayLabel = this.Svg.put(
                new TextCircle(value, this.getObjectSize(), this.getStrokeWidth())
            ).init(...this.getNodeStart());
        const sortArray = []
        await this.pause('insert.value', value);

        arrayLabel.setCenter(this.sortArray.getCX(currentIndex), this.sortArray.cy(), this.getAnimationSpeed());
        sortArray.push(value);
        await this.pause(undefined);

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

        for (let i=1; i < this.sortSize; i++) {
            let j = i;
            
            
            while (j > 0) {
    

                this.sortArray.setIndexHighlight(j, true);
                this.sortArray.setIndexHighlight(j-1, true);
                await this.pause('sort.compare', this.sortArray.getValue(j), this.sortArray.getValue(j-1));
                

                if (DSVis.compare( this.sortArray.getValue(j), this.sortArray.getValue(j-1)) >= 0){
                    await this.pause('sort.smallerLeft', this.sortArray.getValue(j-1), this.sortArray.getValue(j));
                    this.sortArray.setIndexHighlight(j, false);
                    this.sortArray.setIndexHighlight(j-1, false);
                    break;
                }
                
                await this.swap(j, j-1, 'sort.swap', this.sortArray.getValue(j), this.sortArray.getValue(j-1));
                

                this.sortArray.setIndexHighlight(j, false);
                this.sortArray.setIndexHighlight(j-1, false);
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
        value: (value: string | number) => `Insert value: ${value}`,
    },
    sort: {
        compare: (a: string | number, b: string | number) => `Compare ${a} and ${b}`,
        swap: (a: string | number, b: string | number) => `Swap ${a} and ${b} since ${a} is smaller`,
        smallerLeft:(a: string | number, b: string | number) => `${a} is smaller than ${b} no swap`,
        record: (a: string | number) => `The record is set to ${a}` 
    },
};
