import { Path } from "@svgdotjs/svg.js";
import { Connection } from "./connection";
import { GraphNode } from "./graph-node";

export const binaryDirs = ["left", "right"] as const;

export type BinaryDir = (typeof binaryDirs)[number];

export class BinaryNode extends GraphNode {
    $incoming: Record<"parent", Connection<this> | null> = {
        parent: null,
    };
    $outgoing: Record<BinaryDir, Connection<this> | null> = {
        left: null,
        right: null,
    };
    $nullary: { left: Path; right: Path };
    $edgebends = { left: 0.1, right: -0.1 };
    $leftWidth: number = 0;
    $rightWidth: number = 0;
    $width: number = 0;

    constructor(text: string, size: number, strokeWidth: number) {
        super(text, size, strokeWidth);

        this.$nullary = {
            left: this.getNullPath("left", size, strokeWidth),
            right: this.getNullPath("right", size, strokeWidth),
        };
    }

    init(x: number, y: number): this {
        this.$nullary.left.back();
        this.$nullary.right.back();
        return super.init(x, y);
    }

    getNullPath(
        side: BinaryDir,
        objectSize: number,
        strokeWidth: number
    ): Path {
        const s = side === "left" ? -1 : 1;

        const nX = 0.5 * objectSize;
        const nY = 0.8 * objectSize;
        const nR = 2 * strokeWidth;

        const pathString = `M 0,0 L ${
            s * nX
        },${nY} m ${nR},0 a ${nR},${nR} 0 1,0 ${
            -2 * nR
        },0 a ${nR},${nR} 0 1,0 ${2 * nR},0`;

        return this.path(pathString)
            .stroke({ width: strokeWidth })
            .addClass("nullnode");
    }

    getBend(c: BinaryDir): number {
        return this.$edgebends[c];
    }

    getParent(): this | null {
        return this.$incoming.parent?.getStart() || null;
    }

    getLeft(): this | null {
        return this.$outgoing.left?.getEnd() || null;
    }

    getRight(): this | null {
        return this.$outgoing.right?.getEnd() || null;
    }

    getChild(c: BinaryDir): this | null {
        return this.$outgoing[c]?.getEnd() || null;
    }

    getSibling(): this | null {
        const parent = this.getParent();
        if (!parent) {
            return null;
        }
        return this === parent.getLeft() ? parent.getRight() : parent.getLeft();
    }

    getParentEdge(): Connection<this> | null {
        return this.$incoming.parent;
    }

    getLeftEdge(): Connection<this> | null {
        return this.$outgoing.left;
    }

    getRightEdge(): Connection<this> | null {
        return this.$outgoing.right;
    }

    getChildEdge(c: BinaryDir): Connection<this> | null {
        return this.$outgoing[c];
    }

    isLeaf(): boolean {
        return !(this.getLeft() || this.getRight());
    }

    isLeftChild(): boolean {
        return this === this.getParent()?.getLeft();
    }

    isRightChild(): boolean {
        return this === this.getParent()?.getRight();
    }

    isChild(c: BinaryDir): boolean {
        return this === this.getParent()?.getChild(c);
    }

    setLeft(child: this, strokeWidth: number): this {
        return this.setChild("left", child, strokeWidth);
    }

    setRight(child: this, strokeWidth: number): this {
        return this.setChild("right", child, strokeWidth);
    }

    setChild(c: BinaryDir, child: this | null, strokeWidth: number): this {
        return this.setSuccessor(c, "parent", child, strokeWidth);
    }

    setParentLeft(parent: BinaryNode, strokeWidth: number): this {
        return this.setParent("left", parent, strokeWidth);
    }

    setParentRight(parent: BinaryNode, strokeWidth: number): this {
        return this.setParent("right", parent, strokeWidth);
    }

    setParent(c: BinaryDir, parent: BinaryNode, strokeWidth: number): this {
        parent.setChild(c, this, strokeWidth);
        return this;
    }

    setParentHighlight(high: boolean | null): this {
        return this.setIncomingHighlight("parent", high);
    }

