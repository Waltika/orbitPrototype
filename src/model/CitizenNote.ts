export class CitizenNote {
    constructor(reference: string, note: string) {
        this._reference = reference;
        this._note = note;
    }

    get reference() {
        return this._reference;
    }

    get note() {
        return this._note;
    }

    private _reference: string;
    private _note: string;
}