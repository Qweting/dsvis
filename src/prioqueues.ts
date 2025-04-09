import { Engine, SubmitFunction } from "~/engine";
import { BinaryHeap } from "~/heaps/BinaryHeap";
import { PrioQueueAlgorithmControl } from "./algorithm-controls/prioqueue-algorithm-controls";
import { initialiseEngine, RecordOfEngines } from "./helpers";

export interface Prioqueue extends Engine {
    insert: SubmitFunction;
    deleteMin: SubmitFunction;
}

const PRIOQUEUE_CLASSES = {
    BinaryHeap: BinaryHeap,
} as const satisfies RecordOfEngines<Prioqueue>;

const { engine, isBaseEngine } = initialiseEngine<Prioqueue>(
    "#prioqueuesContainer",
    PRIOQUEUE_CLASSES
);

if (!isBaseEngine) {
    engine.algorithmControls = new PrioQueueAlgorithmControl(
        engine.container,
        engine
    );
}
