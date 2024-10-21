import { ModuleRegistry } from "@wroud/di";
import { NotificationService } from "./multipleFiles/fixture1";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(NotificationService);
    }
});