
///////////////////////////////////////////////////////////////////////////////
// Import and export information used by the Javascript linter ESLint:
/* globals SVG, DSVis */
///////////////////////////////////////////////////////////////////////////////

SVG.extend(SVG.Container, {
    dsArray: function(size, x, y, horizontal = true) {
        return this.put(new SVG.DSArray()).init(size, x, y, horizontal);
    },
});


SVG.DSArray = class DSArray extends SVG.G {
    $horizontal = null;
    $rect = null;
    $backgrounds = [];
    $values = [];
    $indices = [];

    init(size, x, y, horizontal = true) {
        this.$horizontal = horizontal;
        this.$values = new Array(size);
        this.setSize(size);
        this.clear();
        if (x && y) this.center(x, y);
        return this;
    }

    getCX(i) {
        return this.cx() + this.engine().getObjectSize() * (i - this.getSize() / 2 + 0.5);
    }

    getSize() {
        return this.$values.length;
    }

    setSize(size) {
        while (size < this.getSize()) {
            this.$backgrounds.pop()?.remove();
            this.$values.pop()?.remove();
            this.$indices.pop()?.remove();
        }
        const w0 = this.engine().getObjectSize();
        const h = this.engine().getObjectSize();
        const stroke = this.engine().getStrokeWidth();
        if (!this.$rect) this.$rect = this.rect(w0 * size, 3 * h).addClass("invisible").center(0, 0);
        this.$rect.width(w0 * size);
        const cx = this.$rect.cx(), cy = this.$rect.cy();
        for (let i = 0; i < size; i++) {
            if (!this.$backgrounds[i]) this.$backgrounds[i] = this.rect(w0, h).stroke({width: stroke}).addClass("background");
            this.$backgrounds[i].center(cx + w0 * (i - size / 2 + 0.5), cy);
            if (!this.$values[i]) this.$values[i] = this.text(DSVis.NBSP);
            this.$values[i].center(cx + w0 * (i - size / 2 + 0.5), cy);
            if (!this.$indices[i]) this.$indices[i] = this.text(i).addClass("arrayindex");
            this.$indices[i].center(cx + w0 * (i - size / 2 + 0.5), cy + h * 0.8);
        }
        return this;
    }

    clear() {
        for (let i = 0; i < this.getSize(); i++) {
            this.setValue(i);
            this.setDisabled(i, true);
        }
    }

    getValues() {
        return this.$values.map((t) => t.text());
    }

    setValues(values) {
        if (values.length !== this.getSize()) throw new Error(`Wrong number of values: ${values.length} != ${this.getSize()}`);
        for (let i = 0; i < values.length; i++) {
            this.setValue(i, values[i]);
        }
    }

    getValue(i) {
        return this.$values[i].text();
    }

    setValue(i, text) {
        if (text == null) text = "";
        text = `${text}`;
        // Non-breaking space: We need to have some text, otherwise the coordinates are reset to (0, 0)
        if (text === "") text = DSVis.NBSP;
        this.$values[i].text(text);
        return this;
    }

    swap(j, k, animate = false) {
        const jText = this.$values[j], kText = this.$values[k];
        const jX = this.getCX(j), kX = this.getCX(k);
        this.engine().animate(jText, animate).cx(kX);
        this.engine().animate(kText, animate).cx(jX);
        this.$values[k] = jText;
        this.$values[j] = kText;
    }

    setDisabled(i, disabled) {
        const bg = this.$backgrounds[i];
        if (disabled == null) bg.toggleClass("disabled");
        else if (disabled) bg.addClass("disabled");
        else bg.removeClass("disabled");
        return this;
    }

    setIndexHighlight(i, high) {
        for (const obj of [this.$backgrounds[i], this.$values[i]]) {
            if (high == null) obj.toggleClass("highlight");
            else if (high) obj.addClass("highlight");
            else obj.removeClass("highlight");
        }
        for (const bg of Object.values(this.$backgrounds)) {
            if (!bg.hasClass("highlight")) bg.back();
        }
        return this;
    }

    setBlueHighlight(i, high) {
        for (const obj of [this.$backgrounds[i], this.$values[i]]) {
            if (high == null) obj.toggleClass("highlightblue");
            else if (high) obj.addClass("highlightblue");
            else obj.removeClass("highlightblue");
        }
        for (const bg of Object.values(this.$backgrounds)) {
            if (!bg.hasClass("highlightblue")) bg.back();
        }
        return this;
    }

    addArrow(index, arrowId="arrow", arrowColor) {
        const arrowSize = 10;
        const arrowOffset = 10;

        const x = this.getCX(index);
        const y = this.cy() - this.engine().getObjectSize() / 2 - arrowOffset;
    
        const arrow = this.polyline([
            [x, y], 
            [x - arrowSize, y - arrowSize], 
            [x + arrowSize, y - arrowSize], 
            [x, y] 
        ]).fill('none').stroke({ width: 2, color: arrowColor }).id(arrowId);
    
        this.add(arrow);
    }

    removeArrow(arrowId) {
        const arrow = this.findOne(`#${arrowId}`);
        if (arrow) {
            arrow.remove();
        }
    }
};

