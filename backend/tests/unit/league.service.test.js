// Unit tests for the weekly league rules (backend/src/services/league.service.js).
// White-box: each test targets a specific branch of zonesFor / settleLeague / joinLeague.
import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { fakeUserModel, makeUser, mockModels, oid } from "./helpers.js";

mockModels();
const { TIERS, COHORT_SIZE, weekBounds, zonesFor, leagueView, settleLeague, joinLeague, standingsFor } =
  await import("../../src/services/league.service.js");

const LAST_WEEK = "2026-11-16";
const peer = (id, xp) => ({ _id: oid(id), league: { weekId: LAST_WEEK, weeklyXp: xp } });

describe("weekBounds", () => {
  test("a Wednesday belongs to the week starting the Monday before", () => {
    const { id, endsAt } = weekBounds(new Date("2026-11-25T10:00:00Z"));
    assert.equal(id, "2026-11-23");
    assert.equal(endsAt.toISOString(), "2026-11-30T00:00:00.000Z");
  });

  test("a Sunday still belongs to the previous Monday's week", () => {
    assert.equal(weekBounds(new Date("2026-11-29T23:59:59Z")).id, "2026-11-23");
  });

  test("Monday 00:00 UTC starts a new week", () => {
    assert.equal(weekBounds(new Date("2026-11-30T00:00:00Z")).id, "2026-11-30");
  });
});

describe("zonesFor (CC = 3)", () => {
  test("path 1: middle tier, full cohort -> promote 7, demote 5", () => {
    assert.deepEqual(zonesFor(3, 30), { promote: 7, demote: 5 });
  });

  test("path 2: top tier never promotes", () => {
    assert.deepEqual(zonesFor(TIERS.length - 1, 30), { promote: 0, demote: 5 });
  });

  test("path 3: bottom tier never demotes", () => {
    assert.deepEqual(zonesFor(0, 30), { promote: 7, demote: 0 });
  });

  test("boundary: cohort of 12 (= 7 + 5) skips demotion, 13 does not", () => {
    assert.equal(zonesFor(3, 12).demote, 0);
    assert.equal(zonesFor(3, 13).demote, 5);
  });
});

describe("leagueView", () => {
  test("clamps an out-of-range tier and shows 0 points when not joined", () => {
    const view = leagueView(makeUser({ league: { tier: 99, weekId: "1999-01-04", weeklyXp: 50 } }));
    assert.equal(view.tier, TIERS.length - 1);
    assert.equal(view.joined, false);
    assert.equal(view.points, 0);
  });

  test("defaults to Bronze when the user has no league yet", () => {
    const view = leagueView(makeUser({ league: undefined }));
    assert.equal(view.id, "bronze");
  });

  test("shows weekly XP when joined this week", () => {
    const view = leagueView(makeUser({ league: { tier: 2, weekId: weekBounds().id, weeklyXp: 40 } }));
    assert.equal(view.joined, true);
    assert.equal(view.points, 40);
  });
});

