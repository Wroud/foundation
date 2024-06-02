export var ServiceLifetime;
(function (ServiceLifetime) {
    ServiceLifetime[ServiceLifetime["Singleton"] = 0] = "Singleton";
    ServiceLifetime[ServiceLifetime["Scoped"] = 1] = "Scoped";
    ServiceLifetime[ServiceLifetime["Transient"] = 2] = "Transient";
})(ServiceLifetime || (ServiceLifetime = {}));
//# sourceMappingURL=IServiceDescriptor.js.map