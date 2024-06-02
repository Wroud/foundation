export class ModuleRegistry {
    static modules = [];
    static listeners = [];
    static register(module) {
        if (this.modules.some((m) => m.name === module.name)) {
            throw new Error(`Module ${module.name} is already registered.`);
        }
        this.modules.push(module);
        this.listeners.forEach((listener) => listener(module));
    }
    static getModules() {
        return this.modules;
    }
    static addListener(listener) {
        this.listeners.push(listener);
    }
}
//# sourceMappingURL=ModuleRegistry.js.map