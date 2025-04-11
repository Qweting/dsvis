
import { TextEncoder, TextDecoder} from "util";
global.TextEncoder = TextEncoder;
//@ts-expect-error I cant get it to work otherwise
global.TextDecoder = TextDecoder;
import {JSDOM} from "jsdom";

test("Can insert into array", async() => {
    let dom = await JSDOM.fromFile("../public/index.html", { runScripts: "dangerously" });
    let document = dom.window.document;

    console.log(document);

});