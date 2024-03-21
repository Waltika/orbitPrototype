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
    // insert a second time to see what happens.
    await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/live/2024/03/18/world/israel-hamas-war-gaza-news?usename='Waltika'")), new CitizenNote("1", "This is a note (again)"));
    await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/2024/03/21/world/americas/mexico-timeshare-fraud-cartel.html")), new CitizenNote("2", "This is another note"));
    await manager.addCitizenNote(new Annotated(new URL("https://www.rollingstone.com/politics/politics-features/election-deniers-refuse-certify-chaos-2024-1234988747/")), new CitizenNote("3", "This is a third note"));
    await manager.logContent();
}
runner().then(r => {
    console.log('done');
});
//# sourceMappingURL=noteCreator.js.map