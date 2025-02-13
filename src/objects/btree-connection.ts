import { BTreeNode } from "./btree-node";
import { Connection } from "./connection";

export class BTreeConnection extends Connection<BTreeNode> {
  $maxBend = 0.1;
  $coords: {
    x1: number;
    x2: number;
    y1: number;
    y2: number;
    r2: number;
    n: number;
    i: number;
  } = {
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 0,
    r2: 0,
    n: 0,
    i: 0,
  };

  // @ts-expect-error TODO: Separate BTreeConnection from BSTConnection and have both extend a base connection
  init(
    start: BTreeNode,
    end: BTreeNode,
    child: number,
    numChildren: number,
    strokeWidth: number
  ): this {
    Object.assign(this.$coords, { i: child, n: numChildren });
    return super.init(start, end, strokeWidth);
  }

  getBend(): number {
    if (this.$coords.n <= 1) return 0;
    return this.$maxBend * (1 - (2 * this.$coords.i) / (this.$coords.n - 1));
  }

  _getPath(): string {
    const C = this.$coords;
    let x1 = C.x1 + (2 * C.i - C.n + 1) * C.r2;
    const y1 = C.y1 + C.r2;
    // To compensate for the rounded corners:
    if (C.i === 0) x1 += C.r2 / 4;
    if (C.i === C.n - 1) x1 -= C.r2 / 4;
    const xControl = (x1 + C.x2) / 2 + (y1 - C.y2) * this.getBend();
    const yControl = (y1 + C.y2) / 2 + (C.x2 - x1) * this.getBend();
    return `M ${x1} ${y1} Q ${xControl} ${yControl} ${C.x2} ${C.y2}`;
  }
}
