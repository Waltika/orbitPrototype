import {CitizenNote} from "../model/CitizenNote";
import {CitizenNotesStore} from "../dataAccess/CitizenNotesStore";
import {Annotated} from "../model/Annotated";

export class CitizenNoteManager {
    constructor(store: CitizenNotesStore) {
        this.store = store;
    }

    async findCitizenNote(annotated: Annotated): Promise<CitizenNote | null> {
        return this.store.findCitizenNote(annotated);
    }

    async addCitizenNote(annotated: Annotated, note: CitizenNote) {
        await this.store.addCitizenNote(annotated, note);
    }

    private store: CitizenNotesStore;

    async logContent() {
        await this.store.logContent();
    }
}