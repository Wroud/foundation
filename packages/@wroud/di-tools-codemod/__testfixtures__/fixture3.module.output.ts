import { ModuleRegistry } from "@wroud/di";
import { NotificationService } from "./fixture3";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(NotificationService);
    }
});