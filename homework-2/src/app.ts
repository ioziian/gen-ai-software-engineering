import express from 'express';
import cors from 'cors';
import { ticketRoutes } from './routes/ticketRoutes';

export const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'OK' }));
app.use('/tickets', ticketRoutes);
