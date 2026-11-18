export interface IResponseMetadata {
  status?: number;
  headers?: Record<string, string | string[]>;
}

export interface IRscResponseMetadata extends IResponseMetadata {
  href?: string;
}
