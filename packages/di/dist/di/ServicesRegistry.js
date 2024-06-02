export class ServiceRegistry {
    static services = new WeakMap();
    static register(service, metadata) {
        const existing = this.services.get(service);
        if (existing) {
            throw new Error(`Service ${existing.name} is already registered`);
        }
        this.services.set(service, metadata);
    }
    static has(service) {
        return this.services.has(service);
    }
    static get(service) {
        return this.services.get(service);
    }
}
//# sourceMappingURL=ServicesRegistry.js.map