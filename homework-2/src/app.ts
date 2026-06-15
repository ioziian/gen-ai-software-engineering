import express from "express";
import cors from "cors";
import { ticketRoutes } from "./routes/ticketRoutes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();
app.use(cors());
app.use(express.json());
app.use(express.text({ type: 'text/csv' }));

app.get("/health", (req, res) => res.json({ status: "OK" }));
app.use("/tickets", ticketRoutes);
// Register error handler as the last middleware
app.use(errorHandler);
