import { Engine, SubmitFunction } from "~/engine";
import { AVL } from "~/trees/AVL";
import { BST } from "~/trees/BST";
import { BTree } from "~/trees/BTree";
import { RedBlack } from "~/trees/RedBlack";
import { SplayTree } from "~/trees/SplayTree";
import { initialiseEngine, RecordOfEngines } from "./helpers";
import { LinkedListAnim } from "./basic/LinkedListAnim";

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
} as const satisfies RecordOfEngines<Collection>;

initialiseEngine("#collectionsContainer", COLLECTIONS_CLASSES);
