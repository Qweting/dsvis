import {
    Text, G, Marker, Svg, Rect, Path
} from "@svgdotjs/svg.js";
import { LinkedNode } from "./linked-node";

export class Connection extends Path{
    arrowMarker: Marker;
    constructor(startNode: LinkedNode, endNode: LinkedNode) {
        super();

        //const startX = Number(grp.x()) + rectWidth + (rectWidth / 4);
        //const startY = Number(grp.y()) + rectHeight / 2;        const endX = startX + 50;
        //const endY = startY;

        /* const arrowMarker: Marker = this.Svg.marker(10, 10, (add) => {
            add.path('M0,0 L10,5 L0,10 Z');
        }).ref(1, 5);

        const arrowLine = this.Svg.line(startX, startY, endX, endY)
            .stroke({ width: 2, color: '#000' })
            .marker('end', arrowMarker);

        grp.add(arrowLine);
        grp.add(arrowMarker); */

        const startNodeCords = startNode.getRightEnd();
        const endNodeCords = startNode.getLeftEnd();

        this.arrowMarker= this.marker(10, 10, (add) => {
            add.path('M0,0 L10,5 L0,10 Z');
        }).ref(1, 5);
    }
}