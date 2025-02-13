import { Container, Element, extend, Svg } from "@svgdotjs/svg.js";
import { AVLNode } from "./avl-node";
import { BinaryNode } from "./binary-node";
import { BTreeConnection } from "./btree-connection";
import { BTreeNode } from "./btree-node";
import { Connection } from "./connection";
import { GraphNode } from "./graph-node";
import { HighlightCircle } from "./highlight-circle";
import { TextCircle } from "./text-circle";

declare module "@svgdotjs/svg.js" {
  interface Element {
    getHighlight(): boolean;
    setHighlight(high: boolean | null): this;
    getCenter(): [number, number];
    setCenter(x: number, y: number, animationDuration?: number): this;
    dmoveCenter(dx: number, dy: number, animationDuration?: number): this;
    animateSVG(duration: number): this;
  }

  interface Container {
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
    connection<T extends TextCircle>(
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
    (this as Element).animateSVG(animationDuration).center(x, y);
    return this as Element;
  },
  dmoveCenter(dx: number, dy: number, animationDuration: number = 0) {
    (this as Element).setCenter(
      (this as Element).cx() + dx,
      (this as Element).cy() + dy,
      animationDuration
    );
    return this as Element;
  },
  animateSVG(duration: number) {
    // TODO: Created by me, should be able to simplify code later
    (this as Element).animate(duration, 0, "now");
    return this as Element;
  },
});

extend(Container, {
  highlightCircle(x: number, y: number, radius: number, strokeWidth: number) {
    return (
      (this as Container).put(new HighlightCircle()) as HighlightCircle
    ).init(x, y, radius, strokeWidth);
  },
  textCircle(
    text: string,
    x: number,
    y: number,
    size: number,
    strokeWidth: number
  ) {
    return ((this as Container).put(new TextCircle()) as TextCircle).init(
      text,
      x,
      y,
      size,
      strokeWidth
    );
  },
  graphNode(
    text: string,
    x: number,
    y: number,
    size: number,
    strokeWidth: number
  ) {
    return ((this as Container).put(new GraphNode()) as GraphNode).init(
      text,
      x,
      y,
      size,
      strokeWidth
    );
  },
  binaryNode(
    text: string,
    x: number,
    y: number,
    size: number,
    strokeWidth: number
  ) {
    return ((this as Container).put(new BinaryNode()) as BinaryNode).init(
      text,
      x,
      y,
      size,
      strokeWidth
    );
  },
  avlNode(
    text: string,
    x: number,
    y: number,
    size: number,
    strokeWidth: number
  ) {
    return ((this as Container).put(new AVLNode()) as AVLNode).init(
      text,
      x,
      y,
      size,
      strokeWidth
    );
  },
  connection<T extends TextCircle>(
    start: T,
    end: T,
    strokeWidth: number,
    bend?: number,
    directed?: boolean
  ) {
    return ((this as Container).put(new Connection<T>()) as Connection<T>).init(
      start,
      end,
      strokeWidth,
      bend,
      directed
    );
  },
  bTreeNode(
    leaf: boolean,
    nvalues: number,
    x: number,
    y: number,
    objectSize: number,
    strokeWidth: number
  ) {
    return (
      (this as Container).put(new BTreeNode()) as unknown as BTreeNode
    ).init(leaf, nvalues, x, y, objectSize, strokeWidth);
  },
  bTreeConnection(
    start: BTreeNode,
    end: BTreeNode,
    child: number,
    numChildren: number,
    strokeWidth: number
  ) {
    return (
      (this as Container).put(new BTreeConnection()) as BTreeConnection
    ).init(start, end, child, numChildren, strokeWidth);
  },
});

export { Svg };
