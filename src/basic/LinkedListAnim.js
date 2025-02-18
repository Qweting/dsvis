///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
///////////////////////////////////////////////////////////////////////////////

import LinkedList from "./LinkedList"

DSVis.LinkedListAnim = class LinkedListAnim extends DSVis.Engine {
    // Limit the size of the list to maintain readability
    maxListSize = 10;
    //
    linkedList;
    // Only used for hard-coded values
    initialValues;

    initialise(initialValues = null) {
        this.linkedList = new LinkedList();
        this.initialValues = initialValues;
        super.initialise();
    }

    async resetAlgorithm() {
        await super.resetAlgorithm();
        
        if (this.initialValues) {
            this.State.resetting = true;
            await this.insert(...this.initialValues);
            this.State.resetting = false;
        }
    }

    async insert(...values) {
        for (const val of values) await this.insertOne(val);
        this.linkedList.printList();
    }

    async insertOne(value) {
        if (this.linkedList.size >= this.maxListSize) {
            await this.pause('general.full');
            return;
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
    },
    delete: {
    },
}