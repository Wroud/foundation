import { ModuleRegistry } from "@wroud/di";
import { NotificationService as NotificationService1 } from "./multipleFiles/fixture3";
import { NotificationService } from "./multipleFiles/fixture1";

ModuleRegistry.add({
    name: "di-tools-codemod",

    configure: serviceCollection => {
        serviceCollection.addSingleton(NotificationService).addSingleton(NotificationService1);
    }
});