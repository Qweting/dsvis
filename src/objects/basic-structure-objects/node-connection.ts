import { Svg } from "@svgdotjs/svg.js";
import { Connection } from "../connection";
import { LinkedNode } from "./linked-node";

export class LinkedConnection extends Connection<LinkedNode> {
    private nodeDimensions: [number, number];

    constructor(start: LinkedNode, end: LinkedNode, nodeDimensions: [number, number], strokeWidth: number, svgContext: Svg) {
        super(start, end);
        this.nodeDimensions = nodeDimensions;
        this.setCoords(this.getEndCoords(end.getCenterPos(), false));
        svgContext.put(this);
        this.init(strokeWidth,0,  true);
        this.front();
    }

    setEnd(end: LinkedNode, animationDuration: number = 0): this {
        this.$end = end;
        const coords: [number, number] = [end.getCenterPos()[0] - this.nodeDimensions[0]/2, 
                                        end.getCenterPos()[1] - this.nodeDimensions[1]/2];
        this.updateEnd(coords, animationDuration);
        return this;
    }

    updateStart(startNodeCoords: [number, number], animationDuration: number): void {
        const newCoords = {
            x1: startNodeCoords[0],
            y1: startNodeCoords[1],
        };
        super.update(newCoords, animationDuration);
    }

    updateEnd(endNodeCoords: [number, number], animationDuration: number): void
    {
        const endCoords = this.getEndCoords([endNodeCoords[0] + this.nodeDimensions[0] / 2, endNodeCoords[1] + this.nodeDimensions[1] / 2]);
        const newCoords = {
            x2: endCoords[0],
            y2: endCoords[1],
        };
        super.update(newCoords, animationDuration);
    }

    updateAll(startNodeCoords: [number, number], endNodeCoords: [number, number], animationDuration: number): void {
        this.updateStart(startNodeCoords, animationDuration);
        this.updateEnd(endNodeCoords, animationDuration);
    }

    private setCoords(endCoords: [number, number]): void {
        this.$coords = {
            x1: this.$start.getPointerPos()[0],
            y1: this.$start.getPointerPos()[1],
            x2: endCoords[0],
            y2: endCoords[1],
            r2: -2, // offset to make sure the arrow just exactly touches the node
        };
    }

    // Calculates the positon where the end connection should be, need center pos
    private getEndCoords(endNodeCoords: [number, number], straight = true): [number, number] {
        const [endNodeX, endNodeY] = endNodeCoords;
        const [nodeWidth, nodeHeight] = this.nodeDimensions;
        
        // Calculate the half dimensions
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;
        
        // Calculate the direction vector from end node to start point
        const dx = this.$coords.x1 - endNodeX;
        const dy = this.$coords.y1 - endNodeY;
        
        let intersectionX, intersectionY;
        
        // Check which edge will be intersected
        if (Math.abs(dx) > Math.abs(dy)) {
            // Intersect with left or right edge
            intersectionX = endNodeX + Math.sign(dx) * halfWidth;
            intersectionY = straight ? this.$start.getPointerPos()[1] : endNodeY;
        } else {
            // Intersect with top or bottom edge
            //intersectionX = straight ? this.$start.getPointerPos()[0] : endNodeX;
            intersectionX = straight ? this.$coords.x1 : endNodeX;
            intersectionY = endNodeY + Math.sign(dy) * halfHeight;
        }
        
        return [intersectionX, intersectionY];
    }
}