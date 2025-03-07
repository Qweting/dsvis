import {
    Text, G, Rect,
} from "@svgdotjs/svg.js";

export class LinkedNode extends G{
    private value: string | number;
    private rectWidth: number;
    private rectHeight: number; 
    
    private elementRect: Rect;
    private textElement: Text; 
    private nextNodeRect: Rect;

    constructor(value: string | number, objectSize: number) {
        super();
        this.value = value;
        this.rectWidth = 2*objectSize;
        this.rectHeight = objectSize;
        
        this.elementRect = this.rect(this.rectWidth, this.rectHeight); //initializing the rectangle for current node
        this.nextNodeRect = this.rect(this.rectWidth / 2, this.rectHeight).move(this.rectWidth + 1, 0); //initializing the rectangle for next node
        this.textElement = this.text(String(value)) //initializing the text element for current node (value)
            .font({ size: this.rectHeight * 0.6 })
            .center(this.elementRect.cx(), this.elementRect.cy());
    }

    
    
    // Get the center left coords of the node
    getLeft(): [number, number] {
        return [this.elementRect.cx() - this.rectWidth / 2, this.elementRect.cy()];
    }
    
    // Get the center right coords of the node
    getRight(): [number, number] {
        return [this.nextNodeRect.cx() + this.rectWidth / 4, this.elementRect.cy()];
    }

    // Get the center top coords of the node
    getTop(): [number, number] {
        return [this.elementRect.cx() + this.rectWidth / 2, this.elementRect.cy() - this.rectHeight / 2];
    }

    // Get the center bottom coords of the node
    getBottom(): [number, number] {
        return [this.elementRect.cx() + this.rectWidth / 2, this.elementRect.cy() + this.rectHeight / 2];
    }
    
}