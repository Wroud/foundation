let total = 0;

export function getTotal(): number {
  return total;
}

export function addToTotal(amount: number): number {
  total += amount;
  return total;
}
