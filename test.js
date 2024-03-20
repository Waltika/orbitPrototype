"use strict";
import { CitizenNotesStore } from "./src/dataAccess/CitizenNotesStore.js";
import { CitizenNote } from "./src/model/CitizenNote.js";
import { Annotated } from "./src/model/Annotated.js";
let store = new CitizenNotesStore();
var exports = {};
async function runner() {
    await store.initialize();
    await store.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/live/2024/03/18/world/israel-hamas-war-gaza-news")), new CitizenNote("1", "This is a note"));
}
runner().then(r => {
    console.log('done');
});
//# sourceMappingURL=test.js.map