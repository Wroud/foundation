import { ServiceLifetime, } from "./IServiceDescriptor.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceRegistry } from "./ServicesRegistry.js";
export class ServiceCollection {
    collection;
    constructor() {
        this.collection = new Map();
        this.addSingleton(IServiceProvider, () => undefined);
    }
    [Symbol.iterator]() {
        const collection = this.collection;
        return (function* iterator() {
            for (const descriptors of collection.values()) {
                for (const descriptor of descriptors) {
                    yield descriptor;
                }
            }
        })();
    }
    getDescriptors(service) {
        return this.collection.get(service) ?? [];
    }
    addScoped(service, implementation = service) {
        this.addService(ServiceLifetime.Scoped, service, implementation);
        return this;
    }
    addTransient(service, implementation = service) {
        this.addService(ServiceLifetime.Transient, service, implementation);
        return this;
    }
    addSingleton(service, implementation = service) {
        this.addService(ServiceLifetime.Singleton, service, implementation);
        return this;
    }
    addService(lifetime, service, implementation) {
        const descriptors = this.collection.get(service) ?? [];
        this.collection.set(service, [
            ...descriptors,
            {
                service,
                lifetime,
                implementation,
            },
        ]);
        this.tryResolveService(service, []);
        return this;
    }
    // we will try to determine cyclic dependencies
    tryResolveService(service, path) {
        const descriptors = this.getDescriptors(service);
        for (const descriptor of descriptors) {
            const metadata = ServiceRegistry.get(descriptor.implementation);
            if (metadata) {
                if (path.includes(metadata.name)) {
                    throw new Error(`Cyclic dependency detected: ${path.join(" -> ")} -> ${descriptor.service.name}`);
                }
                path = [...path, descriptor.service.name];
                if (descriptor.service.name !== metadata.name) {
                    path = [...path, metadata.name];
                }
                for (const dependency of metadata.dependencies) {
                    const service = Array.isArray(dependency)
                        ? dependency[0]
                        : dependency;
                    this.tryResolveService(service, path);
                }
            }
        }
    }
}
//# sourceMappingURL=ServiceCollection.js.map