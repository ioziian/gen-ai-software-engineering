const fs = require('fs');
const path = require('path');

const logPath = process.argv[2];
const prompt = process.argv[3];
const decision = process.argv[4] || 'No specific decision recorded.';

if (!logPath || !prompt) {
  console.error('Usage: node log_interaction.cjs <logPath> <prompt> [decision]');
  process.exit(1);
}

const date = new Date().toISOString().split('T')[0];
const entry = `
### ${date}
- **Prompt:** 
> ${prompt}
- **Decision/Rationale:** ${decision}
- **Outcome:** Logged via automation.
---
`;

try {
  fs.appendFileSync(logPath, entry);
  console.log(`Successfully logged interaction to ${logPath}`);
} catch (err) {
  console.error(`Error writing to log: ${err.message}`);
  process.exit(1);
}
