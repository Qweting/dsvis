import {
    Text, G, Marker, Svg, Polyline, Path,
} from "@svgdotjs/svg.js";
import { LinkedNode } from "./linked-node";

export class Connection extends Polyline{
    private arrowMarker: Marker;
    // arrowMarker: Marker;
    constructor(startNode: {x:number, y:number}, endNode: {x:number, y:number} ) {
        super();

        this.arrowMarker = this.marker('start', 10, 10, (add) => {
            add.path("M0,0 L10,5 L0,10 Z");
        }).ref(1, 5);

        // Draw the arrow as a polyline from the start center to the end center
        this.plot([startNode.x, startNode.y, endNode.x, endNode.y])
            .stroke({ width: 2, color: '#000' })
            .marker('end', this.arrowMarker);
}
}