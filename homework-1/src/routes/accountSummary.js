const express = require("express");
const router = express.Router();
const { transactions } = require("../models/storage");

// GET /accounts/:accountId/summary
router.get("/:accountId/summary", (req, res) => {
    const accountId = req.params.accountId;
    const accountTxs = transactions.filter(
        (t) => t.fromAccount === accountId || t.toAccount === accountId,
    );
    if (accountTxs.length === 0) {
        return res
            .status(404)
            .json({ error: "No transactions found for this account" });
    }
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let mostRecent = null;
    accountTxs.forEach((t) => {
        if (t.type === "deposit" && t.toAccount === accountId) {
            totalDeposits += t.amount;
        } else if (t.type === "withdrawal" && t.fromAccount === accountId) {
            totalWithdrawals += t.amount;
        } else if (t.type === "transfer") {
            if (t.fromAccount === accountId) totalWithdrawals += t.amount;
            if (t.toAccount === accountId) totalDeposits += t.amount;
        }
        if (!mostRecent || new Date(t.timestamp) > new Date(mostRecent)) {
            mostRecent = t.timestamp;
        }
    });
    res.json({
        accountId,
        totalDeposits,
        totalWithdrawals,
        transactionCount: accountTxs.length,
        mostRecentTransaction: mostRecent,
    });
});

module.exports = router;
