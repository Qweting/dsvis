import {
    Text, G, Marker, Svg
} from "@svgdotjs/svg.js";

export class Lists {
    private value: string | number;
    private rectWidth: number;
    private rectHeight: number;

    constructor(value: string | number, rectWidth: number, rectHeight: number) {
        this.value = value;
        this.rectWidth = rectWidth;
        this.rectHeight = rectHeight;
    }

}