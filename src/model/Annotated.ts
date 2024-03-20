export class Annotated {
    private url: URL;

    constructor(url: URL) {
        this.url = url;
    }

    group(): string {
        return this.url.origin;
    }

    key(): string {
        return this.url.pathname;
    }
}