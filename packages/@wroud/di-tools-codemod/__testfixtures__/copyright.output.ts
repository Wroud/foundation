import { injectable } from "@wroud/di";
import { GraphQLService } from "./GraphQLService.js";

@injectable(() => [GraphQLService, SessionDataResource, SessionPermissionsResource])
export class AuthConfigurationParametersResource {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
  ) {}
}
