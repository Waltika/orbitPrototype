export class CitizenNoteManager {
    constructor(store) {
        this.store = store;
    }
    async findCitizenNote(annotated) {
        return this.store.findCitizenNote(annotated);
    }
    async addCitizenNote(annotated, note) {
        await this.store.addCitizenNote(annotated, note);
    }
    store;
    async logContent() {
        await this.store.logContent();
    }
    async clearAll() {
        await this.store.clearAll();
    }
    async stop() {
        console.log("Stopping CitizenNotesManager");
        await this.store.stop();
    }
}
//# sourceMappingURL=CitizenNoteManager.js.map