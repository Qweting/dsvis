import { Element, Marker, Path } from "@svgdotjs/svg.js";
import { BTreeNode } from "./btree-node";
import { GraphNode } from "./graph-node";

type ConnectionCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r2: number;
};

export class Connection<T extends GraphNode | BTreeNode> extends Path {
  $coords: ConnectionCoordinates = {
    r2: 0,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
  };
  $start: T;
  $end: T;
  $bend: number = 0;

  constructor(start: T, end: T) {
    super();
    this.$start = start;
    this.$end = end;
    this.$coords = {
      x1: start.cx(),
      y1: start.cy(),
      x2: end.cx(),
      y2: end.cy(),
      r2: end.getSize() / 2,
    };
  }

  init(strokeWidth: number, bend: number = 0, directed: boolean = false): this {
    this.stroke({ width: strokeWidth });
    this.back();
    this.setBend(bend);
    if (directed) this._createArrow();
    this.update(this.$coords);
    return this;
  }

  getBend(): number {
    return this.$bend;
  }

  setBend(bend: number): this {
    this.$bend = bend;
    return this;
  }

  isDirected(): boolean {
    return Boolean(this.reference("marker-end"));
  }

  update(
    newCoords: Partial<ConnectionCoordinates>,
    animationDuration: number = 0
  ): this {
    Object.assign(this.$coords, newCoords);
    (this.engine().animate(this, animationDuration > 0) as this).plot(
      this._getPath()
    );
    if (this.isDirected()) this._redrawArrow(animationDuration);
    return this;
  }

  _createArrow(): void {
    this.marker("end", 5, 4, function (add) {
      add.polygon([0, 0, 5, 2, 0, 4]).addClass("filled");
    });
  }

  _redrawArrow(animationDuration: number = 0): void {
    const marker = this.reference<Marker>("marker-end");
    const radius = this.$coords.r2;
    const stroke = this.attr("stroke-width");

    if (!marker || typeof stroke !== "number")
      throw Error("Marker must exist and stroke must be a number");

    this.engine()
      .animate(marker, animationDuration > 0)
      .attr({ refX: radius / stroke + 5 });
  }

  toString(): string {
    return `${this.getStart()} --> ${this.getEnd()}`;
  }

  getStart(): T {
    return this.$start;
  }

  getEnd(): T {
    return this.$end;
  }

  setStart(start: T, animationDuration: number = 0): this {
    if (start === this.$start) return this;
    this.$start = start;
    if (start)
      this.update({ x1: start.cx(), y1: start.cy() }, animationDuration);
    return this;
  }

  setEnd(end: T, animationDuration: number = 0): this {
    if (end === this.$end) return this;
    this.$end = end;
    if (end) this.update({ x2: end.cx(), y2: end.cy() }, animationDuration);
    return this;
  }

  setHighlight(high: boolean | null): this {
    super.setHighlight(high);
    const marker = this.reference<Element>("marker-end");
    if (marker) marker.setHighlight(high);
    return this;
  }

  _getPath(): string {
    const C = this.$coords;
    const xControl = (C.x1 + C.x2) / 2 + (C.y1 - C.y2) * this.getBend();
    const yControl = (C.y1 + C.y2) / 2 + (C.x2 - C.x1) * this.getBend();
    return `M ${C.x1} ${C.y1} Q ${xControl} ${yControl} ${C.x2} ${C.y2}`;
  }

  getCoords(): ConnectionCoordinates {
    return this.$coords;
  }
}
