import { injectable } from "inversify";
import { GraphQLService } from "./GraphQLService.js";

@injectable()
export class AuthConfigurationParametersResource {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
  ) {}
}
