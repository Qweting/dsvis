import { find, Path, Rect } from "@svgdotjs/svg.js";
import { Connection } from "./connection";
import { TextCircle } from "./text-circle";

export class GraphNode extends TextCircle {
    $incoming: Record<string, Connection<GraphNode> | null> = {};
    $outgoing: Record<string, Connection<GraphNode> | null> = {};
    $nullary: Record<string, Path | null> = {};
    $rect: Rect;

    constructor(text: string, size: number, strokeWidth: number) {
        super(text, size, strokeWidth);

        const bgSize = 3 * size;
        this.$rect = this.rect(bgSize, bgSize).addClass("invisible");
    }

    init(x: number, y: number): this {
        this.$rect.center(0, 0);
        super.init(x, y);
        return this;
    }

    getBend(key: unknown): number {
        return 0;
    }

    getDirected(key: unknown): boolean {
        return true;
    }

    getIncoming(inKey: string): Connection<GraphNode> | null {
        return this.$incoming[inKey];
    }

    getOutgoing(outKey: string): Connection<GraphNode> | null {
        return this.$outgoing[outKey];
    }

    getIncomingEdges(): Connection<GraphNode>[] {
        return Object.values(this.$incoming).filter((e) => e !== null);
    }

    getOutgoingEdges(): Connection<GraphNode>[] {
        return Object.values(this.$outgoing).filter((e) => e !== null);
    }

    getPredecessors(): GraphNode[] {
        return Object.values(this.$incoming)
            .map((e) => e?.getStart())
            .filter((e) => e !== undefined);
    }

    getSuccessors(): GraphNode[] {
        return Object.values(this.$outgoing)
            .map((e) => e?.getEnd())
            .filter((e) => e !== undefined);
    }

    getPredecessor(inKey: string): GraphNode | null {
        return this.$incoming[inKey]?.getStart() || null;
    }

    getSuccessor(outKey: string): GraphNode | null {
        return this.$outgoing[outKey]?.getEnd() || null;
    }

    setPredecessor(
        inKey: string,
        outKey: string,
        predecessor: GraphNode,
        strokeWidth: number
    ): this {
        predecessor.setSuccessor(outKey, inKey, this, strokeWidth);
        return this;
    }

    setSuccessor(
        outKey: string,
        inKey: string,
        successor: GraphNode,
        strokeWidth: number
    ): this {
        const outEdge = this.$outgoing[outKey];
        if (outEdge) {
            const oldSuccessor = outEdge.getEnd();
            const oldIncoming = oldSuccessor.$incoming;
            for (const k in oldIncoming) {
                if (oldIncoming[k] === outEdge) {
                    delete oldIncoming[k];
                }
            }
            outEdge.remove();
        }
        if (successor) {
            const inEdge = successor.$incoming[inKey];
            if (inEdge) {
                const oldPredecessor = inEdge.getStart();
                const oldOutgoing = oldPredecessor.$outgoing;
                for (const k in oldOutgoing) {
                    if (oldOutgoing[k] === inEdge) {
                        delete oldOutgoing[k];
                    }
                }
                inEdge.remove();
            }
            const edge = this.root().connection(
                this,
                successor,
                strokeWidth,
                this.getBend(outKey),
                this.getDirected(outKey)
            );

            this.$outgoing[outKey] = edge;
            successor.$incoming[inKey] = edge;
        } else {
            delete this.$outgoing[outKey];
        }
        this._updateNullary();
        return this;
    }

    _updateNullary(): void {
        for (const node of find("g")) {
            if (node instanceof GraphNode) {
                for (const c in node.$nullary) {
                    const show = !node.$outgoing[c];
                    if (show) {
                        node.$nullary[c]?.removeClass("invisible");
                    } else {
                        node.$nullary[c]?.addClass("invisible");
                    }
                }
            }
        }
    }

    setIncomingHighlight(inKey: string, high: boolean | null): this {
        this.setHighlight(high);
        this.getIncoming(inKey)?.setHighlight(high);
        return this;
    }

    getHighlight(): boolean {
        return this.hasClass("highlight");
    }
    setOutgoingHighlight(outKey: string, high: boolean | null): this {
        this.setHighlight(high);
        this.getOutgoing(outKey)?.setHighlight(high);
        return this;
    }

    // TODO: Refactor to use foreach loop?
    remove(): this {
        for (const outKey in this.$outgoing) {
            const outEdge = this.$outgoing[outKey];
            if (!outEdge) {
                continue;
            }
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
            if (!inEdge) {
                continue;
            }
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
        return this;
    }

    setCenter(x: number, y: number, animationDuration: number = 0): this {
        super.setCenter(x, y, animationDuration);
        for (const edge of this.getOutgoingEdges()) {
            edge.update({ x1: x, y1: y }, animationDuration);
        }
        for (const edge of this.getIncomingEdges()) {
            edge.update({ x2: x, y2: y }, animationDuration);
        }
        return this;
    }

    setSize(size: number, animationDuration: number = 0): this {
        super.setSize(size, animationDuration);
        for (const edge of this.getIncomingEdges()) {
            edge.update({ r2: size / 2 }, animationDuration);
        }
        return this;
    }
}
