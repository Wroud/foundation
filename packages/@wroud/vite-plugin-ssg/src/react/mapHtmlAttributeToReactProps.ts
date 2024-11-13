import parseStyles from "style-to-object";
import * as changeCase from "change-case";

export function mapHtmlAttributeToReactProps(
  attributes?: Record<string, any>,
): Record<string, any> | undefined {
  if (!attributes) {
    return attributes;
  }
  const props: Record<string, any> = {};
  for (const key in attributes) {
    const value = attributes[key];
    switch (key) {
      case "class":
        props["className"] = value;
        break;
      case "for":
        props["htmlFor"] = value;
        break;
      case "style":
        props["style"] = parseStyles(value);
        break;
      default:
        props[changeCase.camelCase(key)] = value;
    }
  }
  return props;
}
