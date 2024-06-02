import { ServiceLifetime, } from "./IServiceDescriptor.js";
import { IServiceProvider } from "./IServiceProvider.js";
import { ServiceCollection } from "./ServiceCollection.js";
import { ServiceRegistry } from "./ServicesRegistry.js";
import { getNameOfServiceType } from "./getNameOfServiceType.js";
export class ServiceProvider {
    collection;
    parent;
    instances;
    constructor(collection, parent) {
        this.collection = collection;
        this.parent = parent;
        this.instances = new Map();
        this.addInstance(IServiceProvider, collection.getDescriptors(IServiceProvider)[0], this);
    }
    getServices(service) {
        const services = [];
        for (const descriptor of this.collection.getDescriptors(service)) {
            services.push(this.createInstanceFromDescriptor(service, descriptor));
        }
        return services;
    }
    getService(service) {
        const descriptors = this.collection.getDescriptors(service);
        if (descriptors.length === 0) {
            let name = getNameOfServiceType(service);
            const metadata = ServiceRegistry.get(service);
            if (metadata?.name) {
                name = metadata.name;
            }
            throw new Error(`No service of type "${name}" is registered`);
        }
        return this.createInstanceFromDescriptor(service, descriptors[descriptors.length - 1]);
    }
    createScope() {
        const serviceProvider = new ServiceProvider(this.collection, this);
        return {
            serviceProvider,
            [Symbol.dispose]: () => {
                serviceProvider[Symbol.dispose]();
            },
        };
    }
    createAsyncScope() {
        const serviceProvider = new ServiceProvider(this.collection, this);
        return {
            serviceProvider,
            [Symbol.asyncDispose]: async () => {
                await serviceProvider[Symbol.asyncDispose]();
            },
        };
    }
    createInstanceFromDescriptor(service, descriptor) {
        const initialize = () => {
            try {
                const metadata = ServiceRegistry.get(descriptor.implementation);
                if (metadata) {
                    const dependencies = metadata.dependencies.map((dependency) => {
                        if (Array.isArray(dependency)) {
                            return this.getServices(dependency[0]);
                        }
                        return this.getService(dependency);
                    });
                    return new descriptor.implementation(...dependencies);
                }
                if (typeof descriptor.implementation === "function") {
                    try {
                        return descriptor.implementation(this);
                    }
                    catch (err) {
                        if (err instanceof TypeError &&
                            err.message.includes("cannot be invoked without 'new'")) {
                            throw new Error(`Class "${descriptor.implementation.name}" not registered as service (please use @injectable or ServiceRegistry)`, { cause: err });
                        }
                        else {
                            throw err;
                        }
                    }
                }
                return descriptor.implementation;
            }
            catch (err) {
                throw new Error(`Failed to initiate service "${getNameOfServiceType(service)}":\n\r${err.message}`, { cause: err });
            }
        };
        switch (descriptor.lifetime) {
            case ServiceLifetime.Singleton:
                if (this.parent) {
                    return this.parent.getService(service);
                }
                else if (!this.hasInstanceOf(service, descriptor)) {
                    this.addInstance(service, descriptor, initialize());
                }
                return this.getInstanceInfo(service, descriptor)?.instance;
            case ServiceLifetime.Scoped:
                if (!this.parent) {
                    throw new Error("Scoped services require a service scope.");
                }
                if (!this.hasInstanceOf(service, descriptor)) {
                    this.addInstance(service, descriptor, initialize());
                }
                return this.getInstanceInfo(service, descriptor)?.instance;
            case ServiceLifetime.Transient:
                return initialize();
            default:
                throw new Error("Invalid lifetime");
        }
    }
    hasInstanceOf(service, descriptor) {
        for (const instance of this.instances.get(service) ?? []) {
            if (instance.descriptor === descriptor) {
                return true;
            }
        }
        return false;
    }
    getInstanceInfo(service, descriptor) {
        const instances = this.instances.get(service) ?? [];
        return instances.find((instance) => instance.descriptor === descriptor);
    }
    addInstance(service, descriptor, instance) {
        const instances = this.instances.get(service) || [];
        this.instances.set(service, [...instances, { descriptor, instance }]);
    }
    [Symbol.dispose]() {
        for (const instances of this.instances.values()) {
            for (const instanceInfo of instances) {
                if (instanceInfo.instance === this) {
                    continue;
                }
                if (typeof instanceInfo.instance[Symbol.dispose] === "function") {
                    instanceInfo.instance[Symbol.dispose]();
                }
            }
        }
        this.instances.clear();
    }
    async [Symbol.asyncDispose]() {
        await Promise.all(Array.from(this.instances.values()).map((instances) => Promise.all(instances.map((instanceInfo) => {
            if (instanceInfo.instance === this) {
                return Promise.resolve();
            }
            return typeof instanceInfo.instance[Symbol.asyncDispose] ===
                "function"
                ? instanceInfo.instance[Symbol.asyncDispose]()
                : Promise.resolve();
        }))));
        this.instances.clear();
    }
}
//# sourceMappingURL=ServiceProvider.js.map