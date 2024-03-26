
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals SVG, DS */
///////////////////////////////////////////////////////////////////////////////

SVG.extend(SVG.Container, {
    bTreeNode: function(leaf, nvalues, x, y) {
        return this.put(new SVG.BTreeNode()).init(leaf, nvalues, x, y);
    },
    bTreeConnection: function(start, end, child, numChildren) {
        return this.put(new SVG.BTreeConnection()).init(start, end, child, numChildren);
    },
});


SVG.BTreeNode = class BTreeNode extends SVG.G {
    $parent = null;
    $children = null;

    $rect = null;
    $values = [];
    $lines = [];

    init(leaf, nvalues, x, y) {
        if (nvalues < 1) throw new Error(`BTreeNode: must have at least one value`);
        this.$children = leaf ? null : Array(nvalues + 1);
        this.setNumValues(nvalues);
        if (x && y) this.center(x, y);
        return this;
    }

    toString() {
        return "[" + this.getTexts().join(" | ") + "]";
    }

    numValues() {
        return this.$values.length;
    }

    numChildren() {
        return this.$children.length;
    }

    isLeaf() {
        return this.$children == null;
    }

    setLeaf(leaf) {
        if (leaf && this.$children) {
            for (let i = 0; i < this.$children.length; i++) {
                this.setChild(i, null);
            }
            this.$children = null;
        } else {
            this.$children = Array(this.numValues() + 1);
        }
    }

    insertValue(i, text, leftChildInsert = false) {
        if (i < this.numValues()) {
            const dx = (i / Math.max(1, this.numValues()) - 1) * DS.getNodeSize();
            this.dmoveCenter(dx, 0);
        }
        this.$values.splice(i, 0, null);
        this.$lines.splice(i, 0, null);
        if (!this.isLeaf()) {
            const j = leftChildInsert ? i : i + 1;
            this.$children.splice(j, 0, null);
        }
        this.setNumValues(this.numValues());
        this.setText(i, text);
    }

    deleteValue(i, leftChildDelete = true) {
        this.$values[i].remove();
        this.$values.splice(i, 1);
        const l = Math.max(i, 1);
        this.$lines[l]?.remove();
        this.$lines.splice(l, 1);
        if (!this.isLeaf()) {
            const j = leftChildDelete ? i : i + 1;
            this.setChild(j, null);
            this.$children.splice(j, 1);
        }
        this.setNumValues(this.numValues());
    }

    setNumValues(nvalues) {
        while (nvalues < this.numValues()) {
            if (!this.isLeaf()) {
                this.setChild(this.$children.length - 1, null);
                this.$children.pop();
            }
            this.$values.pop()?.remove();
            this.$lines.pop()?.remove();
        }

        const w0 = DS.getNodeSize(), h = DS.getNodeSize(), stroke = DS.getStrokeWidth();
        if (!this.$rect) this.$rect = this.rect(w0 * nvalues, h).stroke({width: stroke}).center(0, 0);
        this.$rect.width(w0 * Math.max(1/2, nvalues)).radius(h / 4);
        const cx = this.$rect.cx(), cy = this.$rect.cy();
        for (let i = 0; i < nvalues; i++) {
            if (!this.$values[i]) this.$values[i] = this.text(" ").addClass(DS.getSizeClass());
            this.$values[i].center(cx + w0 * (i - nvalues/2 + 1/2), cy);
            if (i > 0) {
                const dx = w0 * (i - nvalues/2), dy = h / 2;
                if (!this.$lines[i]) this.$lines[i] = this.line(0, cy-dy, 0, cy+dy).stroke({width: stroke});
                this.$lines[i].cx(cx + dx);
            }
        }
        if (!this.isLeaf()) {
            const n = this.$children.length = nvalues + 1;
            for (let i = 0; i < n; i++) {
                this.$children[i]?.update({i: i, n: n});
            }
        }
        return this;
    }

    getCX(i) {
        return this.cx() + DS.getNodeSize() * (i - (this.numValues()-1) / 2);
    }

    getWidth() {
        return this.$rect.width();
    }

    getHeight() {
        return this.$rect.height();
    }

    getSize() {return this.getHeight()}

    getTexts() {
        return this.$values.map((t) => t.text());
    }

    setTexts(texts) {
        if (texts.length !== this.numValues()) throw new Error(`Wrong number of texts: ${texts.length} != ${this.numValues()}`);
        for (let i = 0; i < texts.length; i++) {
            this.setText(i, texts[i]);
        }
    }

    getText(c) {
        return this.$values[c].text();
    }

    setText(i, text) {
        if (text == null) text = "";
        text = `${text}`;
        // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
        if (text === "") text = " ";
        this.$values[i].text(text); 
        return this;
    }

    getParent() {
        return this.$parent?.getStart();
    }

    getChildren() {
        return this.$children.map((e) => e?.getEnd());
    }

    getChild(i) {
        return this.$children[i]?.getEnd();
    }

    getLeft() {
        return this.getChild(0);
    }

    getRight() {
        return this.getChild(this.numChildren() - 1);
    }

    isChild(c) {
        return this === this.getParent()?.getChild(c);
    }

    getParentIndex() {
        const parent = this.getParent();
        if (!parent) return null;
        for (let i = 0; i < parent.numChildren(); i++) {
            if (this === parent.getChild(i)) return i;
        }
        return null;
    }

    getParentEdge() {
        return this.$parent;
    }

    getChildEdge(i) {
        return this.$children[i];
    }

    setChild(i, child) {
        if (this.$children[i]) {
            const oldChild = this.$children[i].getEnd();
            oldChild.$parent = null;
            this.$children[i].remove();
        }
        if (!child) {
            this.$children[i] = null;
        } else {
            if (child.$parent) {
                const oldParent = child.$parent.getStart();
                for (let i = 0; i < oldParent.$children.length; i++) {
                    if (child.$parent === oldParent.$children[i]) {
                        oldParent.$children[i] = null;
                    }
                }
                child.$parent.remove();
            }
            const edge = DS.SVG().bTreeConnection(this, child, i, this.numChildren());
            this.$children[i] = edge;
            child.$parent = edge;
        }
        return this;
    }


    setParent(c, parent) {
        parent.setChild(c, this);
        return this;
    }

    setParentHighlight(high) {
        this.setHighlight(high);
        this.getParent()?.setHighlight(high);
    }

    setChildHighlight(i, high) {
        this.setHighlight(high);
        this.getChild(i)?.setHighlight(high);
    }

    remove() {
        if (!this.isLeaf()) {
            for (let i = 0; i < this.numChildren(); i++) {
                if (!this.$children[i]) continue;
                this.$children[i].getEnd().$parent = null;
                this.$children[i].remove();
                this.$children[i] = null;
            }
        }
        if (this.$parent) {
            const i = this.getParentIndex();
            this.$parent.getStart().$children[i] = null;
            this.$parent.remove();
            this.$parent = null;
        }
        super.remove();
    }

    setCenter(x, y, animate = false) {
        super.setCenter(x, y, animate);
        for (const i in this.$children) {
            this.$children[i]?.update({x1: x, y1: y}, animate);
        }
        this.$parent?.update({x2: x, y2: y}, animate);
        return this;
    }


    resize(startX, startY, animate = true) {
        this._resizeWidths();
        this._setNewPositions(startX, startY, animate);
    }

    _resizeWidths() {
        let left = 0, right = 0;
        this.$childWidths = 0;
        this.$width = this.getWidth();
        if (!this.isLeaf()) {
            for (const child of this.getChildren()) {
                this.$childWidths += child._resizeWidths();
            }
            this.$width = Math.max(this.$width, this.$childWidths + this.numValues() * DS.getSpacingX());
            left = this.getLeft().$leftWidth || 0;
            right = this.getRight().$rightWidth || 0;
        }
        const mid = this.$width - left - right;
        this.$leftWidth = mid / 2 + left;
        this.$rightWidth = mid / 2 + right;
        return this.$width;
    }

    _setNewPositions(x, y, animate) {
        this.setCenter(x, y, animate);
        if (this.isLeaf()) return;
        x -= this.$leftWidth;
        const spacing = (this.$width - this.$childWidths) / this.numValues();
        const nextY = y + this.getHeight() + DS.getSpacingY();
        for (const child of this.getChildren()) {
            child._setNewPositions(x + child.$leftWidth, nextY, animate);
            x += child.$width + spacing;
        }
    }

};


SVG.BTreeConnection = class BTreeConnection extends SVG.Connection {
    $maxBend = 0.1;
    init(start, end, child, numChildren) {
        Object.assign(this.$coords, {i: child, n: numChildren});
        return super.init(start, end);
    }

    getBend() {
        if (this.$coords.n <= 1) return 0;
        return this.$maxBend * (1 - 2 * this.$coords.i / (this.$coords.n-1));
    }

    _getPath() {
        const C = this.$coords;
        let x1 = C.x1 + (2 * C.i - C.n + 1) * C.r2;
        let y1 = C.y1 + C.r2;
        // To compensate for the rounded corners:
        if (C.i === 0) x1 += C.r2 / 4;
        if (C.i === C.n - 1) x1 -= C.r2 / 4;
        const xControl = (x1 + C.x2) / 2 + (y1 - C.y2) * this.getBend();
        const yControl = (y1 + C.y2) / 2 + (C.x2 - x1) * this.getBend();
        return `M ${x1} ${y1} Q ${xControl} ${yControl} ${C.x2} ${C.y2}`;
    }
}