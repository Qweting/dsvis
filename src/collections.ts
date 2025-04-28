import { Engine, SubmitFunction } from "~/engine";
import { AVL } from "~/trees/AVL";
import { BST } from "~/trees/BST";
import { BTree } from "~/trees/BTree";
import { RedBlack } from "~/trees/RedBlack";
import { SplayTree } from "~/trees/SplayTree";
import { BTreeAlgorithmControl } from "./algorithm-controls/BTree-algorithm-controls";
import { CollectionAlgorithmControl } from "./algorithm-controls/collection-algorithm-controls";
import { LinkedListAnim } from "~/basic/LinkedListAnim";
import { initialiseEngine, RecordOfEngines } from "./helpers";

export interface Collection extends Engine {
    insert: SubmitFunction;
    find: SubmitFunction;
    delete: SubmitFunction;
    print: SubmitFunction;
}


const COLLECTIONS_CLASSES = {
    BST: BST,
    AVL: AVL,
    RedBlack: RedBlack,
    SplayTree: SplayTree,
    BTree: BTree,
    LinkedListAnim: LinkedListAnim,
} as const satisfies RecordOfEngines<Collection>;

const { engine, isBaseEngine } = initialiseEngine<Collection>(
    "#collectionsContainer",
    COLLECTIONS_CLASSES
);

if (!isBaseEngine) {
    if (engine instanceof BTree) {
        engine.algorithmControls = new BTreeAlgorithmControl(
            engine.container,
            engine
        );
    } else {
        engine.algorithmControls = new CollectionAlgorithmControl(
            engine.container,
            engine
        );
    }
}
