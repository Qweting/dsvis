import { G, Rect, Text } from "@svgdotjs/svg.js";

export class LinkedNode extends G {
    value: string | number;
    private nodeWidth: number;
    private nodeHeight: number;

    private elementRect: Rect;
    elementRectWidth: number;
    private textElement: Text;

    private nextNodeRect: Rect;
    nextNodeRectWidth: number;

    private isMirrored: boolean = false;

    constructor(
        value: string | number,
        nodeDimensions: [number, number],
        strokeWidth: number
    ) {
        super();
        this.value = value;
        this.nodeWidth = nodeDimensions[0];
        this.nodeHeight = nodeDimensions[1];
        this.elementRectWidth = this.nodeWidth * (3 / 4);
        this.nextNodeRectWidth = this.nodeWidth * (1 / 4);

        this.elementRect = this.rect(
            this.elementRectWidth,
            this.nodeHeight
        ).stroke({ width: strokeWidth }); //initializing the rectangle for current node
        this.nextNodeRect = this.rect(this.nextNodeRectWidth, this.nodeHeight)
            .stroke({ width: strokeWidth })
            .move(this.elementRectWidth, 0); //initializing the rectangle for next node

        this.textElement = this.text(String(value)) //initializing the text element for current node (value)
            .font({ size: this.nodeHeight * 0.6 })
            .width(this.elementRectWidth)
            .height(this.nodeHeight)
            .amove(this.elementRectWidth / 2, 0)
            .cy(this.nodeHeight / 2);
    }

    // mirrors the node so that elementRect and nextNodeRect are swapped
    mirror(flip: boolean): void {
        if (flip !== this.isMirrored) {
            if (!this.isMirrored) {
                this.nextNodeRect.dx(-this.elementRectWidth);
                this.elementRect.dx(this.nextNodeRectWidth);
                this.textElement.dx(this.nextNodeRectWidth);
                this.isMirrored = true;
            } else {
                this.nextNodeRect.dx(this.elementRectWidth);
                this.elementRect.dx(-this.nextNodeRectWidth);
                this.textElement.dx(-this.nextNodeRectWidth);
                this.isMirrored = false;
            }
        }
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
