import { G, Line, Rect, Text } from "@svgdotjs/svg.js";
import { NBSP } from "../../src/engine";
import { BTreeConnection } from "./btree-connection";

export class BTreeNode extends G {
    $parent: BTreeConnection | null = null;
    $children: (BTreeConnection | null)[] | null = null;

    $rect: Rect | null = null;
    $values: Text[] = [];
    $lines: Line[] = [];
    $rightWidth: number = 0;
    $leftWidth: number = 0;
    $childWidths: number = 0;
    $width: number = 0;

    init(
        leaf: boolean,
        nvalues: number,
        x: number,
        y: number,
        objectSize: number,
        strokeWidth: number
    ): this {
        if (nvalues < 1) {
            throw new Error("BTreeNode: must have at least one value");
        }
        this.$children = leaf ? null : Array(nvalues + 1);
        this.setNumValues(nvalues, objectSize, strokeWidth);
        if (x && y) {
            this.center(x, y);
        }
        return this;
    }

    toString(): string {
        return `[${this.getTexts().join(" | ")}]`;
    }

    numValues(): number {
        return this.$values.length;
    }

    numChildren(): number {
        return this.$children?.length || 0;
    }

    isLeaf(): boolean {
        return this.$children === null;
    }

    // TODO: Understand this function PS not in use
    setLeaf(leaf: boolean, strokeWidth: number): this {
        if (leaf && this.$children) {
            for (let i = 0; i < this.$children.length; i++) {
                this.setChild(i, null, strokeWidth);
            }
            this.$children = null;
        } else {
            this.$children = Array(this.numValues() + 1);
        }
        return this;
    }

    insertValue(
        i: number,
        text: string,
        objectSize: number,
        strokeWidth: number,
        leftChildInsert = false
    ): this {
        if (i < this.numValues()) {
            const dx = (i / Math.max(1, this.numValues()) - 1) * objectSize;
            this.dmoveCenter(dx, 0);
        }
        this.$values.splice(i, 0);
        this.$lines.splice(i, 0);
        if (!this.isLeaf()) {
            const j = leftChildInsert ? i : i + 1;
            this.$children?.splice(j, 0);
        }
        this.setNumValues(this.numValues(), objectSize, strokeWidth);
        this.setText(i, text);

        return this;
    }

    deleteValue(
        i: number,
        objectSize: number,
        strokeWidth: number,
        leftChildDelete = true
    ): this {
        this.$values[i].remove();
        this.$values.splice(i, 1);
        const l = Math.max(i, 1);
        this.$lines[l].remove();
        this.$lines.splice(l, 1);
        if (!this.isLeaf()) {
            const j = leftChildDelete ? i : i + 1;
            this.setChild(j, null, strokeWidth);
            this.$children?.splice(j, 1);
        }
        this.setNumValues(this.numValues(), objectSize, strokeWidth);

        return this;
    }

    setNumValues(nvalues: number, objectSize: number, strokeWidth: number): this {
        while (nvalues < this.numValues()) {
            if (!this.isLeaf()) {
                this.setChild(this.$children?.length || 0 - 1, null, strokeWidth);
                this.$children?.pop();
            }
            this.$values.pop()?.remove();
            this.$lines.pop()?.remove();
        }

        const w0 = objectSize,
            h = objectSize,
            stroke = strokeWidth;
        if (!this.$rect) {
            this.$rect = this.rect(w0 * nvalues, h)
                .stroke({ width: stroke })
                .center(0, 0);
        }
        this.$rect.width(w0 * Math.max(0.5, nvalues)).radius(h / 4);
        const cx = this.$rect.cx(),
            cy = this.$rect.cy();
        for (let i = 0; i < nvalues; i++) {
            if (!this.$values[i]) {
                this.$values[i] = this.text(NBSP);
            }
            this.$values[i].center(cx + w0 * (i - nvalues / 2 + 0.5), cy);
            if (i > 0) {
                const dx = w0 * (i - nvalues / 2),
                    dy = h / 2;
                if (!this.$lines[i]) {
                    this.$lines[i] = this.line(0, cy - dy, 0, cy + dy).stroke({
                        width: stroke,
                    });
                }
                this.$lines[i].cx(cx + dx);
            }
        }
        if (!this.isLeaf() && this.$children) {
            const n = (this.$children.length = nvalues + 1);
            for (let i = 0; i < n; i++) {
                // @ts-expect-error TODO: i and n not on base object and can therefor not be passed in
                this.$children[i]?.update({ i: i, n: n });
            }
        }

        return this;
    }

    getCX(i: number, objectSize: number): number {
        return this.cx() + objectSize * (i - this.numValues() / 2 + 0.5);
    }

    getWidth(): number {
        return Number(this.$rect?.width()) || 0;
    }

    getHeight(): number {
        return Number(this.$rect?.height()) || 0;
    }

    getSize(): number {
        return this.getHeight();
    }

    getTexts(): string[] {
        return this.$values.map((t) => t.text());
    }

    setTexts(texts: string[]): this {
        if (texts.length !== this.numValues()) {
            throw new Error(
                `Wrong number of texts: ${texts.length} != ${this.numValues()}`
            );
        }
        for (let i = 0; i < texts.length; i++) {
            this.setText(i, texts[i]);
        }

        return this;
    }

