import { Svg as SvgElement, Text } from "@svgdotjs/svg.js";
import { NBSP } from "./engine";

export type InfoStatus = "running" | "paused" | "inactive";

const statusText = {
    running: "Animating",
    paused: "Paused",
    inactive: "Idle",
};

const statusClass = {
    running: "Animating",
    paused: "Paused",
    inactive: "Idle",
};

export class Info {
    private Svg: SvgElement;
    title: Text;
    body: Text;
    printer: Text;
    status: Text;

    constructor(Svg: SvgElement, margin: number) {
        this.Svg = Svg;
        const height = this.Svg.viewbox().height;

        const title = this.Svg.text(NBSP).addClass("title").x(margin).y(margin);
        const body = this.Svg.text(NBSP)
            .addClass("message")
            .x(margin)
            .y(2 * margin);
        const printer = this.Svg.text(NBSP)
            .addClass("printer")
            .x(margin)
            .cy(height - 2 * margin);
        const status = this.Svg.text(NBSP)
            .addClass("status-report")
            .x(margin)
            .cy(height - margin);

        this.title = title;
        this.body = body;
        this.printer = printer;
        this.status = status;
    }

    setTitle(text: string) {
        this.title.text(text || NBSP);
    }

    setBody(text: string) {
        this.body.text(text || NBSP);
    }

    setStatus(status: InfoStatus, timeout = 10): void {
        setTimeout(() => {
            this.status
                .text(statusText[status] || NBSP)
                .removeClass("paused running")
                .addClass(statusClass[status]);
        }, timeout);
    }

    setIdleTitle(): void {
        this.setTitle("Select an action from the menu above");
        this.setBody(NBSP);
    }

    reset() {
        this.Svg.put(this.title.text(NBSP));
        this.Svg.put(this.body.text(NBSP));
        this.Svg.put(this.printer.text(NBSP));
        this.Svg.put(this.status.text(NBSP));
    }
}
