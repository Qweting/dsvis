import { Text, G, Marker } from "@svgdotjs/svg.js";
import {
    compare,
    Engine,
    EngineToolbarItems,
    MessagesObject,
    parseValues,
} from "../engine";

import LinkedList from "./LinkedList";

interface NodeArray {
    value: string | number;
    node: G;
}

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
    nodeArray: NodeArray[] = [];

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
        const rectWidth = 100; // Width of rectangle
        const rectHeight = 50; // Height of rectangle

        // const grp: G = this.SVG.group(); // Container holding the rectangle and text
        const grp: G = this.Svg.group();

        const elementRect = grp.rect(rectWidth, rectHeight);
        const nextRect = grp.rect(rectWidth / 2, rectHeight).move(rectWidth + 1, 0);
        const textElement: Text = this.Svg.text(String(value))
            .font({ size: rectHeight * 0.6 })
            .center(elementRect.cx(), elementRect.cy());

        grp.add(elementRect);
        grp.add(nextRect);
        grp.add(textElement);
        grp.move(this.$Svg.width / 4, this.$Svg.height / 2);

        const startX = Number(grp.x()) + rectWidth + (rectWidth / 4);
        const startY = Number(grp.y()) + rectHeight / 2;        const endX = startX + 50;
        const endY = startY;

        const arrowMarker: Marker = this.Svg.marker(10, 10, (add) => {
            add.path('M0,0 L10,5 L0,10 Z');
        }).ref(1, 5);

        const arrowLine = this.Svg.line(startX, startY, endX, endY)
            .stroke({ width: 2, color: '#000' })
            .marker('end', arrowMarker);

        grp.add(arrowLine);
        grp.add(arrowMarker);

        this.Svg.add(grp);

        grp.children().forEach(child => child.setHighlight(true));

        await this.pause('insert.head', value);
        grp.animate(1000).move(100, 100);
    }

    async insertOne(value: string | number): Promise<void> {
        if (this.linkedList.size === this.maxListSize) {
            await this.pause('general.full');
        }

        this.linkedList.insertBack(value);
        await this.newNode(value);
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
