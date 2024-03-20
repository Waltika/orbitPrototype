import {CitizenNote} from "../model/CitizenNote";
import {CitizenNotesStore} from "../dataAccess/CitizenNotesStore";
import {Annotated} from "../model/Annotated";

class CitizenNoteManager {
    constructor(store: CitizenNotesStore) {
        this.store = store;
    }

    findCitizenNote(annotated: Annotated, note : CitizenNote) {
        return this.store.findCitizenNote(annotated, note);
    }

    addCitizenNote(annotated: Annotated, note: CitizenNote) {
        this.store.addCitizenNote(annotated, note);
    }

    private store: CitizenNotesStore;
}