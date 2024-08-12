import type { SingleServiceType } from "./SingleServiceType.js";

export type ServiceType<T> = SingleServiceType<T> | SingleServiceType<T>[];
