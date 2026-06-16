const express = require("express");
const router = express.Router();
const { transactions, accounts } = require("../models/storage");
const { createTransaction } = require("../models/transaction");
const { validateTransaction } = require("../validators/transactionValidator");

// POST /transactions - Create a new transaction
router.post("/", (req, res) => {
    const errors = validateTransaction(req.body);
    if (errors.length > 0) {
        return res
            .status(400)
            .json({ error: "Validation failed", details: errors });
    }
    const tx = createTransaction(req.body);
    tx.status = "completed";
    transactions.push(tx);
    // Update balances
    if (!accounts[tx.fromAccount]) accounts[tx.fromAccount] = 0;
    if (!accounts[tx.toAccount]) accounts[tx.toAccount] = 0;
    if (tx.type === "transfer") {
        accounts[tx.fromAccount] -= tx.amount;
        accounts[tx.toAccount] += tx.amount;
    } else if (tx.type === "deposit") {
        accounts[tx.toAccount] += tx.amount;
    } else if (tx.type === "withdrawal") {
        accounts[tx.fromAccount] -= tx.amount;
    }
    res.status(201).json(tx);
});

// GET /transactions - List all transactions with filtering
router.get("/", (req, res) => {
    let result = transactions;
    const { accountId, type, from, to } = req.query;

    if (accountId) {
        result = result.filter(
            (t) => t.fromAccount === accountId || t.toAccount === accountId,
        );
    }
    if (type) {
        result = result.filter((t) => t.type === type);
    }
    if (from) {
        const fromDate = new Date(from);
        result = result.filter((t) => new Date(t.timestamp) >= fromDate);
    }
    if (to) {
        const toDate = new Date(to);
        result = result.filter((t) => new Date(t.timestamp) <= toDate);
    }
    res.json(result);
});

// GET /transactions/:id - Get a specific transaction by ID
router.get("/:id", (req, res) => {
    const tx = transactions.find((t) => t.id === req.params.id);
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(tx);
});

module.exports = router;
