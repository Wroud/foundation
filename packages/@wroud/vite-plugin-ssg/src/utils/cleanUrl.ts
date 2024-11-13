const postfixRE = /[?#].*$/;
export function cleanUrl<T extends string | null | undefined>(url: T): T {
  if (typeof url === "string") {
    return url.replace(postfixRE, "") as T;
  }
  return url;
}
