Feature: Course learning path
  As a learner
  I want lessons to unlock one at a time
  So that I follow the course in order

  Background:
    Given a course with the published lessons "vectors, forces, torque"
    And a draft lesson "momentum"

  Scenario: A new learner can only start the first lesson
    Given the learner has completed no lessons
    When the learner opens the course path
    Then "vectors" is "active"
    And "forces" is "locked"
    And "torque" is "locked"

  Scenario: Completing a lesson unlocks the next one
    Given the learner has completed "vectors"
    When the learner opens the course path
    Then "vectors" is "completed"
    And "forces" is "active"
    And "torque" is "locked"

  Scenario: Draft lessons stay locked and are marked coming soon
    Given the learner has completed "vectors, forces, torque"
    When the learner opens the course path
    Then "momentum" is "locked"
    And "momentum" is shown as coming soon
