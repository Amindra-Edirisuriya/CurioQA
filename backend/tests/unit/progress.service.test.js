// Unit tests for lesson completion and the course path
// (backend/src/services/progress.service.js).
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { fakeAttemptModel, makeLesson, makeUser, mockModels, oid } from "./helpers.js";

mockModels();
const { buildPath, recordCompletion } = await import("../../src/services/progress.service.js");

const lessonDoc = (slug, { published = true } = {}) => ({
  _id: oid(`id-${slug}`), slug, title: slug, xp: 20, difficulty: "beginner", estimatedMinutes: 5, published,
});

describe("buildPath (CC = 4)", () => {
  const lessons = [lessonDoc("a"), lessonDoc("b"), lessonDoc("c"), lessonDoc("draft", { published: false })];

  test("new learner: first lesson active, the rest locked, draft flagged", () => {
    const path = buildPath(lessons, new Set());
    assert.deepEqual(path.map((n) => n.status), ["active", "locked", "locked", "locked"]);
    assert.equal(path[3].draft, true);
  });

  test("completed lessons show completed and unlock the next one", () => {
    const path = buildPath(lessons, new Set(["id-a"]));
    assert.deepEqual(path.map((n) => n.status), ["completed", "active", "locked", "locked"]);
  });

  test("all published lessons completed: no active node", () => {
    const path = buildPath(lessons, new Set(["id-a", "id-b", "id-c"]));
    assert.deepEqual(path.map((n) => n.status), ["completed", "completed", "completed", "locked"]);
  });

  test("missing summary and questionCount default safely", () => {
    const [node] = buildPath([lessonDoc("a")], new Set());
    assert.equal(node.summary, "");
    assert.equal(node.questionCount, 0);
  });
});

