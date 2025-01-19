
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals SVG, DSVis */
///////////////////////////////////////////////////////////////////////////////

SVG.extend(SVG.Element, {
    getHighlight: function() {
        return this.hasClass("highlight");
    },
    setHighlight: function(high) {
        if (high == null) this.toggleClass("highlight");
        else if (high) this.addClass("highlight");
        else this.removeClass("highlight");
        return this;
    },
    getCenter: function() {
        return [this.cx(), this.cy()];
    },
    setCenter: function(x, y, animate = false) {
        return this.engine().animate(this, animate).center(x, y);
    },
    dmoveCenter: function(dx, dy, animate = false) {
        return this.setCenter(this.cx() + dx, this.cy() + dy, animate);
    },
    engine: function() {
        return this.root().$engine;
    },
});


SVG.extend(SVG.Container, {
    highlightCircle: function(x, y) {
        return this.put(new SVG.HighlightCircle()).init(x, y);
    },
    textCircle: function(text, x, y) {
        return this.put(new SVG.TextCircle()).init(text, x, y);
    },
    graphNode: function(text, x, y) {
        return this.put(new SVG.GraphNode()).init(text, x, y);
    },
    binaryNode: function(text, x, y) {
        return this.put(new SVG.BinaryNode()).init(text, x, y);
    },
    connection: function(start, end, bend = 0, directed = false) {
        return this.put(new SVG.Connection()).init(start, end, bend, directed);
    },
});


SVG.HighlightCircle = class HighlightCircle extends SVG.Circle {
    init(x, y) {
        return this.size(this.engine().getObjectSize()).stroke({width: this.engine().getStrokeWidth()}).center(x, y).addClass("highlight-circle");
    }

    getSize() {
        return this.$circle.radius() * 2;
    }

    setSize(diameter, animate = false) {
        this.engine().animate(this, animate).attr("r", diameter / 2);
        return this;
    }
};


SVG.TextCircle = class TextCircle extends SVG.G {
    init(text, x, y) {
        this.$circle = this.circle(this.engine().getObjectSize()).stroke({width: this.engine().getStrokeWidth()}).center(0, 0);
        this.$text = this.text(text).center(0, 0);
        if (x && y) this.center(x, y);
        return this;
    }

    getText() {
        return this.$text.text();
    }

    setText(text) {
        if (text == null) text = "";
        text = `${text}`;
        // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
        if (text === "") text = DSVis.NBSP;
        this.$text.text(text);
        return this;
    }

    getSize() {
        return this.$circle.radius() * 2;
    }

    setSize(diameter, animate = false) {
        this.engine().animate(this.$circle, animate).attr("r", diameter / 2);
        return this;
    }

    toString() {
        return this.getText();
    }
};


SVG.GraphNode = class GraphNode extends SVG.TextCircle {
    $incoming = {};
    $outgoing = {};
    $nullary = {};

    init(text, x, y) {
        const bgSize = 3 * this.engine().getObjectSize();
        this.rect(bgSize, bgSize).center(0, 0).addClass("invisible");
        return super.init(text, x, y);
    }

    getBend(key) {
        return 0;
    }

    getDirected(key) {
        return true;
    }

    getIncoming(inKey) {
        return this.$incoming[inKey];
    }

    getOutgoing(outKey) {
        return this.$outgoing[outKey];
    }

    getIncomingEdges() {
        return Object.values(this.$incoming).filter((e) => e);
    }

    getOutgoingEdges() {
        return Object.values(this.$outgoing).filter((e) => e);
    }

    getPredecessors() {
        return Object.values(this.$incoming).map((e) => e.getStart());
    }

    getSuccessors() {
        return Object.values(this.$outgoing).map((e) => e.getEnd());
    }

    getPredecessor(inKey) {
        return this.$incoming[inKey].getStart();
    }

    getSuccessor(outKey) {
        return this.$outgoing[outKey].getEnd();
    }

    setPredecessor(inKey, outKey, predecessor) {
        return predecessor.setSuccessor(outKey, inKey, this);
    }

    setSuccessor(outKey, inKey, successor) {
        const outEdge = this.$outgoing[outKey];
        if (outEdge) {
            const oldSuccessor = outEdge.getEnd();
            const oldIncoming = oldSuccessor.$incoming;
            for (const k in oldIncoming) {
                if (oldIncoming[k] === outEdge) delete oldIncoming[k];
            }
            outEdge.remove();
        }
        if (successor) {
            const inEdge = successor.$incoming[inKey];
            if (inEdge) {
                const oldPredecessor = inEdge.getStart();
                const oldOutgoing = oldPredecessor.$outgoing;
                for (const k in oldOutgoing) {
                    if (oldOutgoing[k] === inEdge) delete oldOutgoing[k];
                }
                inEdge.remove();
            }
            const edge = this.root().connection(this, successor, this.getBend(outKey), this.getDirected(outKey));
            this.$outgoing[outKey] = edge;
            successor.$incoming[inKey] = edge;
        } else {
            delete this.$outgoing[outKey];
        }
        this._updateNullary();
        return this;
    }

    _updateNullary() {
        for (const node of SVG.find("g")) {
            if (node instanceof GraphNode) {
                for (const c in node.$nullary) {
                    const show = !node.$outgoing[c];
                    if (show) node.$nullary[c].removeClass("invisible");
                    else node.$nullary[c].addClass("invisible");
                }
            }
        }
    }

    setIncomingHighlight(inKey, high) {
        this.setHighlight(high);
        this.getIncoming(inKey)?.setHighlight(high);
    }

    setOutgoingHighlight(outKey, high) {
        this.setHighlight(high);
        this.getOutgoing(outKey)?.setHighlight(high);
    }

    remove() {
        for (const outKey in this.$outgoing) {
            const outEdge = this.$outgoing[outKey];
            if (!outEdge) continue;
            const end = outEdge.getEnd();
            const incoming = end.$incoming;
            for (const inKey in incoming) {
                if (outEdge === incoming[inKey]) {
                    delete incoming[inKey];
                }
                outEdge.remove();
            }
        }
        for (const inKey in this.$incoming) {
            const inEdge = this.$incoming[inKey];
            if (!inEdge) continue;
            const start = inEdge.getStart();
            const outgoing = start.$outgoing;
            for (const outKey in outgoing) {
                if (inEdge === outgoing[outKey]) {
                    delete outgoing[outKey];
                }
                inEdge.remove();
            }
        }
        super.remove();
        this._updateNullary();
    }

    setCenter(x, y, animate = false) {
        super.setCenter(x, y, animate);
        for (const edge of this.getOutgoingEdges()) {
            edge.update({x1: x, y1: y}, animate);
        }
        for (const edge of this.getIncomingEdges()) {
            edge.update({x2: x, y2: y}, animate);
        }
        return this;
    }

    setSize(diameter, animate = false) {
        super.setSize(diameter, animate);
        for (const edge of this.getIncomingEdges()) {
            edge.update({r2: diameter / 2}, animate);
        }
        return this;
    }
};


