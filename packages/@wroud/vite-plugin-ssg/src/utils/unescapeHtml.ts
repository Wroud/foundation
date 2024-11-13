export function unescapeHtml<T extends string | null | undefined>(html: T): T {
  if (typeof html === "string") {
    return html.replaceAll(/&#([0-9]{1,3});/gi, function (match, numStr) {
      var num = parseInt(numStr, 10);
      return String.fromCharCode(num);
    }) as T;
  }

  return html;
}
