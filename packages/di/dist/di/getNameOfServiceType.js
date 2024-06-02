export function getNameOfServiceType(service) {
    return (typeof service === "object" || typeof service === "function") &&
        service &&
        "name" in service
        ? service.name
        : String(service);
}
//# sourceMappingURL=getNameOfServiceType.js.map