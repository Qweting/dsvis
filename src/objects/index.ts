import {Container, Element, extend, Svg} from "@svgdotjs/svg.js";
import {Engine} from "../../src/engine";
import {AVLNode} from "./avl-node";
import {BinaryNode} from "./binary-node";
import {BTreeConnection} from "./btree-connection";
import {BTreeNode} from "./btree-node";
import {Connection} from "./connection";
import {DSArray} from "./dsarray";
import {GraphNode} from "./graph-node";
import {HighlightCircle} from "./highlight-circle";
import {TextCircle} from "./text-circle";

declare module "@svgdotjs/svg.js" {
  interface Svg {
    $engine: Engine;
  }

  interface Element {
    getHighlight(): boolean;
    setHighlight(high: boolean | null): this;
    getCenter(): [number, number];
    setCenter(x: number, y: number, animationDuration?: number): this;
    dmoveCenter(dx: number, dy: number, animationDuration?: number): this;
    engine(): Engine;
  }

  interface Container {
    put<T extends Element>(element: T, i?: number): T;
    highlightCircle(
      x: number,
      y: number,
      radius: number,
      strokeWidth: number
    ): HighlightCircle;
    textCircle(
      text: string,
      x: number,
      y: number,
      size: number,
      strokeWidth: number
    ): TextCircle;
    graphNode(
      text: string,
      x: number,
      y: number,
      size: number,
      strokeWidth: number
    ): GraphNode;
    binaryNode(
      text: string,
      x: number,
      y: number,
      size: number,
      strokeWidth: number
    ): BinaryNode;
    avlNode(
      text: string,
      x: number,
      y: number,
      size: number,
      strokeWidth: number
    ): AVLNode;
    connection<T extends GraphNode>(
      start: T,
      end: T,
      strokeWidth: number,
      bend?: number,
      directed?: boolean
    ): Connection<T>;
    bTreeNode(
      leaf: boolean,
      nvalues: number,
      x: number,
      y: number,
      objectSize: number,
      strokeWidth: number
    ): BTreeNode;
    bTreeConnection(
      start: BTreeNode,
      end: BTreeNode,
      child: number,
      numChildren: number,
      strokeWidth: number
    ): BTreeConnection;
    dsArray(size: number, x: number, y: number, horizontal: boolean): DSArray;
  }
}

extend(Element, {
    getHighlight() {
        return (this as Element).hasClass("highlight");
    },
    setHighlight(high: boolean | null) {
        if (high == null) (this as Element).toggleClass("highlight");
        else if (high) (this as Element).addClass("highlight");
        else (this as Element).removeClass("highlight");
        return this as Element;
    },
    getCenter() {
        return [(this as Element).cx(), (this as Element).cy()] as [number, number];
    },
    setCenter(x: number, y: number, animationDuration: number = 0) {
        return (this as Element)
            .engine()
            .animate(this as Element, animationDuration > 0)
            .center(x, y);
    },
    dmoveCenter(dx: number, dy: number, animationDuration: number = 0) {
        (this as Element).setCenter(
            (this as Element).cx() + dx,
            (this as Element).cy() + dy,
            animationDuration
        );
        return this as Element;
    },
    engine() {
        return (this as Element).root().$engine;
    },
});

extend(Container, {
    highlightCircle(x: number, y: number, radius: number, strokeWidth: number) {
        return (this as Container)
            .put(new HighlightCircle())
            .init(x, y, radius, strokeWidth);
    },
    textCircle(
        text: string,
        x: number,
        y: number,
        size: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new TextCircle())
            .init(text, x, y, size, strokeWidth);
    },
    graphNode(
        text: string,
        x: number,
        y: number,
        size: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new GraphNode())
            .init(text, x, y, size, strokeWidth);
    },
    binaryNode(
        text: string,
        x: number,
        y: number,
        size: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new BinaryNode())
            .init(text, x, y, size, strokeWidth);
    },
    avlNode(
        text: string,
        x: number,
        y: number,
        size: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new AVLNode())
            .init(text, x, y, size, strokeWidth);
    },
    connection<T extends GraphNode>(
        start: T,
        end: T,
        strokeWidth: number,
        bend?: number,
        directed?: boolean
    ) {
        return (this as Container)
            .put(new Connection<T>(start, end))
            .init(strokeWidth, bend, directed);
    },
    bTreeNode(
        leaf: boolean,
        nvalues: number,
        x: number,
        y: number,
        objectSize: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new BTreeNode())
            .init(leaf, nvalues, x, y, objectSize, strokeWidth);
    },
    bTreeConnection(
        start: BTreeNode,
        end: BTreeNode,
        child: number,
        numChildren: number,
        strokeWidth: number
    ) {
        return (this as Container)
            .put(new BTreeConnection(start, end, child, numChildren))
            .init(strokeWidth);
    },
    dsArray: function(size: number, x: number, y: number, horizontal: boolean) {
        return (this as Container).put(new DSArray()).init(size, x, y, horizontal);
    },
});

export {Svg};