describe("recordCompletion", () => {
  beforeEach(() => {
    fakeAttemptModel.created = [];
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-24T10:00:00Z") });
  });
  afterEach(() => mock.timers.reset());

  test("perfect first run: XP bonus, gems, badges, no hearts lost", async () => {
    const user = makeUser();
    const { xpAwarded } = await recordCompletion(user, makeLesson(4), { correctCount: 4, timeSeconds: 90 });
    assert.equal(xpAwarded, 4 * 10 + 10);
    assert.equal(user.xp, 50);
    assert.equal(user.gems, 5);
    assert.equal(user.hearts.current, 5);
    assert.equal(user.hearts.nextRefillAt, null);
    assert.equal(user.completedLessons, 1);
    assert.deepEqual(user.badges.map((b) => b.id), ["first-lesson", "perfect"]);
    assert.equal(user.league.weeklyXp, 50);
    assert.equal(fakeAttemptModel.created[0].accuracy, 100);
    assert.equal(user.saved, 1);
  });

  test("partial run: hearts lost, refill timer started, no perfect bonus", async () => {
    const user = makeUser();
    const { xpAwarded } = await recordCompletion(user, makeLesson(4), { correctCount: 2, timeSeconds: 60 });
    assert.equal(xpAwarded, 20);
    assert.equal(user.gems, 0);
    assert.equal(user.hearts.current, 3);
    assert.ok(user.hearts.nextRefillAt instanceof Date);
    assert.equal(fakeAttemptModel.created[0].accuracy, 50);
  });

  test("zero correct: no XP, so the learner does not join the league", async () => {
    const user = makeUser();
    const { xpAwarded } = await recordCompletion(user, makeLesson(3), { correctCount: 0, timeSeconds: 30 });
    assert.equal(xpAwarded, 0);
    assert.equal(user.league.weekId, null);
  });

  test("hearts never go below zero", async () => {
    const user = makeUser({ hearts: { current: 1, nextRefillAt: null } });
    await recordCompletion(user, makeLesson(4), { correctCount: 0, timeSeconds: 30 });
    assert.equal(user.hearts.current, 0);
  });

  test("correctCount larger than the question count is capped", async () => {
    const user = makeUser();
    const { xpAwarded } = await recordCompletion(user, makeLesson(3), { correctCount: 99, timeSeconds: 30 });
    assert.equal(xpAwarded, 40);
  });

  test("replaying a lesson updates best scores and does not count it twice", async () => {
    const progress = { lesson: oid("lesson-1"), status: "completed", attempts: 1, bestAccuracy: 50, bestTimeSeconds: 120 };
    const user = makeUser({ lessonProgress: [progress], completedLessons: 1 });
    await recordCompletion(user, makeLesson(4), { correctCount: 4, timeSeconds: 80 });
    assert.equal(progress.attempts, 2);
    assert.equal(progress.bestAccuracy, 100);
    assert.equal(progress.bestTimeSeconds, 80);
    assert.equal(user.completedLessons, 1);
    assert.ok(!user.badges.some((b) => b.id === "first-lesson"));
  });

  test("a slower replay keeps the old best time", async () => {
    const progress = { lesson: oid("lesson-1"), status: "completed", attempts: 1, bestAccuracy: 100, bestTimeSeconds: 60 };
    const user = makeUser({ lessonProgress: [progress], completedLessons: 1 });
    await recordCompletion(user, makeLesson(2), { correctCount: 2, timeSeconds: 200 });
    assert.equal(progress.bestTimeSeconds, 60);
  });

  test("replay with no earlier best time records the new time", async () => {
    const progress = { lesson: oid("lesson-1"), status: "in-progress", attempts: 0, bestAccuracy: 0, bestTimeSeconds: 0 };
    const user = makeUser({ lessonProgress: [progress] });
    await recordCompletion(user, makeLesson(2), { correctCount: 2, timeSeconds: 45 });
    assert.equal(progress.bestTimeSeconds, 45);
    assert.equal(user.completedLessons, 1); // first *completion*, even though progress existed
  });

  test("replay with a missing time keeps the old best time", async () => {
    const progress = { lesson: oid("lesson-1"), status: "completed", attempts: 1, bestAccuracy: 100, bestTimeSeconds: 60 };
    const user = makeUser({ lessonProgress: [progress], completedLessons: 1 });
    await recordCompletion(user, makeLesson(2), { correctCount: 2, timeSeconds: 0 });
    assert.equal(progress.bestTimeSeconds, 60);
  });

  describe("streak", () => {
    test("activity yesterday continues the streak", async () => {
      const user = makeUser({ streak: { current: 3, longest: 3, lastActivityAt: new Date("2026-11-23T09:00:00Z") } });
      await recordCompletion(user, makeLesson(1), { correctCount: 1, timeSeconds: 10 });
      assert.equal(user.streak.current, 4);
      assert.equal(user.streak.longest, 4);
    });

    test("a second lesson on the same day does not add to the streak", async () => {
      const user = makeUser({ streak: { current: 3, longest: 5, lastActivityAt: new Date("2026-11-24T08:00:00Z") } });
      await recordCompletion(user, makeLesson(1), { correctCount: 1, timeSeconds: 10 });
      assert.equal(user.streak.current, 3);
    });

    test("a gap of several days resets the streak to 1 and keeps the longest", async () => {
      const user = makeUser({ streak: { current: 6, longest: 6, lastActivityAt: new Date("2026-11-20T10:00:00Z") } });
      await recordCompletion(user, makeLesson(1), { correctCount: 1, timeSeconds: 10 });
      assert.equal(user.streak.current, 1);
      assert.equal(user.streak.longest, 6);
    });

    test("first ever activity starts the streak at 1", async () => {
      const user = makeUser();
      await recordCompletion(user, makeLesson(1), { correctCount: 1, timeSeconds: 10 });
      assert.equal(user.streak.current, 1);
    });

    // DEFECT found by white-box path analysis of updateStreak(): the gap is
    // measured in whole 24 h blocks, not calendar days. Last activity Sunday
    // 23:00, next activity Tuesday 00:30 (Monday skipped) gives 25.5 h ->
    // gapDays = 1, so the streak wrongly continues.
    test("a skipped calendar day resets the streak", { todo: "DEF-M2-01: updateStreak uses 24 h blocks instead of calendar days" }, async () => {
      mock.timers.setTime(new Date("2026-11-24T00:30:00Z").getTime());
      const user = makeUser({ streak: { current: 3, longest: 3, lastActivityAt: new Date("2026-11-22T23:00:00Z") } });
      await recordCompletion(user, makeLesson(1), { correctCount: 1, timeSeconds: 10 });
      assert.equal(user.streak.current, 1);
    });
  });
});
