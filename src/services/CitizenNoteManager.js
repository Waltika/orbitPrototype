export class CitizenNoteManager {
    active = true;
    constructor(store) {
        this.store = store;
    }
    async findCitizenNote(annotated) {
        if (this.active) {
            return this.store.findCitizenNote(annotated);
        }
        else {
            return null;
        }
    }
    async addCitizenNote(annotated, note) {
        if (this.active) {
            await this.store.addCitizenNote(annotated, note);
        }
    }
    store;
    suspendFunction() {
        console.log('Suspending CitizenNotesManager');
        this.active = false;
    }
    async logContent() {
        console.log('Logging full Content....');
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
//# sourceMappingURL=CitizenNoteManager.js.map