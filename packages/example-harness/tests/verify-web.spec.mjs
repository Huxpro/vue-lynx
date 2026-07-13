import { describe, expect, test } from "vitest";

import {
  isActionableRequestFailure,
  selectAllShortcut,
} from "../src/verify-web.mjs";

describe("web verification network failures", () => {
  test("ignores browser-cancelled duplicate requests but keeps real failures", () => {
    expect(isActionableRequestFailure("net::ERR_ABORTED")).toBe(false);
    expect(isActionableRequestFailure("net::ERR_FAILED")).toBe(true);
  });

  test("uses the platform select-all shortcut", () => {
    expect(selectAllShortcut("darwin")).toBe("Meta+A");
    expect(selectAllShortcut("linux")).toBe("Control+A");
    expect(selectAllShortcut("win32")).toBe("Control+A");
  });
});
