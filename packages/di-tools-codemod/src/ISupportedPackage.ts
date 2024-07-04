export interface ISupportedPackage {
  name: string;
  replace: string;
  injectableDecorator?: string;
  injectDecorator?: string;
  multiInjectDecorator?: string;
}
