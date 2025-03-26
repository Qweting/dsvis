import { Runner } from "@svgdotjs/svg.js";
import { Element } from "@svgdotjs/svg.js";
import { Engine } from "~/engine";
import { Svg } from "~/objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!

export class Canvas {
    Svg: Svg;

    $Svg = {
        width: 1000,
        height: 600,
        margin: 30,
        objectSize: 40,
        animationSpeed: 1000, // milliseconds per step
    };

    // Todo: make debug global
    DEBUG: boolean = false;

    constructor(svgContainer: SVGSVGElement, engine: Engine) {
        this.Svg = new Svg(svgContainer);
        this.Svg.viewbox(0, 0, this.$Svg.width, this.$Svg.height);
        this.Svg.$engine = engine;
    }

    clear() {
        this.Svg.clear();

        const w = this.Svg.viewbox().width;
        const h = this.Svg.viewbox().height;
        if (this.DEBUG) {
            for (let x = 1; x < w / 100; x++) {
                this.Svg.line(x * 100, 0, x * 100, h).addClass("gridline");
            }
            for (let y = 1; y < h / 100; y++) {
                this.Svg.line(0, y * 100, w, y * 100).addClass("gridline");
            }
        }

        this.updateCSSVariables();
    }

    updateCSSVariables() {
        const relativeSize = Math.round(
            (100 * this.getObjectSize()) / this.$Svg.objectSize
        );
        document.documentElement.style.setProperty(
            "--node-font-size",
            `${relativeSize}%`
        );
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Animation constants

    getAnimationSpeed(): number {
        return parseInt(this.Svg.$engine.toolbar.animationSpeed.value);
    }

    getObjectSize(): number {
        return parseInt(this.Svg.$engine.toolbar.objectSize.value);
    }

    getNodeSpacing(): number {
        return this.getObjectSize();
    }

    getStrokeWidth(): number {
        return this.getObjectSize() / 12;
    }

    getNodeStart(): [number, number] {
        return [
            this.$Svg.margin + this.getObjectSize() / 2,
            this.$Svg.margin * 4,
        ];
    }

    getTreeRoot(): [number, number] {
        return [
            this.Svg.viewbox().width / 2,
            2 * this.$Svg.margin + this.getObjectSize() / 2,
        ];
    }

    ///////////////////////////////////////////////////////////////////////////////
    // Helper functions (carried over from index.ts)

    getHighlight(element: Element): boolean {
        return element.hasClass("highlight");
    }

    setHighlight(element: Element, high: boolean | null): Element {
        if (high == null) {
            element.toggleClass("highlight");
        } else if (high) {
            element.addClass("highlight");
        } else {
            element.removeClass("highlight");
        }
        return element;
    }

    getCenter(element: Element): [number, number] {
        return [element.cx(), element.cy()];
    }

    setCenter(
        element: Element,
        x: number,
        y: number,
        animationDuration: number = 0
    ): Element | Runner {
        return this.Svg.$engine
            .animate(element, animationDuration > 0)
            .center(x, y);
    }

    dMoveCenter(
        element: Element,
        dx: number,
        dy: number,
        animationDuration: number = 0
    ): Element | Runner {
        return this.setCenter(
            element,
            element.cx() + dx,
            element.cy() + dy,
            animationDuration
        );
    }
}
