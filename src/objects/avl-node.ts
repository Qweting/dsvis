import {Text} from "@svgdotjs/svg.js";
import {BinaryNode} from "./binary-node";

export class AVLNode extends BinaryNode {
    $height: Text | null = null;
    init(
        text: string,
        x: number,
        y: number,
        size: number,
        strokeWidth: number
    ): this {
        const d = size;
        this.$height = this.text("1")
            .center(-0.6 * d, -0.5 * d)
            .addClass("avlheight");
        return super.init(text, x, y, size, strokeWidth);
    }

    getHeight(): number {
        if (this.$height) {
            return parseInt(this.$height.text());
        }
        return 1;
    }

    setHeight(height: number): this {
        this.$height?.text(String(height));
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
        return this.$height?.getHighlight() || false;
    }

    setHeightHighlight(high: boolean | null): this {
        this.$height?.setHighlight(high);
        return this;
    }
}
