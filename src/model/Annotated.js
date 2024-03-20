export class Annotated {
    url;
    constructor(url) {
        this.url = url;
    }
    group() {
        return this.url.origin;
    }
    key() {
        return this.url.pathname;
    }
}
//# sourceMappingURL=Annotated.js.map