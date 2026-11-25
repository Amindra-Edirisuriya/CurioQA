import assert from "node:assert/strict";
import { Given, When, Then } from "@cucumber/cucumber";
import request from "supertest";

Given("I am authenticated as an instructor", async function () {
  this.token = this.instructorToken;
});

Given("I am authenticated as a learner", async function () {
  this.token = this.learnerToken;
});

When("I create a valid published lesson", async function () {
  this.response = await this.api
    .post("/api/studio/lessons")
    .set("Authorization", `Bearer ${this.token}`)
    .send({
      title: "BDD Torque",
      slug: "bdd-torque",
      summary: "A lesson created by a BDD scenario",
      course: this.courseId,
      order: 100,
      xp: 20,
      difficulty: "beginner",
      estimatedMinutes: 5,
      published: true,
      questions: [
        {
          id: "q1",
          type: "numeric",
          prompt: "What is 2 + 3?",
          answer: 5,
        },
      ],
    });
});

When("I request the Lesson Studio lessons", async function () {
  this.response = await this.api
    .get("/api/studio/lessons")
    .set("Authorization", `Bearer ${this.token}`);
});

Then("the response status should be {int}", function (status) {
  assert.equal(this.response.status, status);
});

Then("the created lesson should have the title {string}", function (title) {
  assert.equal(this.response.body.title, title);
});