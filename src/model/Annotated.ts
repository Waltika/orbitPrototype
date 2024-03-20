export class Annotated {
    private url: URL;

    constructor(url: URL) {
        this.url = url;
    }

    key(): string {
        return "todo";
    }
}