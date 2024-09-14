import { vi } from "vitest";

vi.mock(import("execa"), () => ({
  execa: vi.fn(),
}));
