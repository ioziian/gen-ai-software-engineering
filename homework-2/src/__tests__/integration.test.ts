import { describe, it, expect } from 'vitest';
import { TicketService } from '../services/ticketService';
import { ClassificationService } from '../services/classificationService';
import { ticketStore } from '../models/ticketStore';

describe('Integration Flow', () => {
  it('should create and auto-classify a ticket', async () => {
    const service = new TicketService(ticketStore, new ClassificationService());
    const ticket = await service.create({
      subject: 'Integration Test',
      description: 'Test description',
      customer_email: 'int@example.com'
    }, true);
    
    expect(ticket.category).toBeDefined();
    expect(ticket.priority).toBeDefined();
  });
});
