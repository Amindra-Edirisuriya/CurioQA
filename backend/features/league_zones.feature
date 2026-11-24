Feature: Weekly league promotion and demotion
  As a learner competing in a weekly league
  I want clear promotion and demotion zones
  So that I know what I need to do to move up

  Scenario Outline: Zone sizes by tier and cohort size
    Given a learner in tier <tier>
    And a cohort of <size> learners
    When the week's zones are calculated
    Then the top <promote> learners are promoted
    And the bottom <demote> learners are demoted

    Examples: Normal tiers
      | tier | size | promote | demote |
      | 3    | 30   | 7       | 5      |
      | 3    | 13   | 7       | 5      |

    Examples: Edge cases
      | tier | size | promote | demote |
      | 0    | 30   | 7       | 0      |
      | 9    | 30   | 0       | 5      |
      | 3    | 12   | 7       | 0      |
