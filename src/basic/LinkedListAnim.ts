import { Text, G, Marker } from "@svgdotjs/svg.js";
import {
    compare,
    Engine,
    EngineToolbarItems,
    MessagesObject,
    parseValues,
} from "../engine";

import LinkedList from "./LinkedList";
import { LinkedNode } from "../../src/objects/basic-structure-objects/linked-node";
import { Connection } from "../../src/objects/basic-structure-objects/node-connection";

export const LinkedListMessages = {
    general: {
        empty: "List is empty!",
        full: "List is full!",
        finished: "Finished",
    },
    find: {
        start: (element: string | number) => `Searching for ${element}`,
        found: (element: string | number) => `Found ${element}`,
        notfound: (element: string | number) => `Did not find ${element}`,
        look: (NextNode: string | number) => `Look into ${NextNode}`,
    },
    insert: {
        element: (element: string | number) => `Insert element: ${element}`,
        head: (element: string | number) => `List is empty, insert ${element} as head`,
    },
    delete: {
        search: (value: string) => `Searching for node to delete ${value}`,
        notexists: (value: string) => `There is no node ${value}`,
        found: (value: string) => `Found node ${value} to delete`,
        adjust: "Adjusting link",
    },
};

export class LinkedListAnim extends Engine {
    maxListSize: number = 10; // Limit the size of the list to maintain readability
    initialValues: string[] | null = null; // Only used for hard-coded values
    linkedList: LinkedList<string | number> = new LinkedList(); // Linked list instance
    nodeArray: LinkedNode[] = []; // Array to store the nodes

    initialise(initialValues: string[] | null = null): void {
        this.initialValues = initialValues;
        this.linkedList = new LinkedList();
        super.initialise();
    }

    // Reset the algorithm to its initial state
    async resetAlgorithm(): Promise<void> {
        await super.resetAlgorithm();

        // Reset the linked list by creating a new instance
        this.linkedList = new LinkedList();

        // If initial values are provided, insert them into the animated list
        if (this.initialValues) {
            this.state.resetting = true;
            await this.insert(...this.initialValues);
            this.state.resetting = false;
        }
    }

    async insert(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            await this.insertOne(val);
        }
    }

    async newNode(value: string | number): Promise<void> {

        const grp = new LinkedNode(value, this.getObjectSize())
        grp.move(this.$Svg.width / 2, this.$Svg.height / 2);
        this.Svg.add(grp);
        //grp.children().forEach(child => child.setHighlight(true));
        await this.pause('insert.head', value);
        grp.animate(1000).move(100, 100);

        // rest is code for testing

        const grp2 = new LinkedNode(value, this.getObjectSize())
        grp2.move(this.$Svg.width / 2, this.$Svg.height / 2);
        this.Svg.add(grp2);
        await this.pause('insert.head', value);
        grp2.animate(1000).move(400, 100);

        await new Promise(f => setTimeout(f, 1000));

        const connection = new Connection(grp.getRight(), grp2.getLeft(), this.Svg);
        this.Svg.add(connection);
    }

    async insertOne(value: string | number): Promise<void> {
        if (this.linkedList.size === this.maxListSize) {
            await this.pause('general.full');
        }

        this.linkedList.insertBack(value);
        await this.newNode(value);
        await this.makeConnection();
    }

    async makeConnection(): Promise<void> {
        // If there are more than one node in the list, make the connection
        if (this.linkedList.size > 1) {
            // Get the last two nodes and make the connection
        }
    }

    // Visualization logic for inserting a node to the front
    async insertFront(value: string | number): Promise<void> {
        // Implementation goes here
    }

    // Visualization logic for inserting a node to the back
    async insertBack(value: string | number): Promise<void> {
        // Implementation goes here
    }

    // Visualization logic for inserting a node to a specific index
    async insertAt(value: string | number, index: number): Promise<void> {
        // Implementation goes here
    }

    // Visualization logic for deleting a node
    async deleteAnimate(value: string | number): Promise<void> {
        // Implementation goes here
    }

    // Visualization logic for finding a node
    async findAnimate(value: string | number): Promise<void> {
        // Implementation goes here
    }
}
