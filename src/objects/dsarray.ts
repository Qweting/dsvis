import { G, Rect, Text } from "@svgdotjs/svg.js";
import { NBSP } from "~/engine";
import { Polyline } from "@svgdotjs/svg.js";

export class DSArray extends G {
    $horizontal: boolean;
    $rect: Rect;
    $backgrounds: Rect[] = [];
    $values: Text[] = [];
    $indices: Text[] = [];

    constructor(size: number, objectSize: number, horizontal: boolean = true) {
        super();
        this.$horizontal = horizontal;
        this.$values = new Array(size);
        this.$rect = this.rect(objectSize * size, 3 * objectSize)
            .addClass("invisible")
            .center(0, 0);
    }

    init(size: number, x: number, y: number) {
        this.setSize(size);
        this.clear();
        this.center(x, y);
        return this;
    }

    getCX(i: number): number {
        return (
            this.cx() +
            this.engine().getObjectSize() * (i - this.getSize() / 2 + 0.5)
        );
    }

    getSize(): number {
        return this.$values.length;
    }

    setSize(size: number) {
        while (size < this.getSize()) {
            this.$backgrounds.pop()?.remove();
            this.$values.pop()?.remove();
            this.$indices.pop()?.remove();
        }
        const w0 = this.engine().getObjectSize();
        const h = this.engine().getObjectSize();
        const stroke = this.engine().getStrokeWidth();
        this.$rect.width(w0 * size);
        const cx = this.$rect.cx(),
            cy = this.$rect.cy();
        for (let i = 0; i < size; i++) {
            if (!this.$backgrounds[i]) {
                this.$backgrounds[i] = this.rect(w0, h)
                    .stroke({ width: stroke })
                    .addClass("background");
            }
            this.$backgrounds[i].center(cx + w0 * (i - size / 2 + 0.5), cy);
            if (!this.$values[i]) {
                this.$values[i] = this.text(NBSP);
            }
            this.$values[i].center(cx + w0 * (i - size / 2 + 0.5), cy);
            if (!this.$indices[i]) {
                this.$indices[i] = this.text(i.toString()).addClass(
                    "arrayindex"
                );
            }
            this.$indices[i].center(
                cx + w0 * (i - size / 2 + 0.5),
                cy + h * 0.8
            );
        }
        return this;
    }

    clear() {
        for (let i = 0; i < this.getSize(); i++) {
            this.setValue(i, "");
            this.setDisabled(i, true);
        }
        return this;
    }

    getValues(): Array<string> {
        return this.$values.map((t) => t.text());
    }

    setValues(values: Array<string>) {
        if (values.length !== this.getSize()) {
            throw new Error(
                `Wrong number of values: ${values.length} != ${this.getSize()}`
            );
        }
        for (let i = 0; i < values.length; i++) {
            this.setValue(i, values[i]);
        }
        return this;
    }

    getValue(i: number): string {
        return this.$values[i].text();
    }

    setValue(i: number, text: string) {
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

    swap(j: number, k: number, animate: boolean = false) {
        const jText = this.$values[j],
            kText = this.$values[k];
        const jX = this.getCX(j),
            kX = this.getCX(k);
        this.engine().animate(jText, animate).cx(kX);
        this.engine().animate(kText, animate).cx(jX);
        this.$values[k] = jText;
        this.$values[j] = kText;
        return this;
    }

    setDisabled(i: number, disabled: boolean | null) {
        const bg = this.$backgrounds[i];
        if (disabled == null) {
            bg.toggleClass("disabled");
        } else if (disabled) {
            bg.addClass("disabled");
        } else {
            bg.removeClass("disabled");
        }
        return this;
    }

    setBlueHighlight(i: number, high: boolean) {
        for (const obj of [this.$backgrounds[i], this.$values[i]]) {
            if (high == null) {
                obj.toggleClass("highlightblue");
            } else if (high) {
                obj.addClass("highlightblue");
            } else {
                obj.removeClass("highlightblue");
            }
        }
        for (const bg of Object.values(this.$backgrounds)) {
            if (!bg.hasClass("highlightblue")) {
                bg.back();
            }
        }
        return this;
    }

    setIndexHighlight(i: number, high: boolean, color: string = "#C00") {
        if (this.$backgrounds[i]) {
            if (high) {
                this.$backgrounds[i].css("stroke", color);
            } else {
                this.$backgrounds[i].css("stroke", "");
            }
        }

        if (this.$values[i]) {
            if (high) {
                this.$values[i].css("fill", color);
            } else {
                this.$values[i].css("fill", "");
            }
        }

        for (const bg of Object.values(this.$backgrounds)) {
            if (!bg.css("stroke")) {
                bg.back();
            }
        }
        return this;
    }

    addArrow(index: number, arrowId: string = "arrow") {
        const arrowSize = 10;
        const arrowOffset = 10;

        const x = this.getCX(index);
        const y = this.cy() - this.engine().getObjectSize() / 2 - arrowOffset;

        const arrow = this.polyline([
            [x, y],
            [x - arrowSize, y - arrowSize],
            [x + arrowSize, y - arrowSize],
            [x, y],
        ])
            .fill("none")
            .stroke({ width: 2, color: "#000" })
            .id(arrowId);

        this.add(arrow);
    }

    removeArrow(arrowId: string) {
        const arrow = this.findOne(`#${arrowId}`) as Polyline | null;
        if (arrow) {
            arrow.remove();
        }
    }

    moveArrow(arrowId: string, indexTo: number) {
        const arrow = this.findOne(`#${arrowId}`) as Polyline | null;
        const x = this.getCX(indexTo);

        if (arrow) {
            this.engine().animate(arrow, true).cx(x);
        }
    }

    setArrowHighlight(id: string, high: boolean, color: string = "#C00") {
        const arrow = this.findOne(`#${id}`);
        if (arrow) {
            if (high) {
                arrow.css("fill", color);
            } else {
                arrow.css("fill", "");
            }
        }

        return this;
    }
}
