import { Text } from "@svgdotjs/svg.js";
import { BinaryDir, BinaryNode } from "./binary-node";

export class AVLNode extends BinaryNode {
    $height: Text;

    constructor(text: string, size: number, strokeWidth: number) {
        super(text, size, strokeWidth);
        this.$height = this.text("1").addClass("avlheight");
    }
    init(x: number, y: number): this {
        const size = this.getSize();
        this.$height.center(-0.6 * size, -0.45 * size);

        return super.init(x, y);
    }

    getHeight(): number {
        return parseInt(this.$height.text());
    }

    setHeight(height: number): this {
        this.$height.text(String(height));
        return this;
    }

    updateHeightPosition(): this {
        if (!this.$height) {
            return this;
        }

        const hx = this.$height.cx();
        const cx = this.cx();

        if (this.isRightChild() && hx - cx < 0) {
            this.$height.cx(2 * cx - hx);
        }
        if (this.isLeftChild() && hx - cx > 0) {
            this.$height.cx(2 * cx - hx);
        }

        return this;
    }

    getHeightHighlight(): boolean {
        return this.$height.getHighlight();
    }

    setHeightHighlight(high: boolean | null): this {
        this.$height.setHighlight(high);
        return this;
    }

    // Retyping of functions
    getParent(): AVLNode | null {
        return super.getParent() as AVLNode | null;
    }

    getChild(c: BinaryDir): AVLNode | null {
        return super.getChild(c) as AVLNode | null;
    }

    getLeft(): AVLNode | null {
        return super.getLeft() as AVLNode | null;
    }

    getRight(): AVLNode | null {
        return super.getRight() as AVLNode | null;
    }
}
