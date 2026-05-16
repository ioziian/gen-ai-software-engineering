import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketService } from '../services/ticketService';
import { ticketStore } from '../models/ticketStore';
import { ClassificationService } from '../services/classificationService';

// Mock dependencies
vi.mock('../models/ticketStore');
vi.mock('../services/classificationService');

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TicketService(ticketStore, new ClassificationService());
  });

  it('should create a ticket', async () => {
    ticketStore.getAll.mockReturnValue([]);
    const data = { customer_email: 'test@example.com', subject: 'Issue', description: 'Help' };
    const ticket = await service.create(data);
    expect(ticket.customer_email).toBe('test@example.com');
  });

  it('should throw on duplicate ticket', async () => {
    const data = { customer_email: 'test@example.com', subject: 'Issue', description: 'Help' };
    ticketStore.getAll.mockReturnValue([data]);
    await expect(service.create(data)).rejects.toThrow('Duplicate ticket found');
  });
});
