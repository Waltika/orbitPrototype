"use strict";
import { CitizenNotesStore } from "./src/dataAccess/CitizenNotesStore.js";
import { CitizenNote } from "./src/model/CitizenNote.js";
import { Annotated } from "./src/model/Annotated.js";
import { CitizenNoteManager } from "./src/services/CitizenNoteManager.js";
let store = new CitizenNotesStore();
var exports = {};
async function runner() {
    await store.initialize();
    let manager = new CitizenNoteManager(store);
    await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/live/2024/03/18/world/israel-hamas-war-gaza-news?usename='Waltika'")), new CitizenNote("1", "This is a note"));
    await manager.logContent();
}
runner().then(r => {
    console.log('done');
});
//# sourceMappingURL=noteCreator.js.map