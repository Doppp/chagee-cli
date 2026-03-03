import assert from "node:assert/strict";
import test from "node:test";

import { formatStoreDisplayName, isStoreClosed } from "../src/lib/store-display.js";

test("isStoreClosed returns false when runningStatusDesc is missing", () => {
  assert.equal(isStoreClosed({ runningStatusDesc: undefined }), false);
});

test("isStoreClosed detects closed status in English", () => {
  assert.equal(isStoreClosed({ runningStatusDesc: "Closed" }), true);
});

test("isStoreClosed detects closed status in Chinese", () => {
  assert.equal(isStoreClosed({ runningStatusDesc: "休息中" }), true);
});

test("formatStoreDisplayName appends CLOSED suffix for closed outlets", () => {
  assert.equal(
    formatStoreDisplayName({ storeName: "Marina Bay Sands", runningStatusDesc: "Closed" }),
    "Marina Bay Sands [CLOSED]"
  );
});

test("formatStoreDisplayName does not double-append CLOSED suffix", () => {
  assert.equal(
    formatStoreDisplayName({
      storeName: "Marina Bay Sands [CLOSED]",
      runningStatusDesc: "Closed"
    }),
    "Marina Bay Sands [CLOSED]"
  );
});
