Feature: Sign-up form validation
  As a new user
  I want clear messages when my sign-up details are wrong
  So that I can fix them before creating an account

  Scenario: Valid details are accepted
    Given a sign-up with name "Ada Lovelace", email "ada@curio.dev" and password "Learner123"
    When the sign-up form is validated
    Then there are no errors

  Scenario Outline: Invalid details show a message on the field
    Given a sign-up with name "<name>", email "<email>" and password "<password>"
    When the sign-up form is validated
    Then the "<field>" field shows "<message>"

    Examples:
      | name | email         | password   | field    | message                                     |
      | A    | ada@curio.dev | Learner123 | name     | Name must be at least 2 characters          |
      | Ada  | ada@curio     | Learner123 | email    | Enter a valid email address                 |
      | Ada  | ada@curio.dev | abc123     | password | Password must be at least 8 characters      |
      | Ada  | ada@curio.dev | abcdefgh   | password | Password must contain a letter and a number |
      | Ada  | ada@curio.dev | 12345678   | password | Password must contain a letter and a number |