describe("settleLeague", () => {
  beforeEach(() => { fakeUserModel.peers = []; });

  test("does nothing when the user never joined a week", async () => {
    assert.equal(await settleLeague(makeUser()), false);
  });

  test("does nothing while the current week is still running", async () => {
    const user = makeUser({ league: { tier: 1, weekId: weekBounds().id, cohort: 0, weeklyXp: 30 } });
    assert.equal(await settleLeague(user), false);
    assert.equal(user.league.tier, 1);
  });

  test("top-7 finisher with XP is promoted", async () => {
    fakeUserModel.peers = [peer("user-1", 100), ...Array.from({ length: 19 }, (_, i) => peer(`p${i}`, 10))];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 100 } });
    assert.equal(await settleLeague(user), true);
    assert.equal(user.league.lastResult.outcome, "promoted");
    assert.equal(user.league.tier, 3);
    assert.equal(user.league.weekId, null);
    assert.equal(user.league.weeklyXp, 0);
  });

  test("bottom-5 finisher in a large cohort is demoted", async () => {
    fakeUserModel.peers = [...Array.from({ length: 19 }, (_, i) => peer(`p${i}`, 50)), peer("user-1", 1)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 1 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.outcome, "demoted");
    assert.equal(user.league.tier, 1);
  });

  test("a middle finisher stays in the same tier", async () => {
    const others = Array.from({ length: 19 }, (_, i) => peer(`p${i}`, 100 - i));
    fakeUserModel.peers = [...others.slice(0, 9), peer("user-1", 90.5), ...others.slice(9)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 90.5 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.rank, 11); // between promote (1-7) and demote (16-20)
    assert.equal(user.league.lastResult.outcome, "stayed");
    assert.equal(user.league.tier, 2);
  });

  test("rank 1 with 0 XP is NOT promoted (weeklyXp > 0 condition)", async () => {
    fakeUserModel.peers = [peer("user-1", 0)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 0 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.outcome, "stayed");
  });

  test("ties are broken by id so ranking is deterministic", async () => {
    fakeUserModel.peers = [peer("zzz", 10), peer("user-1", 10)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 10 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.rank, 1);
  });

  test("uses a peer's lastWeek snapshot if that peer already settled", async () => {
    const settledPeer = { _id: oid("p-settled"), league: { weekId: null, lastWeek: { weekId: LAST_WEEK, xp: 500 } } };
    fakeUserModel.peers = [settledPeer, peer("user-1", 20)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 20 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.rank, 2);
  });
});

describe("settleLeague: learner missing from the peer list", () => {
  test("falls back to last place", async () => {
    fakeUserModel.peers = [peer("p1", 50), peer("p2", 40)];
    const user = makeUser({ league: { tier: 2, weekId: LAST_WEEK, cohort: 0, weeklyXp: 5 } });
    await settleLeague(user);
    assert.equal(user.league.lastResult.rank, 2);
  });
});

describe("joinLeague", () => {
  test("assigns a cohort of 30 based on how many already joined", async () => {
    fakeUserModel.cohortCount = 65;
    const user = makeUser({ league: { tier: 1, weekId: null, cohort: null, weeklyXp: 0 } });
    await joinLeague(user);
    assert.equal(user.league.weekId, weekBounds().id);
    assert.equal(user.league.cohort, Math.floor(65 / COHORT_SIZE));
    assert.equal(user.league.cohort, 2);
  });

  test("does not reset weekly XP if already joined this week", async () => {
    const user = makeUser({ league: { tier: 1, weekId: weekBounds().id, cohort: 0, weeklyXp: 70 } });
    await joinLeague(user);
    assert.equal(user.league.weeklyXp, 70);
  });
});

describe("standingsFor", () => {
  const person = (id, name, xp) => ({ _id: oid(id), name, league: { weeklyXp: xp }, streak: { current: 2 }, avatarStyle: "a" });

  test("joined: ranks the cohort, marks the learner and shows an unseen result", async () => {
    fakeUserModel.peers = [person("p1", "Bea", 90), person("user-1", "Ada", 40)];
    const user = makeUser({ league: {
      tier: 1, weekId: weekBounds().id, cohort: 0, weeklyXp: 40,
      lastResult: { outcome: "promoted", fromTier: 0, toTier: 1, rank: 2, seen: false },
    } });
    const view = await standingsFor(user);
    assert.equal(view.joined, true);
    assert.deepEqual(view.rows.map((r) => [r.rank, r.name, r.isYou]), [[1, "Bea", false], [2, "Ada", true]]);
    assert.deepEqual(view.zones, { promote: 7, demote: 0 }); // only 2 people: no demotion
    assert.equal(view.lastResult.outcome, "promoted");
  });

  test("not joined: empty table, and an already-seen result is hidden", async () => {
    const user = makeUser({ league: { tier: 1, weekId: null, lastResult: { outcome: "stayed", seen: true } } });
    const view = await standingsFor(user);
    assert.equal(view.joined, false);
    assert.deepEqual(view.rows, []);
    assert.equal(view.lastResult, null);
  });
});
