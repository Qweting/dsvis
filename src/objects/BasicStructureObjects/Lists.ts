import {
    Text,
    G,
    Marker,
    Svg
} from "@svgdotjs/svg.js";

export class Lists {
    private svg: Svg;
    private group: G;
    private value: string | number;
    private rectWidth: number;
    private rectHeight: number;
    private relativeX: number; // Relative x position of the list to the group
    private relativeY: number; // Relative y position of the list to the group


    constructor(svg: Svg, value: string | number, rectWidth: number, rectHeight: number) {
        this.svg = svg;
        this.value = value;
        this.rectWidth = rectWidth;
        this.rectHeight = rectHeight;
        this.group = this.svg.group();
    }

}