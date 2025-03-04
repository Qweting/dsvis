import {
    Text, G, Marker, Svg
} from "@svgdotjs/svg.js";

export class LinkedNode extends G{
    private value: string | number;
    private rectWidth: number;
    private rectHeight: number;

    constructor(value: string | number, objectSize: number) {
        super();
        this.value = value;
        this.rectWidth = 2*objectSize;
        this.rectHeight = objectSize;

        const elementRect = this.rect(this.rectWidth, this.rectHeight);
        const nextRect = this.rect(this.rectWidth / 2, this.rectHeight).move(this.rectWidth + 1, 0);
        const textElement: Text = this.text(String(value))
            .font({ size: this.rectHeight * 0.6 })
            .center(elementRect.cx(), elementRect.cy());

            this.add(elementRect);
            this.add(nextRect);
            this.add(textElement);
    }

}