    getText(c: number): string {
        return this.$values[c].text();
    }

    setText(i: number, text: string): this {
        if (text == null) {
            text = "";
        }
        text = `${text}`;
        // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
        if (text === "") {
            text = NBSP;
        }
        this.$values[i].text(text);
        return this;
    }

    getParent(): BTreeNode | null {
        return this.$parent?.getStart() || null;
    }

    getChildren(): BTreeNode[] {
        return (
            this.$children?.map((e) => e?.getEnd()).filter((e) => e !== undefined) ||
            []
        );
    }

    getChild(i: number): BTreeNode | null {
        return this.$children?.[i]?.getEnd() || null;
    }

    getLeft(): BTreeNode | null {
        return this.getChild(0);
    }

    getRight(): BTreeNode | null {
        return this.getChild(this.numChildren() - 1);
    }

    isChild(c: number): boolean {
        return this === this.getParent()?.getChild(c);
    }

    getParentIndex(): number | null {
        const parent = this.getParent();
        if (!parent) {
            return null;
        }
        for (let i = 0; i < parent.numChildren(); i++) {
            if (this === parent.getChild(i)) {
                return i;
            }
        }
        return null;
    }

    getParentEdge(): BTreeConnection | null {
        return this.$parent;
    }

    getChildEdge(i: number): BTreeConnection | null {
        return this.$children?.[i] || null;
    }

    setChild(i: number, child: BTreeNode | null, strokeWidth: number): this {
        if (this.$children?.[i]) {
            const oldChild = this.$children[i].getEnd();
            oldChild.$parent = null;
            this.$children[i].remove();
        }
        if (!child) {
            if (this.$children?.[i]) {
                this.$children[i] = null;
            }
        } else {
            if (child.$parent) {
                const oldParent = child.$parent.getStart();
                oldParent.$children?.forEach((oldParentChild) => {
                    if (child.$parent === oldParentChild) {
                        oldParentChild = null;
                    }
                });
                child.$parent.remove();
            }
            const edge = this.root().bTreeConnection(
                this,
                child,
                i,
                this.numChildren(),
                strokeWidth
            );
            if (this.$children?.[i]) {
                this.$children[i] = edge;
            }
            child.$parent = edge;
        }
        return this;
    }

    setParent(c: number, parent: BTreeNode, strokeWidth: number): this {
        parent.setChild(c, this, strokeWidth);
        return this;
    }

    setParentHighlight(high: boolean | null): this {
        this.setHighlight(high);
        this.getParent()?.setHighlight(high);
        return this;
    }

    setChildHighlight(i: number, high: boolean | null): this {
        this.setHighlight(high);
        this.getChild(i)?.setHighlight(high);
        return this;
    }

    remove(): this {
        if (!this.isLeaf()) {
            this.$children?.forEach((child) => {
                if (!child) {
                    return;
                }
                child.remove();
                child = null;
            });
        }

        if (this.$parent) {
            const i = this.getParentIndex();
            if (i !== null && this.$parent.getStart().$children?.[i]) {
                this.$parent.getStart().$children![i] = null;
            }
            this.$parent.remove();
            this.$parent = null;
        }
        super.remove();
        return this;
    }

    setCenter(x: number, y: number, animationDuration: number = 0): this {
        super.setCenter(x, y, animationDuration);
        this.$children?.forEach((child) => {
            child?.update({ x1: x, y1: y }, animationDuration);
        });
        this.$parent?.update({ x2: x, y2: y }, animationDuration);
        return this;
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
        this._setNewPositions(startX, startY, animationDuration);

        return this;
    }

    // TODO: Update name to reflect that number is returned
    _resizeWidths(nodeSpacing: number): number {
        let left = 0,
            right = 0;
        this.$childWidths = 0;
        this.$width = this.getWidth();
        if (!this.isLeaf()) {
            for (const child of this.getChildren()) {
                this.$childWidths += child?._resizeWidths(nodeSpacing) || 0;
            }
            const xSpacing = nodeSpacing;
            this.$width = Math.max(
                this.$width,
                this.$childWidths + this.numValues() * xSpacing
            );
            left = this.getLeft()?.$leftWidth || 0;
            right = this.getRight()?.$rightWidth || 0;
        }
        const mid = this.$width - left - right;
        this.$leftWidth = mid / 2 + left;
        this.$rightWidth = mid / 2 + right;
        return this.$width;
    }

    _setNewPositions(
        x: number,
        y: number,
        nodeSpacing: number,
        animationDuration: number = 0
    ): void {
        this.setCenter(x, y, animationDuration);
        if (this.isLeaf()) {
            return;
        }
        x -= this.$leftWidth;
        const xSpacing = (this.$width - this.$childWidths) / this.numValues();
        const ySpacing = nodeSpacing;
        const nextY = y + this.getHeight() + ySpacing;
        for (const child of this.getChildren()) {
            child?._setNewPositions(x + child.$leftWidth, nextY, animationDuration);
            x += (child?.$width || 0) + xSpacing;
        }
    }
}
