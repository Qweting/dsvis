import { Engine } from "./engine";
import { Svg } from "./objects"; // NOT THE SAME Svg as in @svgdotjs/svg.js!!!

export class View {
    Svg: Svg;

    $Svg = {
        width: 1000,
        height: 600,
        margin: 30,
        objectSize: 40,
        animationSpeed: 1000, // milliseconds per step
    };

    constructor(svgContainer: SVGSVGElement, engine: Engine) {
        this.Svg = new Svg(svgContainer);
        this.Svg.viewbox(0, 0, engine.$Svg.width, engine.$Svg.height);
        this.Svg.$engine = engine;
    }

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
}
