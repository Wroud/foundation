import { injectable } from "@custom/di";

@injectable()
export class AuthConfigurationParametersResource {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
  ) {}
}
