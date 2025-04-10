import { BinaryNode } from "./binary-node";

type Color = "red" | "black";

export class RedBlackNode extends BinaryNode {
    color: Color;

    constructor(text: string, size: number, strokeWidth: number) {
        super(text, size, strokeWidth);
        this.color = "red";
        this.colorRed();
    }
    init(x: number, y: number): this {
        return super.init(x, y);
    }

    isBlack() {
        return this.color === "black";
    }

    isRed() {
        return this.color === "red";
    }

    colorBlack() {
        this.color = "black";
        this.$circle.css("fill", "lightgrey");
    }

    colorRed() {
        this.color = "red";
        this.$circle.css("fill", "pink");
    }
}
