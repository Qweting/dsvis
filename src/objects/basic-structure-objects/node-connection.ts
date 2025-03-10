import {
    Marker, Svg, Line
} from "@svgdotjs/svg.js";
import { Connection } from "../connection";
import { LinkedNode } from "./linked-node";

export class LinkedConnection extends Connection<LinkedNode> {

    constructor(start: LinkedNode, end: LinkedNode, nodeDimensions: [number, number], strokeWidth: number) {
        super(start, end);
        const endCoords = this.getEndCoords(end.getCenterPos(), nodeDimensions);
        this.$coords = {
            x1: start.getPointerPos()[0],
            y1: start.getPointerPos()[1],
            x2: endCoords[0],
            y2: endCoords[1],
            //r2: end.getSize() / 2,
            r2: 0,
        };
        this.init(strokeWidth, 0, false); // TODO directed should be = true
    }

    init(
        strokeWidth: number,
        bend: number = 0,
        directed: boolean = false
    ): this {
        this.stroke({ width: strokeWidth });
        this.setBend(bend);
        if (directed) {
            this._createArrow();
        }
        this.update(this.$coords);
        return this;
    }

    // Calculates the positon where the end connection should be
    getEndCoords(endNodeCoords: [number, number], nodeDimensions: [number, number]): [number, number] {
        const [endNodeX, endNodeY] = endNodeCoords;
        const [nodeWidth, nodeHeight] = nodeDimensions;
        
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
            intersectionY = this.$coords.y1;
        } else {
            // Intersect with top or bottom edge
            intersectionX = this.$coords.x1;
            intersectionY = endNodeY + Math.sign(dy) * halfHeight;
        }
        
        return [intersectionX, intersectionY];
    }
}