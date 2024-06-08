import { ServiceContainerBuilder, injectable } from "@wroud/di";

// Define a service
@injectable()
class Logger {
  log(message: string) {
    console.log(message);
  }
}

// Define another service that depends on Logger
@injectable(() => [Logger])
class UserService {
  constructor(private logger: Logger) {
    this.logger = logger;
  }

  createUser(user: { name: string }) {
    this.logger.log(`Creating user: ${user.name}`);
    // User creation logic
  }
}

// Build the service container
const containerBuilder = new ServiceContainerBuilder();
containerBuilder.addSingleton(Logger);
containerBuilder.addTransient(UserService);
const serviceProvider = containerBuilder.build();

// Resolve and use the UserService
const userService = serviceProvider.getService(UserService);
userService.createUser({ name: "John Doe" });
