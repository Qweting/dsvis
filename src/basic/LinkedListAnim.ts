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
    maxListSize: number = 100; // Limit the size of the list to maintain readability
    linkedList: LinkedList<string | number> = new LinkedList(); // Linked list instance
    nodeArray: [LinkedNode, Connection | null][] = []; // Array to store the nodes and connections
    nodeDimensions: [number, number] = [this.getObjectSize() * 2, this.getObjectSize()]; // Dimensions for the nodes

    initialise(initialValues: string[] | null = null): void {
        /* this.initialValues = ["T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T",
                              "T", "E", "S", "T"]; */
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
        this.nodeDimensions= [this.getObjectSize() * 2, this.getObjectSize()];

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
        const node = new LinkedNode(value, this.nodeDimensions);
        this.Svg.add(node);

        // TODO: Starting pos can be ugly find a pos that's always empty
        // Suggestion: upper left corner close to edge, final nodes pos within good margin
        const coords = this.newNodeCoords();
        //node.move(this.$Svg.width / 2, this.$Svg.height / 2); // Starting position
        if (coords[2]) {node.mirror();}
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
        const connection = new Connection(prevNode.getPointerPos(), node.getCenterPos(), this.nodeDimensions, this.Svg);
        // insertFront
        // insertAt
        this.Svg.add(connection);
        return connection;
    }

    // Calculates the next position for a node in a zigzag layout pattern and if it should be mirrored
    // if the node is going on an odd row, it should be mirrored
    private newNodeCoords(): [number, number, boolean] {
        const TOP_MARGIN = 120;
        const MIN_SIDE_MARGIN = 20; // Minimum side margin
        const [nodeWidth, nodeHeight] = this.nodeDimensions;
        const nodeSpacing = this.getNodeSpacing();
        let mirrored = false;
        
        // Get container dimensions
        const containerWidth = this.$Svg.width;  
        const containerHeight = this.$Svg.height;
        
        // Calculate how many nodes can fit in a row with minimum margins
        const maxNodesPerRow = Math.max(1, Math.floor((containerWidth - 2 * MIN_SIDE_MARGIN) / (nodeWidth + nodeSpacing)));
        
        // Calculate the total width needed for all nodes in a row
        const totalNodesWidth = maxNodesPerRow * nodeWidth + (maxNodesPerRow - 1) * nodeSpacing;
        
        // Calculate the actual side margin to ensure symmetric alignment
        const sideMargin = (containerWidth - totalNodesWidth) / 2;
        
        // Calculate the current row and position within that row
        const currentIndex = this.nodeArray.length;
        const row = Math.floor(currentIndex / maxNodesPerRow);
        const positionInRow = currentIndex % maxNodesPerRow;
        
        // Calculate y position
        const y = TOP_MARGIN + row * (nodeHeight + nodeSpacing);
        
        // Calculate x position based on zigzag pattern
        let x: number;
        if (row % 2 === 0) {
            // Even rows go left to right
            x = sideMargin + positionInRow * (nodeWidth + nodeSpacing);
        } else {
            // Odd rows go right to left
            // Calculate position from the right side, ensuring vertical alignment with even rows
            x = sideMargin + (maxNodesPerRow - 1 - positionInRow) * (nodeWidth + nodeSpacing);
            mirrored = true;
        }
        
        // Check if we've exceeded the bottom margin
        if (y + nodeHeight > containerHeight - MIN_SIDE_MARGIN) {
            throw new Error("Cannot add more nodes: Exceeded bottom margin of canvas");
        }
        
        return [x, y, mirrored];
    }

    private highlight(node: LinkedNode, value: boolean): void {
        node.children().forEach(child => child.setHighlight(value)); // Highlight the node
    }
}
