Feature: Lesson Studio access

  Scenario: An instructor creates a published lesson
    Given I am authenticated as an instructor
    When I create a valid published lesson
    Then the response status should be 201
    And the created lesson should have the title "BDD Torque"

  Scenario: A learner cannot access the Lesson Studio
    Given I am authenticated as a learner
    When I request the Lesson Studio lessons
    Then the response status should be 403