import {
    Marker, Svg, Line
} from "@svgdotjs/svg.js";

export class Connection extends Line {
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;

    private arrowWidth: number;
    private arrowHeight: number;
    private arrowMarker: Marker;

    private strokeWidth: number;

    constructor(startNodeCoords: [number, number], endNodeCoords: [number, number], nodeDimensions: [number, number], svgContext: Svg) {
        super();
        this.x1 = startNodeCoords[0];
        this.y1 = startNodeCoords[1];
        const endCoords = this.getEndCoords(endNodeCoords, nodeDimensions);
        this.x2 = endCoords[0];
        this.y2 = endCoords[1];


        this.arrowWidth = Math.max(nodeDimensions[1] / 4, 5);
        this.arrowHeight = Math.max(nodeDimensions[1] / 10, 3);

        this.arrowMarker = svgContext.marker(this.arrowWidth, this.arrowHeight, (add) => {
            add.polygon([0, 0, this.arrowWidth / 2, this.arrowHeight / 2, 0, this.arrowHeight]).addClass("filled");
        });

        this.strokeWidth = nodeDimensions[1] <= 12 ? 1 : 2;

        this.update();
    }

    update(): void {
        this.plot(this.x1, this.y1, this.x2, this.y2).stroke({ width: this.strokeWidth, color: '#000' }).marker('end', this.arrowMarker);
    }

    // Calculates the positon where the end connection should be
    getEndCoords(endNodeCoords: [number, number], nodeDimensions: [number, number]): [number, number] {
        const [endNodeX, endNodeY] = endNodeCoords;
        const [nodeWidth, nodeHeight] = nodeDimensions;
        
        // Calculate the half dimensions
        const halfWidth = nodeWidth / 2;
        const halfHeight = nodeHeight / 2;
        
        // Calculate the direction vector from end node to start point
        const dx = this.x1 - endNodeX;
        const dy = this.y1 - endNodeY;
        
        let intersectionX, intersectionY;
        
        // Check which edge will be intersected
        if (Math.abs(dx) > Math.abs(dy)) {
            // Intersect with left or right edge
            intersectionX = endNodeX + Math.sign(dx) * halfWidth;
            intersectionY = this.y1;
        } else {
            // Intersect with top or bottom edge
            intersectionX = this.x1;
            intersectionY = endNodeY + Math.sign(dy) * halfHeight;
        }
        
        return [intersectionX, intersectionY];
    }
}