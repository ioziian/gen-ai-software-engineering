import { describe, it, expect } from 'vitest';
import { TicketService } from '../services/ticketService';
import { ClassificationService } from '../services/classificationService';
import { ticketStore } from '../models/ticketStore';

describe('Performance Load', () => {
  it('should handle concurrent ticket creation', async () => {
    const service = new TicketService(ticketStore, new ClassificationService());
    const count = 10;
    const promises = Array.from({ length: count }).map((_, i) => 
      service.create({
        subject: `Performance Test ${i}`,
        description: 'Test description',
        customer_email: `perf${i}@example.com`
      }, false)
    );
    
    const tickets = await Promise.all(promises);
    expect(tickets.length).toBe(count);
  });
});
