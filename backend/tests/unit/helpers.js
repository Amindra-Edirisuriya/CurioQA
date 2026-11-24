// Shared test doubles for the unit tests. The Mongoose models are replaced
// with in-memory fakes so the services can be tested without a database.
import { mock } from "node:test";

export const fakeUserModel = {
  peers: [],
  cohortCount: 0,
  find() {
    const rows = async () => fakeUserModel.peers;
    return { select: rows, sort: () => ({ limit: rows }) };
  },
  async countDocuments() {
    return fakeUserModel.cohortCount;
  },
};

export const fakeAttemptModel = {
  created: [],
  async create(doc) {
    fakeAttemptModel.created.push(doc);
    return doc;
  },
};

// Must be called before the service under test is imported.
export function mockModels() {
  mock.module(new URL("../../src/models/User.js", import.meta.url).href, { defaultExport: fakeUserModel });
  mock.module(new URL("../../src/models/Attempt.js", import.meta.url).href, { defaultExport: fakeAttemptModel });
}

// A minimal stand-in for an ObjectId: has toString() and equals().
export const oid = (value) => ({
  value,
  toString: () => value,
  equals: (other) => String(other) === value,
});

export function makeUser(overrides = {}) {
  return {
    _id: oid("user-1"),
    xp: 0,
    gems: 0,
    hearts: { current: 5, nextRefillAt: null },
    streak: { current: 0, longest: 0, lastActivityAt: null },
    league: { tier: 0, weekId: null, cohort: null, weeklyXp: 0 },
    badges: [],
    lessonProgress: [],
    completedLessons: 0,
    totalStudySeconds: 0,
    saved: 0,
    async save() { this.saved += 1; },
    markModified() {},
    ...overrides,
  };
}

export function makeLesson(questionCount = 4, overrides = {}) {
  return {
    _id: oid("lesson-1"),
    course: oid("course-1"),
    questions: Array.from({ length: questionCount }, (_, i) => ({ id: `q${i + 1}` })),
    ...overrides,
  };
}
