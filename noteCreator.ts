"use strict";
import {CitizenNotesStore} from "./src/dataAccess/CitizenNotesStore.js";
import {CitizenNote} from "./src/model/CitizenNote.js";
import {Annotated} from "./src/model/Annotated.js";
import {CitizenNoteManager} from "./src/services/CitizenNoteManager.js";

let store = new CitizenNotesStore('/orbitdb/zdpuAqTHc7Rk77vumfajL94udky9qKdS1kUdT7umGKBj1Famc');

let noteID: number = 1;

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function runner() {
    let running: boolean = true;
    let manager = new CitizenNoteManager(store);

    console.log('Registering SIGINT handler');
    process.on("SIGINT", async () => {
        if (running) {
            running = false;
            manager.suspendFunction();
            await manager.logContent();
            console.log("SIGINT received");
            await manager.stop();
        }
    });
    await store.initialize(process.argv[2]);
    if (process.argv[2] === '0') {
        await manager.clearAll();
        await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/live/2024/03/18/world/israel-hamas-war-gaza-news?usename='Waltika'")), new CitizenNote((noteID++).toString(), "This is a note"));
        // insert a second time to see what happens.
        await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/live/2024/03/18/world/israel-hamas-war-gaza-news?usename='Waltika'")), new CitizenNote((noteID).toString(), "This is a note (again)"));
        await manager.addCitizenNote(new Annotated(new URL("https://www.nytimes.com/2024/03/21/world/americas/mexico-timeshare-fraud-cartel.html")), new CitizenNote((noteID++).toString(), "This is another note"));
        await manager.addCitizenNote(new Annotated(new URL("https://www.rollingstone.com/politics/politics-features/election-deniers-refuse-certify-chaos-2024-1234988747/")), new CitizenNote((noteID++).toString(), "This is a third note"));
        await manager.addCitizenNote(new Annotated(new URL("https://www.rollingstone.com/politics/politics-features/election-deniers-refuse-certify-chaos-2024-1234988747/")), new CitizenNote((noteID++).toString(), "This is a fourth note"));
        await manager.addCitizenNote(new Annotated(new URL("https://www.rollingstone.com/politics/politics-features/election-deniers-refuse-certify-chaos-2024-1234988747/")), new CitizenNote((noteID++).toString(), "This is a fifth note"));
    }
    await manager.logContent();
    while (running) {
        if (process.argv[2] === '0') {
            await manager.addCitizenNote(new Annotated(new URL(`https://www.${noteID}.com/article/${noteID}`)), new CitizenNote((noteID).toString(), `This is the ${noteID++} note`));
        }
        await sleep(5000);
    }
}

runner().then(r => {
        console.log('done');
    }
)