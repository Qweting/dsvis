import {
    Text, G, Marker, Svg, Rect, Line
} from "@svgdotjs/svg.js";
import { LinkedNode } from "./linked-node";

export class Connection extends Line {
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;

    private arrowMarker: Marker;

    constructor(startNodeCoords: {x: number; y: number;}, endNodeCoords: {x: number; y: number;}, svgContext: Svg) {
        super();
        this.x1 = startNodeCoords.x;
        this.y1 = startNodeCoords.y;
        this.x2 = endNodeCoords.x;
        this.y2 = endNodeCoords.y;

        this.arrowMarker = svgContext.marker(5, 4, function (add) {
            add.polygon([0, 0, 5, 2, 0, 4]).addClass("filled");
        });

        this.update();
    }

    update(): void {
        this.plot(this.x1, this.y1, this.x2, this.y2).stroke({ width: 2, color: '#000' }).marker('end', this.arrowMarker);
    }
}