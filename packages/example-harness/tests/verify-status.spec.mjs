import { describe, expect, test } from "vitest";

import { validateStatusRecords } from "../src/verify-status.mjs";

const row = {
  id: "demo/main",
  vapor: { disposition: "supported" },
  verification: {
    sourceHash: "current",
    vdomWeb: "passed",
    vaporWeb: "passed",
    parity: "passed",
  },
};

describe("example verification completion gate", () => {
  test("accepts a current fully verified supported entry", () => {
    expect(validateStatusRecords([row], new Map([[row.id, "current"]]))).toEqual([]);
  });

  test.each([
    ["candidate", { ...row, vapor: { disposition: "candidate" } }],
    ["missing vdom", { ...row, verification: { ...row.verification, vdomWeb: undefined } }],
    ["missing vapor", { ...row, verification: { ...row.verification, vaporWeb: undefined } }],
    ["failed parity", { ...row, verification: { ...row.verification, parity: "failed" } }],
    ["stale hash", row],
  ])("rejects %s", (_label, invalid) => {
    const hashes = new Map([[row.id, _label === "stale hash" ? "new" : "current"]]);
    expect(validateStatusRecords([invalid], hashes)).not.toEqual([]);
  });
});
