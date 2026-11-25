# 3.4 White-Box Testing · 3.5 TDD and BDD

**Member 2:** Amindra Edirisuriya

| Result | Value |
|---|---|
| Unit tests | 80 (79 pass, 1 documents a known defect) |
| Statement / branch coverage | 100% / 100% on all 5 tested modules |
| Cyclomatic complexity | 3 functions analysed: V(G) = 5, 6, 4 |
| Defects found | 3 (DEF-M2-01, DEF-M2-02 open; DEF-M2-03 fixed with TDD) |
| TDD | `scoreRun`: Red → Green → Refactor in 3 commits |
| BDD | 4 feature files, 21 scenarios, 92 steps, all passed |

## Folder contents

```
3.4-3.5-white-box-tdd-bdd/
├── README.md        this file
├── report/          full write-up (Word + PDF)
├── diagrams/        control flow graphs (Figures 3.4.1 – 3.4.3)
├── screenshots/     test evidence (Figures 3.4.4 – 3.5.7)
└── evidence/        raw text logs of the test runs
```

- [Report (Word)](report/Curio_STQA_Member2_Amindra.docx) · [Report (PDF)](report/Curio_STQA_Member2_Amindra.pdf)

## How to run the tests

From the project root, after `npm install`:

| Command | What it runs |
|---|---|
| `npm run test:unit -w backend` | 47 backend unit tests |
| `npm run test:unit -w frontend` | 33 frontend unit tests |
| `npm run test:coverage -w backend` | Backend tests + coverage (`backend/coverage/lcov.info`) |
| `npm run test:coverage -w frontend` | Frontend tests + coverage (`frontend/coverage/lcov.info`) |
| `npm run test:bdd -w backend` | Cucumber scenarios + `backend/reports/cucumber-report.html` |

Node.js 22.3 or newer is required (the unit tests use `mock.module`).

## Where the test code lives

| Path | Purpose |
|---|---|
| `backend/tests/unit/` | Backend unit tests + shared test doubles (`helpers.js`) |
| `frontend/tests/unit/` | Frontend unit tests |
| `backend/src/services/scoring.js` | Function built with TDD |
| `backend/features/` | Gherkin feature files + `step_definitions/steps.js` |
| `backend/cucumber.js` | Cucumber configuration |

## Figures

### 3.4 White-box testing

| Figure | Description |
|---|---|
| 3.4.1 | [CFG – validateSignup](diagrams/fig-3.4.1-cfg-validateSignup.png) (V(G) = 5) |
| 3.4.2 | [CFG – timeLeft](diagrams/fig-3.4.2-cfg-timeLeft.png) (V(G) = 6) |
| 3.4.3 | [CFG – updateStreak](diagrams/fig-3.4.3-cfg-updateStreak.png) (V(G) = 4) |
| 3.4.4 | [Backend unit tests – 47 tests, 46 pass, 1 todo](screenshots/fig-3.4.4-backend-unit-tests.png) |
| 3.4.5 | [Frontend unit tests – 33 pass](screenshots/fig-3.4.5-frontend-unit-tests.png) |
| 3.4.6 | [Backend coverage – 100%](screenshots/fig-3.4.6-backend-coverage.png) |
| 3.4.7 | [Frontend coverage – 100%](screenshots/fig-3.4.7-frontend-coverage.png) |
| 3.4.8 | [Test exposing defect DEF-M2-01](screenshots/fig-3.4.8-defect-DEF-M2-01.png) |

### 3.5 TDD and BDD

| Figure | Description |
|---|---|
| 3.5.1 | [TDD RED – test fails before the code exists](screenshots/fig-3.5.1-tdd-red.png) |
| 3.5.2 | [TDD GREEN – 6 of 6 pass](screenshots/fig-3.5.2-tdd-green.png) |
| 3.5.3 | [TDD commit history on GitHub](screenshots/fig-3.5.3-tdd-commits.png) |
| 3.5.4 | [Cucumber terminal – 21 scenarios passed](screenshots/fig-3.5.4-cucumber-terminal.png) |
| 3.5.5 | [Cucumber HTML report – summary](screenshots/fig-3.5.5-cucumber-report-summary.png) |
| 3.5.6 | [Cucumber – lesson_scoring.feature](screenshots/fig-3.5.6-cucumber-lesson-scoring.png) |
| 3.5.7 | [Cucumber – signup_validation.feature](screenshots/fig-3.5.7-cucumber-signup-validation.png) |

## Defects handed to defect tracking (3.8)

| ID | Title | Severity | Status |
|---|---|---|---|
| DEF-M2-01 | Streak continues after a skipped calendar day | Medium | Open |
| DEF-M2-02 | XP shown on the course path differs from XP awarded | Medium | Open |
| DEF-M2-03 | A lesson with 0 questions gives NaN accuracy | Low | Fixed in `scoreRun` |

Full steps, root cause and suggested fixes are in section 3.4.9 of the report.
