// Transaction validation logic
const ISO_4217 = ["USD", "EUR", "GBP", "JPY"]; // Extend as needed

function validateAmount(amount) {
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        return "Amount must be a positive number";
    }
    if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
        return "Amount must have at most 2 decimal places";
    }
    return null;
}

function validateAccount(account) {
    if (!/^ACC-[A-Za-z0-9]{5}$/.test(account)) {
        return "Account must be in format ACC-XXXXX (alphanumeric)";
    }
    return null;
}

function validateCurrency(currency) {
    if (!ISO_4217.includes(currency)) {
        return "Invalid currency code";
    }
    return null;
}

function validateTransaction(data) {
    const errors = [];
    const amountError = validateAmount(data.amount);
    if (amountError) errors.push({ field: "amount", message: amountError });
    const fromError = validateAccount(data.fromAccount);
    if (fromError) errors.push({ field: "fromAccount", message: fromError });
    const toError = validateAccount(data.toAccount);
    if (toError) errors.push({ field: "toAccount", message: toError });
    const currencyError = validateCurrency(data.currency);
    if (currencyError)
        errors.push({ field: "currency", message: currencyError });
    return errors;
}

module.exports = { validateTransaction };
