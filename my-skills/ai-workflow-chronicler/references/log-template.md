# AI Interaction Log Template

## Entry Format

### [Date] - [Task Name]
- **Prompt:** 
> [Insert Prompt Here]
- **AI Tool:** [e.g. Claude Code (Sonnet 3.5)]
- **Decision/Rationale:** [Why was this approach taken?]
- **Outcome:** [Success/Partial Success/Refinement needed]

## Example

### 2026-05-10 - Implement Transaction Validation
- **Prompt:** 
> "Add validation for transaction amounts to ensure they are positive and have max 2 decimal places. Also validate account numbers to follow ACC-XXXXX format."
- **AI Tool:** Gemini CLI
- **Decision/Rationale:** Used a dedicated `transactionValidator.js` to keep the route logic clean. Used Regex for account number validation as it's the most efficient for this specific pattern.
- **Outcome:** Successfully implemented and verified with 4 test cases.
