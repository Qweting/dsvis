///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
///////////////////////////////////////////////////////////////////////////////

<<<<<<< HEAD
import LinkedList from "./LinkedList.js"


DSVis.LinkedListAnim = class LinkedListAnim extends DSVis.Engine {
    maxListSize = 10; // Limit the size of the list to maintain readability
    intialValues; // Only used for hard-coded values
    linkedList; // The linked list object
    nodeArray = [] 
=======
import linkedList from './LinkedList.js'



DSVis.LinkedListAnim = class LinkedListAnim extends DSVis.Engine {
    arraySize = 24;
    nodeArray = []
    intialValues;
>>>>>>> b565e21 (merging basic structure with typescript)



    initialise(intialValues = null) { //initialValue is not used.
        this.intialValues = intialValues;
<<<<<<< HEAD
        this.linkedList = new LinkedList();
        super.initialise();
    }
    
    // Reset the algorithm to its initial state
=======
        this.head = null;
        this.size = 0;
        this.linkedlist = new linkedList();
        super.initialise();
    }
    




>>>>>>> b565e21 (merging basic structure with typescript)
    async resetAlgorithm() {
        await super.resetAlgorithm();

        // Reset the linked list by creating a new instance
<<<<<<< HEAD
        this.linkedList = new LinkedList();
=======
        this.linkedlist = new linkedList();
>>>>>>> b565e21 (merging basic structure with typescript)
        this.size = 0;

        // If initial values are provided, insert them into the animated list
        if (this.initialValues) {
            this.insert.resetting = true;
            await this.insert(...this.initialValues);
            this.insert.resetting = false;
        }
    }

<<<<<<< HEAD
    async insert(...values) {
        for(const val of values) await this.insertOne(val);
    }
    
    async newNode(value) {
        const rectWidth = 100; //width of rectangle
        const rectHeight = 50; //height of rectangle
        const x = 250, y = 250;
        const margin = 50;
        
        const nextX = rectWidth/2+1;
        const nextY = rectHeight;
        
        
        const grp = this.SVG.group();//container holding the rectangle and text
        
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

        for (let i = 0; i < grp.children().length; i++) {
            grp.get(i).setHighlight(true);
        }


        // Animate movement of the group and arrow
        await this.pause('insert.head', value);
        grp.animate(1000).move(100, 100);
    }
=======




    //Resets the heap to its original state. 
    async insert(...values) {
        for(const val of values) await this.insertOne(val);
    }
>>>>>>> b565e21 (merging basic structure with typescript)


    //Previous method calls on this method
    async insertOne(value){
<<<<<<< HEAD
        if((this.linkedList.size) === this.arraySize) {
            await this.pause('general.full');
        }

        if (this.linkedList.size === 0) {
            this.linkedList.add(value);
            this.objectNode(value);
        } else {
            this.linkedList.add(value);
            this.objectNode(value);
=======
        if((this.linkedlist.size) === this.arraySize) {
            await this.pause('general.full');
        }


        if (this.linkedlist.size === 0) {
            this.linkedlist.add(value);

            const rectWidth = 100; //width of rectangle
            const rectHeight = 50; //height of rectangle
            const x = 250, y = 250;

            // Create the rectangle
            const rect = this.SVG.rect(rectWidth, rectHeight).cx(x).cy(y); //create the rectangle and "center it" (we need to find a better way of doing this)
            this.SVG.add(rect); //add it to SVG (as a child?)

            const divider= this.SVG.rect(rectWidth/2, rectHeight).cx(x+75).cy(y); //create the rectangle and "center it" (we need to find a better way of doing this)
            this.SVG.add(divider);

            //create the text, dynamically adjusting font size
            const text = this.SVG.text(value)
                .font({ size: rectHeight * 0.6 })  //set font size relative to rectangle height
                .center(rect.cx(), rect.cy());      //center text in the rectangle

            this.SVG.add(text); //add it again to svg
            // this.nextNode();

            await this.pause('insert.head', value);

            //move both to (100, 100)
            //this is the animation part of the code, the second call makes sure the text is always centered (is there a better approach?)
            rect.animate(1000).move(100, 100);
            divider.animate(1000).move(200, 100);
            text.animate(1000).center(100 + rectWidth / 2, 100 + rectHeight / 2);
            //ideally, we should group together the text and the rectangle (or a container for the node, like the arrow etc)
            //and then add that do the SVG.

        } else {
            // const arrayLabel = this.SVG.textCircle(value, ...this.getNodeStart()); //create a circle with the value

>>>>>>> b565e21 (merging basic structure with typescript)
        }

    }

<<<<<<< HEAD
     // Visualization logic for inserting a node to the front
     async insertFront(value) {
        
     }
 
     // Visualization logic for inserting a node to the back
     async insertBack(value) {
         
     }
 
     // Visualization logic for inserting a node to a specific index
     async insertAt(value, index) {
         
     }
 
     // Visualization logic for deleting a node
     async deleteAnimate(value) {
         
     }
     
     // Visualization logic for finding a node
     async findAnimate(value) {
 
     }
=======
>>>>>>> b565e21 (merging basic structure with typescript)


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