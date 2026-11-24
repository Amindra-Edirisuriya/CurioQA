// TDD: these tests were written BEFORE src/services/scoring.js existed.
// Requirement: turn a finished lesson run into its score, using the same
// rules as recordCompletion (10 XP per correct answer, +10 for a perfect run).
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { scoreRun } from "../../src/services/scoring.js";

describe("scoreRun", () => {
  test("perfect run earns 10 XP per answer plus a 10 XP bonus", () => {
    assert.deepEqual(scoreRun({ total: 4, correctCount: 4 }), {
      correct: 4, wrong: 0, perfect: true, accuracy: 100, xpAwarded: 50,
    });
  });

  test("partial run: no bonus, accuracy rounded to a whole percent", () => {
    assert.deepEqual(scoreRun({ total: 3, correctCount: 2 }), {
      correct: 2, wrong: 1, perfect: false, accuracy: 67, xpAwarded: 20,
    });
  });

  test("zero correct earns nothing", () => {
    const score = scoreRun({ total: 5, correctCount: 0 });
    assert.equal(score.xpAwarded, 0);
    assert.equal(score.wrong, 5);
  });

  test("correctCount above the total is capped", () => {
    assert.equal(scoreRun({ total: 2, correctCount: 9 }).correct, 2);
  });

  test("negative correctCount is treated as 0", () => {
    assert.equal(scoreRun({ total: 2, correctCount: -3 }).correct, 0);
  });

  test("a lesson with no questions never produces NaN and is not 'perfect'", () => {
    const score = scoreRun({ total: 0, correctCount: 0 });
    assert.equal(score.accuracy, 0);
    assert.equal(score.perfect, false);
    assert.equal(score.xpAwarded, 0);
  });
});