SVG.BinaryNode = class BinaryNode extends SVG.GraphNode {
    $incoming = {parent: null};
    $outgoing = {left: null, right: null};
    $nullary = {left: null, right: null};
    $edgebends = {left: 0.1, right: -0.1};

    init(text, x, y) {
        const d = this.engine().getObjectSize();
        const nX = 0.5 * d, nY = 0.8 * d, nR = 2 * this.engine().getStrokeWidth();
        const nullpath = (s) => `M 0,0 L ${s * nX},${nY} m ${nR},0 a ${nR},${nR} 0 1,0 ${-2 * nR},0 a ${nR},${nR} 0 1,0 ${2 * nR},0`;
        this.$nullary.left = this.path(nullpath(-1)).stroke({width: this.engine().getStrokeWidth()}).addClass("nullnode");
        this.$nullary.right = this.path(nullpath(1)).stroke({width: this.engine().getStrokeWidth()}).addClass("nullnode");
        return super.init(text, x, y);
    }

    getBend(c) {
        return this.$edgebends[c];
    }

    getParent() {
        return this.$incoming.parent?.getStart();
    }

    getLeft() {
        return this.$outgoing.left?.getEnd();
    }

    getRight() {
        return this.$outgoing.right?.getEnd();
    }

    getChild(c) {
        return this.$outgoing[c]?.getEnd();
    }

    getSibling() {
        const parent = this.getParent();
        if (!parent) return null;
        return this === parent.getLeft() ? parent.getRight() : parent.getLeft();
    }

    getParentEdge() {
        return this.$incoming.parent;
    }

    getLeftEdge() {
        return this.$outgoing.left;
    }

    getRightEdge() {
        return this.$outgoing.right;
    }

    getChildEdge(c) {
        return this.$outgoing[c];
    }

    isLeaf() {
        return !(this.getLeft() || this.getRight());
    }

    isLeftChild() {
        return this === this.getParent()?.getLeft();
    }

    isRightChild() {
        return this === this.getParent()?.getRight();
    }

    isChild(c) {
        return this === this.getParent()?.getChild(c);
    }

    setLeft(child) {
        return this.setChild("left", child);
    }

    setRight(child) {
        return this.setChild("right", child);
    }

    setChild(c, child) {
        return this.setSuccessor(c, "parent", child);
    }

    setParentLeft(parent) {
        return this.setParent("left", parent);
    }

    setParentRight(parent) {
        return this.setParent("right", parent);
    }

    setParent(c, parent) {
        parent.setChild(c, this);
        return this;
    }

    setParentHighlight(high) {
        return this.setIncomingHighlight("parent", high);
    }

    setRightHighlight(high) {
        return this.setChildHighlight("right", high);
    }

    setLeftHighlight(high) {
        return this.setChildHighlight("left", high);
    }

    setChildHighlight(c, high) {
        return this.setOutgoingHighlight(c, high);
    }

    deepString() {
        let s = "";
        if (this.getLeft()) s += `(${this.getLeft().deepString()}) `;
        s += this.getText();
        if (this.getRight()) s += ` (${this.getRight().deepString()})`;
        return s;
    }

    resize(startX, startY, animate = true) {
        this._resizeWidths();
        const svgMargin = this.engine().$Svg.margin;
        const svgWidth = this.root().viewbox().width;
        if (startX + this.$rightWidth > svgWidth - svgMargin)
            startX = svgWidth - this.$rightWidth - svgMargin;
        if (startX - this.$leftWidth < svgMargin)
            startX = this.$leftWidth + svgMargin;
        this._setNewPositions(startX, startY, animate);
    }

    _resizeWidths() {
        let width = this.engine().getNodeSpacing();
        const left = this.getLeft();
        if (left) width += left._resizeWidths();
        const right = this.getRight();
        if (right) width += right._resizeWidths();
        width = Math.max(this.getSize(), width);
        const leftWidth = left?.$leftWidth || 0;
        const rightWidth = right?.$rightWidth || 0;
        const mid = width - leftWidth - rightWidth;
        this.$leftWidth = mid / 2 + leftWidth;
        this.$rightWidth = mid / 2 + rightWidth;
        this.$width = width;
        return width;
    }

    _setNewPositions(x, y, animate) {
        this.setCenter(x, y, animate);
        const ySpacing = this.engine().getNodeSpacing();
        const nextY = y + this.getSize() + ySpacing;
        const left = this.getLeft();
        if (left) left._setNewPositions(x - this.$leftWidth + left.$leftWidth, nextY, animate);
        const right = this.getRight();
        if (right) right._setNewPositions(x + this.$rightWidth - right.$rightWidth, nextY, animate);
    }

    validate() {
        const parent = this.$parent;
        if (parent) {
            const c = this.isLeftChild() ? "left" : "right";
            if (parent.$children[c] !== this) console.error("Parent mismatch");
            let n = 0;
            for (const edge of this.getEdges()) {
                if (edge.getStart() === parent) {
                    n++;
                    if (edge.getEnd() !== this) console.error("Parent edge mismatch");
                }
            }
            if (n !== 1) console.error(`Wrong n:o parent edges, ${n}`);
        }
        for (const c of ["left", "right"]) {
            const child = this.$children[c];
            if (child.$parent !== this) console.error(`${c} child mismatch`);
            let n = 0;
            for (const edge of this.getEdges()) {
                if (edge.getEnd() === child) {
                    n++;
                    if (edge.getStart() !== this) console.error(`${c} child edge mismatch`);
                }
            }
            if (n !== 1) console.error(`Wrong n:o ${c} child edges, ${n}`);
        }
    }
};


