export function isVirtualHtmlEntry(id: string) {
  return id.endsWith("-ssg-virtual.html");
}

export function createVirtualHtmlEntry(url: string) {
  return `${url}-ssg-virtual.html`;
}

export function removeVirtualHtmlEntry(id: string) {
  return id.replace("-ssg-virtual.html", "");
}
