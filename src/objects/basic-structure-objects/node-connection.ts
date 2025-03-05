import {
    Marker, Svg, Line
} from "@svgdotjs/svg.js";

export class Connection extends Line {
    private x1: number;
    private y1: number;
    private x2: number;
    private y2: number;

    private arrowMarker: Marker;

    constructor(startNodeCoords: [number, number], endNodeCoords: [number, number], svgContext: Svg) {
        super();
        this.x1 = startNodeCoords[0];
        this.y1 = startNodeCoords[1];
        this.x2 = endNodeCoords[0];
        this.y2 = endNodeCoords[1];

        this.arrowMarker = svgContext.marker(5, 4, function (add) {
            add.polygon([0, 0, 5, 2, 0, 4]).addClass("filled");
        });

        this.update();
    }

    update(): void {
        this.plot(this.x1, this.y1, this.x2, this.y2).stroke({ width: 2, color: '#000' }).marker('end', this.arrowMarker);
    }
}