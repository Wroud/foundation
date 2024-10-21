import { ModuleRegistry } from "@wroud/di";
import { AuthConfigurationParametersResource } from "./esm.js";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(AuthConfigurationParametersResource);
    }
});