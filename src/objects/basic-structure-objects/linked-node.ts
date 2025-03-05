import {
    Text, G, Marker, Svg, Rect,
} from "@svgdotjs/svg.js";
import { Connection } from "./node-connection";
import { Cookie } from "undici-types";

export class LinkedNode extends G{
    private _value: string | number;
    private _rectWidth: number;
    private _rectHeight: number; 
    
    private _elementRect: Rect;
    private _textElement: Text; 
    private _nextElementRect: Rect; 

    constructor(value: string | number, objectSize: number) {
        super();
        this._value = value;
        this._rectWidth = 2*objectSize;
        this._rectHeight = objectSize;
        
        this._elementRect = this.rect(this._rectWidth, this._rectHeight); //initializing the rectangle for current node
        this._nextElementRect = this.rect(this._rectWidth / 2, this._rectHeight).move(this._rectWidth + 1, 0); //initializing the rectangle for next node
        this._textElement = this.text(String(value)) //initializing the text element for current node (value)
            .font({ size: this._rectHeight * 0.6 })
            .center(this._elementRect.cx(), this._elementRect.cy());
    }

    get value(): string | number {
        return this._value;
    }

    set value(value: string | number) {
        this._value = value;
    }

    get rectWidth(): number {
        return this._rectWidth;
    }

    set rectWidth(value: number) {
        this._rectWidth = value;
    }

    get rectHeight(): number {
        return this._rectHeight;
    }

    set rectHeight(value: number) {
        this._rectHeight = value;
    }

    get elementRect(): Rect {
        return this._elementRect;
    }

    set elementRect(value: Rect) {
        this._elementRect = value;
    }

    get textElement(): Text {
        return this._textElement;
    }

    //text element for the current node
    set textElement(value: Text) {
        this._textElement = value;
    }

    get nextElementRect(): Rect {
        return this._nextElementRect;
    }

    set nextElementRect(value: Rect) {
        this._nextElementRect = value;
    }
    
    // Get the center left coords of the node
    getLeft() {
        return {
            x: this._elementRect.cx() - this._rectWidth / 2,
            y: this._elementRect.cy(),
        };
    }
    
    // Get the center right coords of the node
    getRight() {
        return {
            x: this._nextElementRect.cx() + this._rectWidth / 4,
            y: this._elementRect.cy(),
        };
    }

    // Get the center top coords of the node
    getTop() {
        return {
            x: this._elementRect.cx() + this._rectWidth / 2,
            y: this._elementRect.cy() - this._rectHeight / 2,
        };
    }

    // Get the center bottom coords of the node
    getBottom() {
        return {
            x: this._elementRect.cx() + this._rectWidth / 2,
            y: this._elementRect.cy() + this._rectHeight / 2,
        };
    }
    
}