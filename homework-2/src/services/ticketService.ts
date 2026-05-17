import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../models/ticket';
import { ticketRepository } from '../repositories/ticketRepository';
import { validate } from '../validators/ticketValidator';
import { ClassificationService } from './classificationService';
import { parseCSV } from '../parsers/csvParser';
import { parseJSON } from '../parsers/jsonParser';
import { parseXML } from '../parsers/xmlParser';
import { log } from '../utils/classificationLogger';

export class TicketService {
  constructor(private classificationService: ClassificationService) {}

  async createTicket(data: any, options: { auto_classify?: boolean } = {}) {
    const { error, value } = validate(data);

    if (error) {
      const errorMessage = error.details.map((d) => d.message).join('; ');
      const err: any = new Error(errorMessage);
      err.statusCode = 400;
      err.details = error.details;
      throw err;
    }

    let ticket = ticketRepository.create(value);

    if (options.auto_classify) {
      const classification = await this.classificationService.classify(value.subject, value.description);
      ticket = ticketRepository.update(ticket.id, {
        category: classification.category,
        priority: classification.priority,
        classification: {
          confidence: classification.confidence,
          reasoning: classification.reasoning,
          keywords: classification.keywords_found,
        },
      })!;
    }

    return ticket;
  }

  getTicket(id: string) {
    const ticket = ticketRepository.findById(id);
    if (!ticket) {
      const err: any = new Error('Ticket not found');
      err.statusCode = 404;
      throw err;
    }
    return ticket;
  }

  listTickets(filters: any) {
    return ticketRepository.findAll(filters);
  }

  updateTicket(id: string, changes: Partial<Ticket>) {
    this.getTicket(id);
    const updated = ticketRepository.update(id, changes);
    return updated;
  }

  deleteTicket(id: string) {
    this.getTicket(id);
    ticketRepository.delete(id);
    return { deleted: true };
  }

  async importTickets(file: Express.Multer.File, format: 'csv' | 'json' | 'xml') {
    let parser;
    if (format === 'csv') parser = parseCSV;
    else if (format === 'json') parser = parseJSON;
    else if (format === 'xml') parser = parseXML;
    else throw new Error(`Unsupported format: ${format}`);

    let rawRows: any[];
    try {
      rawRows = await parser(file.buffer);
    } catch (parseErr: any) {
      return {
        total: 0,
        successful: 0,
        failed: 1,
        errors: [{ row: null, message: parseErr.message }],
        tickets: [],
      };
    }

    const successful: Ticket[] = [];
    const failed: any[] = [];

    for (let index = 0; index < rawRows.length; index++) {
      const row = rawRows[index];
      // Normalize to match expected model, handling tags and metadata correctly for csv import
      const normalizedRow = {
        customer_id: row.customer_id,
        customer_email: row.customer_email,
        customer_name: row.customer_name,
        subject: row.subject,
        description: row.description,
        category: row.category,
        priority: row.priority,
        status: row.status,
        tags: typeof row.tags === 'string' ? row.tags.replace(/[\[\]"]/g, '').split(',').map((t: string) => t.trim()).filter(Boolean) : row.tags || [],
        metadata: row.metadata || { source: 'api' },
      };

      const { error, value } = validate(normalizedRow);

      if (error) {
        failed.push({
          row: index + 1,
          message: error.details.map((d) => d.message).join('; '),
        });
      } else {
        const ticket = ticketRepository.create(value);
        const classification = await this.classificationService.classify(value.subject, value.description);
        const updatedTicket = ticketRepository.update(ticket.id, {
          category: classification.category,
          priority: classification.priority,
          classification: {
            confidence: classification.confidence,
            reasoning: classification.reasoning,
            keywords: classification.keywords_found,
          },
        })!;
        successful.push(updatedTicket);
      }
    }

    return {
      total: rawRows.length,
      successful: successful.length,
      failed: failed.length,
      errors: failed,
      tickets: successful,
    };
  }

  async classifyTicket(id: string) {
    const ticket = this.getTicket(id);
    const classification = await this.classificationService.classify(ticket.subject, ticket.description);

    const updated = ticketRepository.update(id, {
      category: classification.category,
      priority: classification.priority,
      classification: {
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        keywords: classification.keywords_found,
      },
    })!;

    return classification;
  }
}
