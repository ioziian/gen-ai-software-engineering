import { Router } from 'express';
import { TicketService } from '../services/ticketService';
import { ticketStore } from '../models/ticketStore';
import { ClassificationService } from '../services/classificationService';
import { validateTicket } from '../middleware/validation';

const router = Router();
const classificationService = new ClassificationService();
const ticketService = new TicketService(ticketStore, classificationService);

router.get('/', (req, res) => {
  const tickets = ticketService.getAll(req.query);
  res.json(tickets);
});

router.post('/', validateTicket, async (req, res) => {
  try {
    const autoClassify = req.query.autoClassify === 'true';
    const ticket = await ticketService.create(req.body, autoClassify);
    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  const ticket = ticketService.getById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

router.put('/:id', validateTicket, (req, res) => {
  const ticket = ticketService.update(req.params.id, req.body);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

router.delete('/:id', (req, res) => {
  const deleted = ticketService.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Ticket not found' });
  res.status(204).send();
});

router.post('/:id/auto-classify', async (req, res) => {
  const ticket = await ticketService.autoClassify(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

export { router as ticketRoutes };
