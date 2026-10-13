import { useState } from "react";

export function AdminCounter() {
  const [count, setCount] = useState(0);
  return (
    <button data-testid="admin-counter" onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
