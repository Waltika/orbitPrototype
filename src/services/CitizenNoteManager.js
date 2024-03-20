export class CitizenNoteManager {
    constructor(store) {
        this.store = store;
    }
    async findCitizenNote(annotated, note) {
        return this.store.findCitizenNote(annotated, note);
    }
    async addCitizenNote(annotated, note) {
        await this.store.addCitizenNote(annotated, note);
    }
    store;
    async logContent() {
        await this.store.logContent();
    }
}
//# sourceMappingURL=CitizenNoteManager.js.map