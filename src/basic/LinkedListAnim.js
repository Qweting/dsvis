///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
///////////////////////////////////////////////////////////////////////////////

import LinkedList from "./LinkedList.js"


DSVis.LinkedListAnim = class LinkedListAnim extends DSVis.Engine {
    arraySize = 24;
    nodeArray = []
    intialValues;



    initialise(intialValues = null) { //initialValue is not used.
        this.intialValues = intialValues;
        this.head = null;
        this.size = 0;
        this.LinkedList = new LinkedList();
        super.initialise();
    }
    




    async resetAlgorithm() {
        await super.resetAlgorithm();

        // Reset the linked list by creating a new instance
        this.LinkedList = new LinkedList();
        this.size = 0;

        // If initial values are provided, insert them into the animated list
        if (this.initialValues) {
            this.insert.resetting = true;
            await this.insert(...this.initialValues);
            this.insert.resetting = false;
        }
    }





    //Resets the heap to its original state. 
    async insert(...values) {
        for(const val of values) await this.insertOne(val);
    }
    
    async objectNode(value) {
        const rectWidth = 100; //width of rectangle
        const rectHeight = 50; //height of rectangle
        const x = 250, y = 250;
        const margin = 50;
        
        const nextX = rectWidth/2+1;
        const nextY = rectHeight;
        
        
        const grp = this.SVG.group();//container holding the rectangle and text
        
        
        // const elementRect = this.SVG.rect(rectWidth, rectHeight).cx(x).cy(y); //create the rectangle and "center it" (we need to find a better way of doing this)
        // const nextRect = this.SVG.rect(rectWidth/2, rectHeight).cx(x+75).cy(y); //create the rectangle and "center it" (we need to find a better way of doing this)
        const elementRect = grp.rect(rectWidth, rectHeight); //create the rectangle and "center it" (we need to find a better way of doing this)
        const nextRect = grp.rect(rectWidth/2, rectHeight).move(rectWidth+1,0); //create the rectangle and "center it" (we need to find a better way of doing this)
        
        
        
        const textElement = this.SVG.text(value)
            .font({ size: rectHeight * 0.6 })  //set font size relative to rectangle height
            .center(elementRect.cx(), elementRect.cy());      //center text in the rectangle
        
        
        grp.add(elementRect); //add it to the group container
        grp.add(nextRect);
        grp.add(textElement);
        
        grp.move(this.$Svg.width/4, this.$Svg.height/2); //moves the group container

        
        // Calculate arrow start and end points
        const startX = grp.x() + rectWidth + nextX-(nextX/2);  // End of nextRect
        const startY = grp.y() + rectHeight / 2;
        const endX = startX + 50;  // Arrow length
        const endY = startY;

        // Create an arrow marker for the line's end
        const arrowMarker = this.SVG.marker(10, 10, function(add) {
            add.path('M0,0 L10,5 L0,10 Z');
        }).ref(1, 5);

        // Create the arrow line
        const arrowLine = this.SVG.line(startX, startY, endX, endY)
            .stroke({ width: 2, color: '#000' })
            .marker('end', arrowMarker);
        
        grp.add(arrowLine);
        grp.add(arrowMarker);

        // Add the arrow to the SVG
        this.SVG.add(grp); //add the container to the svg

        /* for (let i = 0; i < grp.size; i++) {
            grp.index(grp.get(i)).setHighlight(true);
            console.log(grp.index(grp.get(i)));
        } */
        
        const elementRectIndex = grp.index(elementRect);
        const nextRectIndex = grp.index(nextRect);
        const textElementIndex = grp.index(textElement);
        const arrowLineIndex = grp.index(arrowLine);
        const arrowMarkerIndex = grp.index(arrowMarker);


        //console.log(index);
        grp.get(elementRectIndex).setHighlight(true);
        grp.get(nextRectIndex).setHighlight(true);
        grp.get(textElementIndex).setHighlight(true);
        grp.get(arrowLineIndex).setHighlight(true);
        grp.get(arrowMarkerIndex).setHighlight(true);


        // Animate movement of the group and arrow
        await this.pause('insert.head', value);
        grp.animate(1000).move(100, 100);

        // await this.pause('insert.head', value);
        // grp.animate(1000).move(100, 100); //animate and move the group container
    }


    //Previous method calls on this method
    async insertOne(value){
        if((this.LinkedList.size) === this.arraySize) {
            await this.pause('general.full');
        }


        if (this.LinkedList.size === 0) {
            this.LinkedList.add(value);
            this.objectNode(value);
        } else {
            this.LinkedList.add(value);
            this.objectNode(value);
        }

    }



}


DSVis.LinkedListAnim.messages = {
    general: {
        empty: "List is empty!",
        full: "List is full!",
        finished: "Finished",
    },
    find: {
        start: (element) => `Searching for ${element}`,
        found: (element) => `Found ${element}`,
        notfound: (element) => `Did not find ${element}`,
        look: (NextNode) => `Look into ${NextNode}`,
    },
    insert: {
        element: (element) => `Insert element: ${element}`,
        head: (element) => `List is empty, insert ${element} as head`,
    },
    delete: {

    },
}