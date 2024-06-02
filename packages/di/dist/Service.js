export class Service {
    dispose() { }
    [Symbol.dispose]() {
        return this.dispose();
    }
    [Symbol.asyncDispose]() {
        return this.dispose();
    }
}
//# sourceMappingURL=Service.js.map