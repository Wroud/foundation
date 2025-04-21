import type { IDescribe } from "./IDescribe.js";

let currentDescribe: IDescribe = {
  id: "/",
  name: "",
  parent: null,
};

export function getDescribe(): IDescribe {
  return currentDescribe;
}

export function describe(name: string, callback: () => void) {
  const prevDescribe = currentDescribe;
  currentDescribe = joinDescribe(name, getDescribe());
  callback();
  currentDescribe = prevDescribe;
}

function joinDescribe(describe: string, parent: IDescribe) {
  let parts = describe.split("/").filter(Boolean);

  if (parts.length === 0) {
    return parent;
  }

  const path = parts.slice(0, -1);
  const name = parts[parts.length - 1]!;

  for (let part of path) {
    parent = joinDescribe(part, parent);
  }

  return {
    id: parent.id === "/" ? parent.id + name : `${parent.id}/${name}`,
    parent,
    name,
  };
}
