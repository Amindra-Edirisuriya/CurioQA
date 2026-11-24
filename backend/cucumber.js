// Cucumber.js configuration. Run: npm run test:bdd -w backend
export default {
  paths: ["features/**/*.feature"],
  import: ["features/step_definitions/**/*.js"],
  format: ["progress-bar", "html:reports/cucumber-report.html", "json:reports/cucumber-report.json"],
};
