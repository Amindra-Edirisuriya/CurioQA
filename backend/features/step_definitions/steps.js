// Step definitions for the Curio BDD scenarios (Cucumber.js).
// Each step calls the real application code; no database is needed because
// the functions under test are pure.
import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { scoreRun } from "../../src/services/scoring.js";
import { buildPath } from "../../src/services/progress.service.js";
import { zonesFor } from "../../src/services/league.service.js";
import { validateSignup } from "../../../frontend/src/lib/validation.js";

const list = (text) => text.split(",").map((item) => item.trim()).filter(Boolean);
const lessonDoc = (slug, published) => ({
  _id: { toString: () => `id-${slug}` }, slug, title: slug, xp: 20, difficulty: "beginner", estimatedMinutes: 5, published,
});

// ---- Lesson scoring ------------------------------------------------------
Given(/^a lesson with (\d+) questions$/, function (total) {
  this.total = Number(total);
});

When(/^the learner answers (\d+) questions correctly$/, function (correct) {
  this.score = scoreRun({ total: this.total, correctCount: Number(correct) });
});

Then(/^the learner earns (\d+) XP$/, function (xp) {
  assert.equal(this.score.xpAwarded, Number(xp));
});

Then(/^the accuracy is (\d+) percent$/, function (accuracy) {
  assert.equal(this.score.accuracy, Number(accuracy));
});

Then(/^the learner loses (\d+) hearts$/, function (hearts) {
  assert.equal(this.score.wrong, Number(hearts));
});

Then(/^the run is( not)? marked as perfect$/, function (not) {
  assert.equal(this.score.perfect, !not);
});

// ---- Learning path -------------------------------------------------------
Given(/^a course with the published lessons "([^"]*)"$/, function (slugs) {
  this.lessons = list(slugs).map((slug) => lessonDoc(slug, true));
});

Given(/^a draft lesson "([^"]*)"$/, function (slug) {
  this.lessons.push(lessonDoc(slug, false));
});

Given(/^the learner has completed no lessons$/, function () {
  this.completed = new Set();
});

Given(/^the learner has completed "([^"]*)"$/, function (slugs) {
  this.completed = new Set(list(slugs).map((slug) => `id-${slug}`));
});

When(/^the learner opens the course path$/, function () {
  this.path = buildPath(this.lessons, this.completed);
});

Then(/^"([^"]*)" is "([^"]*)"$/, function (slug, status) {
  assert.equal(this.path.find((node) => node.id === slug).status, status);
});

Then(/^"([^"]*)" is shown as coming soon$/, function (slug) {
  assert.equal(this.path.find((node) => node.id === slug).draft, true);
});

// ---- League zones --------------------------------------------------------
Given(/^a learner in tier (\d+)$/, function (tier) {
  this.tier = Number(tier);
});

Given(/^a cohort of (\d+) learners$/, function (size) {
  this.size = Number(size);
});

When(/^the week's zones are calculated$/, function () {
  this.zones = zonesFor(this.tier, this.size);
});

Then(/^the top (\d+) learners are promoted$/, function (count) {
  assert.equal(this.zones.promote, Number(count));
});

Then(/^the bottom (\d+) learners are demoted$/, function (count) {
  assert.equal(this.zones.demote, Number(count));
});

// ---- Sign-up validation --------------------------------------------------
Given(/^a sign-up with name "([^"]*)", email "([^"]*)" and password "([^"]*)"$/, function (name, email, password) {
  this.form = { name, email, password };
});

When(/^the sign-up form is validated$/, function () {
  this.errors = validateSignup(this.form);
});

Then(/^there are no errors$/, function () {
  assert.deepEqual(this.errors, {});
});

Then(/^the "([^"]*)" field shows "([^"]*)"$/, function (field, message) {
  assert.equal(this.errors[field], message);
});
