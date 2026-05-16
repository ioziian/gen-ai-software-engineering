import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../models/ticket';
import { ticketStore } from '../models/ticketStore';
import { ClassificationService } from './classificationService';

export class TicketService {
  constructor(
    private store: typeof ticketStore,
    private classificationService: ClassificationService
  ) {}

  getAll(filters: any) {
    let tickets = this.store.getAll();
    if (filters.category) tickets = tickets.filter(t => t.category === filters.category);
    if (filters.priority) tickets = tickets.filter(t => t.priority === filters.priority);
    if (filters.status) tickets = tickets.filter(t => t.status === filters.status);
    return tickets;
  }

  getById(id: string) {
    return this.store.getById(id);
  }

  async create(data: any, autoClassify: boolean = false) {
    const existing = this.store.getAll().find(t => t.customer_email === data.customer_email && t.subject === data.subject);
    if (existing) throw new Error('Duplicate ticket found');

    const ticket: Ticket = {
      ...data,
      id: uuidv4(),
      status: data.status || 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null,
      assigned_to: data.assigned_to || null,
      tags: data.tags || [],
      metadata: data.metadata || { source: 'api' }
    };

    if (autoClassify) {
      const classification = await this.classificationService.classify(ticket.subject, ticket.description);
      ticket.category = classification.category;
      ticket.priority = classification.priority;
      ticket.classification = {
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords
      };
    }

    this.store.create(ticket);
    return ticket;
  }

  update(id: string, data: any) {
    return this.store.update(id, data);
  }

  delete(id: string) {
    return this.store.delete(id);
  }

  async autoClassify(id: string) {
    const ticket = this.store.getById(id);
    if (!ticket) return null;

    const classification = await this.classificationService.classify(ticket.subject, ticket.description);
    return this.store.update(id, {
      category: classification.category,
      priority: classification.priority,
      classification: {
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords
      }
    });
  }
}
