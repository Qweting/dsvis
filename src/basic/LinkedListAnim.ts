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
        head: (element: string | number) =>
            `List is empty, insert ${element} as head`,
    },
    delete: {
        search: (value: string) => `Searching for node to delete ${value}`,
        notexists: (value: string) => `There is no node ${value}`,
        found: (value: string) => `Found node ${value} to delete`,
        adjust: "Adjusting link",
    },
};

export class LinkedListAnim extends Engine {
    initialValues: string[] | null = null; // Only used for hard-coded values
    maxListSize: number = 12; // Limit the size of the list to maintain readability
    linkedList: LinkedList<string | number> = new LinkedList(); // Linked list instance
    nodeArray: [LinkedNode, Connection | null][] = []; // Array to store the nodes and connections

    initialise(initialValues: string[] | null = null): void {
        //this.initialValues = ["T", "E", "S", "T", "T", "T", "T", "T", "T"];
        this.initialValues = initialValues;
        super.initialise(); // super also calls resetAlgorithm
    }

    // Reset the algorithm to its initial state
    // !! Engine then re builds by calling all recorded actions
    async resetAlgorithm(): Promise<void> {
        await super.resetAlgorithm();

        // Reset the linked list by creating a new instance
        this.linkedList = new LinkedList();
        this.nodeArray = [];

        // If initial values are provided, insert them into the animated list
        if (this.initialValues) {
            this.state.resetting = true;
            await this.insert(...this.initialValues);
            this.state.resetting = false;
        }
    }

    // Insert initial values into the linked list
    async insert(...values: (string | number)[]): Promise<void> {
        for (const val of values) {
            if (this.linkedList.size === this.maxListSize) {
                await this.pause("general.full");
            } else {
                await this.insertBack(val);
            }
        }
    }

    // Visualization logic for inserting a node to the back
    async insertBack(value: string | number): Promise<void> {
        this.linkedList.insertBack(value);
        if (this.linkedList.size === 1) {
            await this.pause("insert.head", value);
        } else {
            await this.pause("insert.element", value);
        }
        const node = new LinkedNode(value, this.getObjectSize());
        this.Svg.add(node);

        // TODO: Starting pos can be ugly find a pos that's always empty
        // Suggestion: upper left corner close to edge, final nodes pos within good margin
        const coords = this.newNodeCoords();
        //node.move(this.$Svg.width / 2, this.$Svg.height / 2); // Starting position
        node.move(coords[0], coords[1]);
        this.highlight(node, true);
        //node.animate(1000).move(coords[0], coords[1]); // animate should probably not be called here since it doesen't adhere to animation speed
        // Add the node to the array and make connections
        this.nodeArray.push([node, await this.makeConnections(node)]);
        this.highlight(node, false);
    }

    // Visualization logic for inserting a node to the front
    async insertFront(value: string | number): Promise<void> {
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

    async makeConnections(node: LinkedNode): Promise<Connection | null> {
        // If there is only one node in the list, then do nothing
        if (this.linkedList.size === 1) {
            return null;
        }
    
        // insertBack
        const prevNode = this.nodeArray[this.nodeArray.length - 1][0];
        const connection = new Connection(prevNode.getRight(), node.getLeft(), this.Svg);
        // insertFront
        // insertAt
        this.Svg.add(connection);
        return connection;
    }

    // Calculates the next position for a node in a zigzag layout pattern
    // Returns the [x, y] coordinates for the next node
    private newNodeCoords(): [number, number] {
        const margin = 100;
        const topMargin = 80; // To not overlap with messages
        const nodeSize = this.getObjectSize() * 2;
        const spacing = this.getNodeSpacing() * 3;
        const totalNodeWidth = nodeSize + spacing;
        
        // Calculate how many nodes can fit in a row
        const availableWidth = this.$Svg.width - (2 * margin);
        const nodesPerRow = Math.max(1, Math.floor(availableWidth / totalNodeWidth));
        
        // Calculate the current row and position within that row
        const nodeIndex = this.nodeArray.length;
        const row = Math.floor(nodeIndex / nodesPerRow);
        const posInRow = nodeIndex % nodesPerRow;
        
        // Check if we've exceeded the bottom margin
        const availableHeight = this.$Svg.height - (topMargin + margin); // Account for different top margin
        const maxRows = Math.floor(availableHeight / (nodeSize + spacing));
        
        if (row >= maxRows) {
            console.warn('Exceeded maximum rows for nodes');
            // Return weird position to indicate problem
            return [this.$Svg.width - totalNodeWidth, this.$Svg.height - nodeSize];
        }
        
        let x: number;
        const y = topMargin + row * (nodeSize + spacing); // Use topMargin for vertical positioning
        
        // Determine direction for current row (even rows: left to right, odd rows: right to left)
        if (row % 2 === 0) {
            // Left to right
            x = margin + posInRow * totalNodeWidth;
        } else {
            // Right to left
            //x = this.$Svg.width - margin - totalNodeWidth * (posInRow + 1) + spacing;
            x = this.$Svg.width - margin - totalNodeWidth * posInRow - spacing;
        }
        
        return [x, y];
    }

    private highlight(node: LinkedNode, value: boolean): void {
        node.children().forEach(child => child.setHighlight(value)); // Highlight the node
    }
}
