import type { all } from "../service-type-resolvers/all.js";
import type { optional } from "../service-type-resolvers/optional.js";
import type { single } from "../service-type-resolvers/single.js";

export interface IBaseServiceResolutions {
  all: typeof all;
  optional: typeof optional;
  single: typeof single;
}