    setRightHighlight(high: boolean | null): this {
        return this.setChildHighlight("right", high);
    }

    setLeftHighlight(high: boolean | null): this {
        return this.setChildHighlight("left", high);
    }

    setChildHighlight(c: BinaryDir, high: boolean | null): this {
        return this.setOutgoingHighlight(c, high);
    }

    deepString(): string {
        let s = "";
        if (this.getLeft()) {
            s += `(${this.getLeft()?.deepString()}) `;
        }
        s += this.getText();
        if (this.getRight()) {
            s += ` (${this.getRight()?.deepString()})`;
        }
        return s;
    }

    resize(
        startX: number,
        startY: number,
        svgMargin: number,
        nodeSpacing: number,
        animationDuration: number = 0
    ): this {
        this._resizeWidths(nodeSpacing);
        const svgWidth = this.root().viewbox().width;
        if (startX + this.$rightWidth > svgWidth - svgMargin) {
            startX = svgWidth - this.$rightWidth - svgMargin;
        }
        if (startX - this.$leftWidth < svgMargin) {
            startX = this.$leftWidth + svgMargin;
        }
        this._setNewPositions(startX, startY, nodeSpacing, animationDuration);
        return this;
    }

    // TODO: Naming should reflect that number is returned
    _resizeWidths(nodeSpacing: number): number {
        let width = nodeSpacing;
        const left = this.getLeft();
        if (left) {
            width += left._resizeWidths(nodeSpacing);
        }
        const right = this.getRight();
        if (right) {
            width += right._resizeWidths(nodeSpacing);
        }
        width = Math.max(this.getSize(), width);
        const leftWidth = left?.$leftWidth || 0;
        const rightWidth = right?.$rightWidth || 0;
        const mid = width - leftWidth - rightWidth;
        this.$leftWidth = mid / 2 + leftWidth;
        this.$rightWidth = mid / 2 + rightWidth;
        this.$width = width;
        return width;
    }

    _setNewPositions(
        x: number,
        y: number,
        nodeSpacing: number,
        animationDuration: number = 0
    ): void {
        this.setCenter(x, y, animationDuration);
        const ySpacing = nodeSpacing;
        const nextY = y + this.getSize() + ySpacing;
        const left = this.getLeft();
        if (left) {
            left._setNewPositions(
                x - this.$leftWidth + left.$leftWidth,
                nextY,
                nodeSpacing,
                animationDuration
            );
        }
        const right = this.getRight();
        if (right) {
            right._setNewPositions(
                x + this.$rightWidth - right.$rightWidth,
                nextY,
                nodeSpacing,
                animationDuration
            );
        }
    }

    // TODO: Never used? this.getEdges does not exist.
    validate(): void {
        const parent = this.$incoming.parent?.getStart();
        if (parent) {
            const c = this.isLeftChild() ? "left" : "right";
            if (parent.$outgoing[c]?.getEnd() !== this) {
                console.error("Parent mismatch");
            }
            let n = 0;
            // @ts-expect-error Unknown if it has ever worked
            for (const edge of this.getEdges()) {
                if (edge.getStart() === parent) {
                    n++;
                    if (edge.getEnd() !== this) {
                        console.error("Parent edge mismatch");
                    }
                }
            }
            if (n !== 1) {
                console.error(`Wrong n:o parent edges, ${n}`);
            }
        }
        binaryDirs.map((c) => {
            const child = this.$outgoing[c]?.getEnd();
            if (!child) {
                return;
            }
            if (child.$incoming.parent?.getStart() !== this) {
                console.error(`${c} child mismatch`);
            }
            let n = 0;
            // @ts-expect-error Unknown if it has ever worked
            for (const edge of this.getEdges()) {
                if (edge.getEnd() === child) {
                    n++;
                    if (edge.getStart() !== this) {
                        console.error(`${c} child edge mismatch`);
                    }
                }
            }
            if (n !== 1) {
                console.error(`Wrong n:o ${c} child edges, ${n}`);
            }
        });
    }
}
