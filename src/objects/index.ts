import { Element, extend, Svg } from "@svgdotjs/svg.js";
import { Engine } from "~/engine";

declare module "@svgdotjs/svg.js" {
    interface Svg {
        $engine: Engine;
    }

    interface Element {
        getHighlight(): boolean;
        setHighlight(high: boolean | null): this;
        getCenter(): [number, number];
        setCenter(x: number, y: number, animationDuration?: number): this;
        dMoveCenter(dx: number, dy: number, animationDuration?: number): this;
        engine(): Engine;
    }

    interface Container {
        put<T extends Element>(element: T, i?: number): T;
    }
}

extend(Element, {
    getHighlight() {
        return (this as Element).hasClass("highlight");
    },
    setHighlight(high: boolean | null) {
        if (high == null) {
            (this as Element).toggleClass("highlight");
        } else if (high) {
            (this as Element).addClass("highlight");
        } else {
            (this as Element).removeClass("highlight");
        }
        return this as Element;
    },
    getCenter() {
        return [(this as Element).cx(), (this as Element).cy()] as [
            number,
            number
        ];
    },
    setCenter(x: number, y: number, animationDuration: number = 0) {
        return (this as Element)
            .engine()
            .animate(this as Element, animationDuration > 0)
            .center(x, y);
    },
    dmoveCenter(dx: number, dy: number, animationDuration: number = 0) {
        (this as Element).setCenter(
            (this as Element).cx() + dx,
            (this as Element).cy() + dy,
            animationDuration
        );
        return this as Element;
    },
    engine() {
        return (this as Element).root().$engine;
    },
});

export { Svg };
