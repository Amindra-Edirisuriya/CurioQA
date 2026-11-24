// Unit tests for client-side form validation (frontend/src/lib/validation.js).
// Run: npm run test:unit -w frontend
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { slugify, validateLesson, validateLogin, validateSignup } from "../../src/lib/validation.js";

describe("validateSignup (CC = 5)", () => {
  const valid = { name: "Ada", email: "ada@curio.dev", password: "Learner123" };

  test("path 1: all fields valid -> no errors", () => {
    assert.deepEqual(validateSignup(valid), {});
  });

  test("path 2: name shorter than 2 characters (after trimming)", () => {
    assert.equal(validateSignup({ ...valid, name: " A " }).name, "Name must be at least 2 characters");
  });

  test("path 3: invalid email", () => {
    assert.equal(validateSignup({ ...valid, email: "ada@curio" }).email, "Enter a valid email address");
  });

  test("path 4: password shorter than 8", () => {
    assert.equal(validateSignup({ ...valid, password: "abc123" }).password, "Password must be at least 8 characters");
  });

  test("path 5: long password with no number", () => {
    assert.equal(validateSignup({ ...valid, password: "abcdefgh" }).password, "Password must contain a letter and a number");
  });

  test("path 5b: long password with no letter", () => {
    assert.equal(validateSignup({ ...valid, password: "12345678" }).password, "Password must contain a letter and a number");
  });

  test("BVA: password of exactly 7 / 8 characters", () => {
    assert.ok(validateSignup({ ...valid, password: "abcd123" }).password);
    assert.equal(validateSignup({ ...valid, password: "abcd1234" }).password, undefined);
  });

  test("several invalid fields are all reported together", () => {
    assert.deepEqual(Object.keys(validateSignup({ name: "", email: "x", password: "" })).sort(), ["email", "name", "password"]);
  });
});

describe("validateLogin", () => {
  test("valid credentials", () => {
    assert.deepEqual(validateLogin({ email: "a@b.co", password: "x" }), {});
  });

  test("empty password and bad email", () => {
    assert.deepEqual(validateLogin({ email: "nope", password: "" }), {
      email: "Enter a valid email address",
      password: "Password is required",
    });
  });
});

describe("slugify", () => {
  test("lowercases, strips accents and joins words with dashes", () => {
    assert.equal(slugify("  Schrödinger's Équation! "), "schrodinger-s-equation");
  });

  test("handles empty / null input", () => {
    assert.equal(slugify(null), "");
  });

  test("is capped at 60 characters", () => {
    assert.equal(slugify("a".repeat(100)).length, 60);
  });
});

describe("validateLesson", () => {
  const lesson = (overrides = {}) => ({
    title: "Torque", slug: "torque", summary: "", course: "c1", order: "1", xp: "20",
    estimatedMinutes: "5", published: false, questions: [], ...overrides,
  });
  const mcq = (overrides = {}) => ({ type: "mcq", prompt: "Pick", options: ["a", "b"], correctIndex: 0, ...overrides });

  test("a valid draft has no errors", () => {
    assert.deepEqual(validateLesson(lesson()), {});
  });

  test("title shorter than 3 and longer than 80", () => {
    assert.match(validateLesson(lesson({ title: "ab" })).title, /at least 3/);
    assert.match(validateLesson(lesson({ title: "x".repeat(81) })).title, /80 characters/);
  });

  test("bad slug, long summary and missing course", () => {
    const errors = validateLesson(lesson({ slug: "Bad Slug", summary: "s".repeat(241), course: "" }));
    assert.ok(errors.slug && errors.summary && errors.course);
  });

  test("BVA on XP: 4 and 101 rejected, 5 and 100 accepted, decimals and empty rejected", () => {
    for (const xp of ["4", "101", "20.5", ""]) assert.ok(validateLesson(lesson({ xp })).xp, `xp=${xp}`);
    for (const xp of ["5", "100"]) assert.equal(validateLesson(lesson({ xp })).xp, undefined, `xp=${xp}`);
  });

  test("order and minutes out of range", () => {
    const errors = validateLesson(lesson({ order: "0", estimatedMinutes: "61" }));
    assert.ok(errors.order && errors.estimatedMinutes);
  });

  test("publishing without questions is rejected", () => {
    assert.equal(validateLesson(lesson({ published: true })).questions, "Add at least one question before publishing");
  });

  test("mcq: empty prompt, empty option and correctIndex out of range", () => {
    const errors = validateLesson(lesson({ questions: [mcq({ prompt: " ", options: ["a", ""], correctIndex: 5 })] }));
    assert.ok(errors["questions.0.prompt"]);
    assert.ok(errors["questions.0.options"]);
    assert.ok(errors["questions.0.correctIndex"]);
  });

  test("mcq: missing correctIndex", () => {
    assert.ok(validateLesson(lesson({ questions: [mcq({ correctIndex: null })] }))["questions.0.correctIndex"]);
  });

  test("numeric: empty or non-number answer rejected, 0 accepted", () => {
    const numeric = (answer) => ({ type: "numeric", prompt: "2+2", answer });
    assert.ok(validateLesson(lesson({ questions: [numeric("")] }))["questions.0.answer"]);
    assert.ok(validateLesson(lesson({ questions: [numeric("four")] }))["questions.0.answer"]);
    assert.equal(validateLesson(lesson({ questions: [numeric("0")] }))["questions.0.answer"], undefined);
  });

  test("interactive and lab questions only need a prompt", () => {
    const errors = validateLesson(lesson({ questions: [{ type: "interactive", prompt: "Explore" }, { type: "lab", prompt: "" }] }));
    assert.deepEqual(Object.keys(errors), ["questions.1.prompt"]);
  });

  test("order: fewer than 2 steps rejected, error key uses the question index", () => {
    const order = { type: "order", prompt: "Sort", items: ["only one"] };
    const errors = validateLesson(lesson({ questions: [mcq(), order] }));
    assert.ok(errors["questions.1.items"]);
    assert.equal(errors["questions.0.options"], undefined);
  });

  test("order: two filled steps are accepted", () => {
    const order = { type: "order", prompt: "Sort", items: ["first", "second"] };
    assert.deepEqual(validateLesson(lesson({ questions: [order] })), {});
  });
});
