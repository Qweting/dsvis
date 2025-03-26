import { Engine, SubmitFunction } from "~/engine";
import { BinaryHeap } from "~/heaps/BinaryHeap";
import { initialiseEngine, RecordOfEngines } from "./helpers";

export interface Prioqueue extends Engine {
    insert: SubmitFunction;
    deleteMin: SubmitFunction;
}

const PRIOQUEUE_CLASSES = {
    BinaryHeap: BinaryHeap,
} as const satisfies RecordOfEngines<Prioqueue>;

initialiseEngine("#prioqueuesContainer", PRIOQUEUE_CLASSES);
