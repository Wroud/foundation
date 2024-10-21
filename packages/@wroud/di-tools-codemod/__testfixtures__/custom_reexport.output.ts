import { injectable } from "@custom/di";

@injectable(() => [GraphQLService, SessionDataResource, SessionPermissionsResource])
export class AuthConfigurationParametersResource {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
  ) {}
}
