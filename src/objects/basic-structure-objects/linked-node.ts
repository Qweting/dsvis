import {
    Text, G, Marker, Svg, Rect
} from "@svgdotjs/svg.js";

export class LinkedNode extends G{
    private value: string | number;
    private rectWidth: number;
    private rectHeight: number;

    private elementRect: Rect;
    private nextRect: Rect;
    private textElement: Text;

    constructor(value: string | number, objectSize: number) {
        super();
        this.value = value;
        this.rectWidth = 2*objectSize;
        this.rectHeight = objectSize;

        this.elementRect = this.rect(this.rectWidth, this.rectHeight);
        this.nextRect = this.rect(this.rectWidth / 2, this.rectHeight).move(this.rectWidth + 1, 0);
        this.textElement = this.text(String(value))
            .font({ size: this.rectHeight * 0.6 })
            .center(this.elementRect.cx(), this.elementRect.cy());
    }

}