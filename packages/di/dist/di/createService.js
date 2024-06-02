export function createService(name) {
    const obj = {
        [name]() {
            throw new Error(`Service type ${name} can't be initiated`);
        },
    };
    return obj[name];
}
//# sourceMappingURL=createService.js.map