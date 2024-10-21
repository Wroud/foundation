/*
 * Copyright
 */
import { ModuleRegistry } from "@wroud/di";

import { AuthConfigurationParametersResource } from "./copyright.js";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(AuthConfigurationParametersResource);
    }
});