const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

const transactionsRouter = require("./routes/transactions");
const accountsRouter = require("./routes/accounts");
const accountSummaryRouter = require("./routes/accountSummary");

app.use("/transactions", transactionsRouter);
app.use("/accounts", accountsRouter);
app.use("/accounts", accountSummaryRouter);

app.get("/", (req, res) => {
    res.send("Banking Transactions API is running.");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
