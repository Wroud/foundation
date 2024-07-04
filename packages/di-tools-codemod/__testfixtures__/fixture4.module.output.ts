import { ModuleRegistry } from "@wroud/di";
import { AuthConfigurationParametersResource } from "./fixture4";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(AuthConfigurationParametersResource);
    }
});