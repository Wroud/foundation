import type { App } from "@cloudbeaver/core-di";
import { FormState } from "@cloudbeaver/core-ui";

import type {
  IUserProfileFormState,
  UserProfileFormService,
} from "./UserProfileFormService";

export class UserProfileFormState extends FormState<IUserProfileFormState> {
  constructor(
    app: App,
    service: UserProfileFormService,
    config: IUserProfileFormState,
  ) {
    super(app, service, config);
  }
}
