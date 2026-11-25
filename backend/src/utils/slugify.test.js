import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "../src/utils/slugify.js";

test("slugify converts a title to a lowercase URL slug", () => {
  assert.equal(slugify("Torque & Levers"), "torque-levers");
});