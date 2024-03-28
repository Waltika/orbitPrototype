import {CitizenNote} from "../model/CitizenNote";
import {CitizenNotesStore} from "../dataAccess/CitizenNotesStore";
import {Annotated} from "../model/Annotated";

export class CitizenNoteManager {
    private active: boolean = true;

    constructor(store: CitizenNotesStore) {
        this.store = store;
    }

    async findCitizenNote(annotated: Annotated): Promise<CitizenNote | null> {
        if (this.active) {
            return this.store.findCitizenNote(annotated);
        } else {
            return null;
        }
    }

    async addCitizenNote(annotated: Annotated, note: CitizenNote) {
        if (this.active) {
            await this.store.addCitizenNote(annotated, note);
        }
    }

    private store: CitizenNotesStore;

    public suspendFunction() {
        console.log('Suspending CitizenNotesManager');
        this.active = false;
    }

    async logContent() {
        console.log('Logging full Content....')
        this.store.disableLoggingOnEvent();
        await this.store.logContent();
    }

    async clearAll() {
        if (this.active) {
            await this.store.clearAll();
        }
    }

    async stop() {
        console.log("Stopping CitizenNotesManager");
        await this.store.stop();
    }
}