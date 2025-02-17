///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals DSVis */
///////////////////////////////////////////////////////////////////////////////

DSVis.LinkedListAnim = class LinkedListAnim extends DSVis.Engine {
    // Limit the size of the list to maintain readability
    // maxListSize = 10;
    
    // Only used for hard-coded values
    initialValues;

    initialise(initialValues = null) {
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