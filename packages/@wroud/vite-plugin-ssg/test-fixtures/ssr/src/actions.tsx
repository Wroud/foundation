"use server";

import { addToTotal } from "./counter-store.js";

export async function addAction(formData: FormData): Promise<void> {
  const amount = Number(formData.get("amount") ?? 0);
  addToTotal(Number.isFinite(amount) ? amount : 0);
}

export async function addAndReport(amount: number): Promise<number> {
  return addToTotal(Number.isFinite(amount) ? amount : 0);
}

export async function addObject(input: { amount: number }): Promise<number> {
  return addToTotal(Number.isFinite(input.amount) ? input.amount : 0);
}

export async function failAction(): Promise<never> {
  throw new Error("server-function-boom");
}
