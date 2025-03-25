import { Element, extend, Svg } from "@svgdotjs/svg.js";
import { Engine } from "~/engine";

declare module "@svgdotjs/svg.js" {
    interface Svg {
        $engine: Engine;
    }

    interface Element {
        engine(): Engine;
    }

    interface Container {
        put<T extends Element>(element: T, i?: number): T;
    }
}

extend(Element, {
    engine() {
        return (this as Element).root().$engine;
    },
});

export { Svg };
