class CitizenNoteManager {
    constructor(store) {
        this.store = store;
    }
    findCitizenNote(annotated, note) {
        return this.store.findCitizenNote(annotated, note);
    }
    addCitizenNote(annotated, note) {
        this.store.addCitizenNote(annotated, note);
    }
    store;
}
export {};
//# sourceMappingURL=CitizenNoteManager.js.map