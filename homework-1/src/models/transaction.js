// Transaction model structure (for reference)
// Used for validation and documentation

/*
{
  id: string (auto-generated),
  fromAccount: string,
  toAccount: string,
  amount: number,
  currency: string (ISO 4217),
  type: string (deposit | withdrawal | transfer),
  timestamp: ISO 8601 datetime,
  status: string (pending | completed | failed)
}
*/

const { v4: uuidv4 } = require("uuid");

function createTransaction({
    fromAccount,
    toAccount,
    amount,
    currency,
    type,
    status = "pending",
}) {
    return {
        id: uuidv4(),
        fromAccount,
        toAccount,
        amount,
        currency,
        type,
        timestamp: new Date().toISOString(),
        status,
    };
}

module.exports = { createTransaction };
