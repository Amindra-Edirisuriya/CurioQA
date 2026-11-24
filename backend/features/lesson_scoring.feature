Feature: Lesson scoring
  As a learner
  I want to earn XP and lose hearts based on my answers
  So that my progress reflects how well I did

  Scenario: Perfect lesson earns the bonus
    Given a lesson with 4 questions
    When the learner answers 4 questions correctly
    Then the learner earns 50 XP
    And the run is marked as perfect
    And the accuracy is 100 percent

  Scenario: Wrong answers cost hearts
    Given a lesson with 5 questions
    When the learner answers 3 questions correctly
    Then the learner earns 30 XP
    And the learner loses 2 hearts
    And the run is not marked as perfect

  Scenario Outline: XP for different results
    Given a lesson with <total> questions
    When the learner answers <correct> questions correctly
    Then the learner earns <xp> XP
    And the accuracy is <accuracy> percent

    Examples:
      | total | correct | xp | accuracy |
      | 3     | 0       | 0  | 0        |
      | 3     | 1       | 10 | 33       |
      | 3     | 3       | 40 | 100      |
      | 6     | 5       | 50 | 83       |

  Scenario: Reported score above the question count is capped
    Given a lesson with 2 questions
    When the learner answers 9 questions correctly
    Then the learner earns 30 XP
