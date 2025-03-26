import { Circle, G, Text } from "@svgdotjs/svg.js";
import { NBSP } from "~/engine";

export class TextCircle extends G {
    $circle: Circle;
    $text: Text;

    constructor(text: string, size: number, strokeWidth: number) {
        super();
        this.$circle = this.circle(size).stroke({ width: strokeWidth });
        this.$text = this.text(text);
    }

    init(x: number, y: number): this {
        this.$circle.center(0, 0);
        this.$text.center(0, 0);
        this.center(x, y);

        return this;
    }

    getText(): string {
        return this.$text.text();
    }

    setText(text: string | null): this {
        if (text == null) {
            text = "";
        }
        text = `${text}`;
        // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
        if (text === "") {
            text = NBSP;
        }
        this.$text.text(text);
        return this;
    }

    getSize(): number {
        const r = this.$circle.attr("r");
        if (typeof r === "number") {
            return r * 2;
        }
        if (typeof r === "string" && !isNaN(Number(r))) {
            return Number(r) * 2;
        }
        return 0;
    }

    setSize(diameter: number, animationDuration: number = 0) {
        this.engine()
            .animate(this.$circle, animationDuration > 0)
            .attr("r", String(diameter / 2));
        return this;
    }

    toString(): string {
        return this.getText();
    }
}
