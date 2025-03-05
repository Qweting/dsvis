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

    constructor(startNode: LinkedNode, endNode: LinkedNode) {
        super();
        this.x1 = startNode.getRightEnd().x;
        this.y1 = startNode.getRightEnd().y;
        this.x2 = endNode.getLeftEnd().x;
        this.y2 = endNode.getLeftEnd().y;

        this.arrowMarker = new Svg().marker(10, 10, function(add) {
            add.circle(10).fill('#f06')
          })

        /* this.marker("end", 20, 20, function (add) {
            add.polygon([0, 0, 5, 2, 0, 4]).addClass("filled");
        }); */

        this.update();
    }

    update(): void {
        this.plot(this.x1, this.y1, this.x2, this.y2).stroke({ width: 2, color: '#000' }); // .marker('end', this.arrowMarker)
    }
}