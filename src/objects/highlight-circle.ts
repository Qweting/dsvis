import {Circle} from "@svgdotjs/svg.js";

export class HighlightCircle extends Circle {
    init(x: number, y: number, radius: number, strokeWidth: number) {
        return this.radius(radius)
            .stroke({width: strokeWidth})
            .center(x, y)
            .addClass("highlight-circle");
    }

    getSize() {
        const r = this.attr("r");
        if (typeof r === "number") return r * 2;
        if (typeof r === "string" && !isNaN(Number(r))) return Number(r) * 2;
        return 0;
    }

    setSize(diameter: number, animationDuration: number) {
        this.engine()
            .animate(this, animationDuration > 0)
            .attr("r", String(diameter / 2));
        return this;
    }
}
