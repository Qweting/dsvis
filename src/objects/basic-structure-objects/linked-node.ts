import { Text, G, Rect } from "@svgdotjs/svg.js";

export class LinkedNode extends G {
    value: string | number;
    private nodeWidth: number;
    private nodeHeight: number;

    private elementRect: Rect;
    private elementRectWidth: number;
    private textElement: Text;

    private nextNodeRect: Rect;
    private nextNodeRectWidth: number;

    constructor(value: string | number, nodeDimensions: [number, number], strokeWidth: number) {
        super();
        this.value = value;
        this.nodeWidth = nodeDimensions[0];
        this.nodeHeight = nodeDimensions[1];
        this.elementRectWidth = this.nodeWidth * (3 / 4);
        this.nextNodeRectWidth = this.nodeWidth * (1 / 4);

        this.elementRect = this.rect(this.elementRectWidth, this.nodeHeight).stroke({ width: strokeWidth }); //initializing the rectangle for current node
        this.nextNodeRect = this.rect(
            this.nextNodeRectWidth,
            this.nodeHeight
        ).stroke({ width: strokeWidth }).move(this.elementRectWidth, 0); //initializing the rectangle for next node

        this.textElement = this.text(String(value)) //initializing the text element for current node (value)
            .font({ size: this.nodeHeight * 0.6 })
            .center(this.elementRect.cx() + 15, this.elementRect.cy()); // + 15 to center the text in the rectangle
    }

    // mirrors the node so that elementRect and nextNodeRect are swapped
    mirror(): void {
        this.nextNodeRect.move(0, 0);
        this.elementRect.move(this.nextNodeRectWidth, 0);
        this.textElement.center(this.elementRect.cx(), this.elementRect.cy());
    }

    // Position where a connection should begin
    getPointerPos(): [number, number] {
        return [this.nextNodeRect.cx(), this.nextNodeRect.cy()];
    }

    getCenterPos(): [number, number] {
        const x = this.cx();
        const y = this.cy();
        return [x, y];
    }

    getSize(): number {
        return this.nodeWidth;
    }



}
