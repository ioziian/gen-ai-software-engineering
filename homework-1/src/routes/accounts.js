const express = require("express");
const router = express.Router();
const { accounts } = require("../models/storage");

// GET /accounts/:accountId/balance - Get account balance
router.get("/:accountId/balance", (req, res) => {
    const balance = accounts[req.params.accountId];
    if (balance === undefined) {
        return res.status(404).json({ error: "Account not found" });
    }
    res.json({ accountId: req.params.accountId, balance });
});

module.exports = router;
