import { expect, it } from "@jest/globals";
import { createService } from "./createService.js";
import { describe } from "node:test";
describe("createService", () => {
    it("has name", () => {
        expect(createService("name")).toHaveProperty("name", "name");
    });
    it("new call throws error", () => {
        const service = createService("name");
        expect(() => new service()).toThrowError("service is not a constructor");
    });
    it("call throws error", () => {
        const service = createService("name");
        expect(() => service()).toThrowError("Service type name can't be initiated");
    });
});
//# sourceMappingURL=createService.test.js.map