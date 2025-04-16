
import { TextEncoder, TextDecoder} from "util";
global.TextEncoder = TextEncoder;
//@ts-expect-error I cant get it to work otherwise
global.TextDecoder = TextDecoder;
import {JSDOM} from "jsdom";
import {initialiseEngine, querySelector} from "../src/helpers"
//import { Engine } from "../src/engine";
import { SelectionSort } from "../src/sorting/SelectionSort";
// import { InsertionSort } from "../src//sorting/InsertionSort";
// import { MergeSort } from "../src//sorting/MergeSort";
// import { QuickSort } from "../src//sorting/QuickSort";


test("Can insert into array", async() => {
    // const SORTING_CLASSES = {
    //     SelectionSort: SelectionSort,
    //     InsertionSort: InsertionSort,
    //     MergeSort: MergeSort,
    //     QuickSort: QuickSort,
    // } as const;

    let dom = await JSDOM.fromFile("public/sorting.html", { runScripts: "dangerously" });
    document.body.innerHTML = dom.window.document.body.innerHTML

    console.log(dom.window.document)

    const input = querySelector("#sortingContainer", document.documentElement)
    
    //console.log(input?.innerHTML)
    //if(input == null){throw new Error("Algorithm selector element is null")};
    //input.textContent = "Selection sort"

    const engine = new SelectionSort("#sortingContainer")
    engine.initialise()
    console.log(engine);

});