SVG.Connection = class Connection extends SVG.Path {
    $coords = {};

    init(start, end, bend = 0, directed = false) {
        this.$start = start;
        this.$end = end;
        Object.assign(this.$coords, {x1: start.cx(), y1: start.cy(), x2: end.cx(), y2: end.cy(), r2: end.getSize() / 2});
        this.stroke({width: this.engine().getStrokeWidth()});
        this.back();
        this.setBend(bend);
        if (directed) this._createArrow();
        this.update();
        return this;
    }

    getBend() {
        return this.$bend;
    }

    setBend(bend) {
        this.$bend = bend;
    }

    isDirected() {
        return Boolean(this.reference("marker-end"));
    }

    update(newCoords = null, animate = false) {
        Object.assign(this.$coords, newCoords);
        this.engine().animate(this, animate).plot(this._getPath());
        if (this.isDirected()) this._redrawArrow(animate);
    }

    _createArrow() {
        this.marker("end", 5, 4, function(add) {
            add.polygon([0, 0, 5, 2, 0, 4]).addClass("filled");
        });
    }

    _redrawArrow(animate = false) {
        const marker = this.reference("marker-end");
        const radius = this.$coords.r2;
        const stroke = this.attr("stroke-width");
        this.engine().animate(marker, animate).attr({refX: radius / stroke + 5});
    }

    toString() {
        return `${this.getStart()} --> ${this.getEnd()}`;
    }

    getStart() {
        return this.$start;
    }

    getEnd() {
        return this.$end;
    }

    setStart(start, animate = false) {
        if (start === this.$start) return;
        this.$start = start;
        if (start) this.update({x1: start.cx(), y1: start.cy()}, animate);
    }

    setEnd(end, animate = false) {
        if (end === this.$end) return;
        this.$end = end;
        if (end) this.update({x2: end.cx(), y2: end.cy()}, animate);
    }

    setHighlight(high) {
        super.setHighlight(high);
        const marker = this.reference("marker-end");
        if (marker) marker.setHighlight(high);
    }

    _getPath() {
        const C = this.$coords;
        const xControl = (C.x1 + C.x2) / 2 + (C.y1 - C.y2) * this.getBend();
        const yControl = (C.y1 + C.y2) / 2 + (C.x2 - C.x1) * this.getBend();
        return `M ${C.x1} ${C.y1} Q ${xControl} ${yControl} ${C.x2} ${C.y2}`;
    }
};
