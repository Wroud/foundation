import { ServiceRegistry } from "./ServicesRegistry.js";
export function injectable(dependencies = () => []) {
    return (target, context) => {
        let name = target.name;
        // context is undefined for legacy decorators (stage 2)
        if (context !== undefined) {
            name = context.name ?? name;
        }
        Object.defineProperty(target, "name", {
            value: name,
            writable: false,
        });
        ServiceRegistry.register(target, {
            name,
            dependencies: dependencies(),
        });
        return target;
    };
}
//# sourceMappingURL=injectable.js.map