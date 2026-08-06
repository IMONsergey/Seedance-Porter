import { describe, expect, it } from "vitest";
import { getModel, getRoute } from "../src/models/registry.js";

describe("model registry", () => {
  it("keeps preview 2.5 explicitly non-official on MuAPI", () => {
    const route = getRoute("seedance-2.5-preview", "muapi");
    expect(route.officialApi).toBe(false);
    expect(getModel("seedance-2.5-preview").lifecycle).toBe("preview");
  });

  it("has a direct official BytePlus production route for 2.0", () => {
    const route = getRoute("seedance-2.0", "byteplus");
    expect(route.officialApi).toBe(true);
    expect(route.modelId).toBe("dreamina-seedance-2-0-260128");
  });
});
