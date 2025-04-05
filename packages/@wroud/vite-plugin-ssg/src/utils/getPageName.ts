export function getPageName(id: string) {
  return id.replace(/^\//, "").replace(/\/$/, "/index");
}
