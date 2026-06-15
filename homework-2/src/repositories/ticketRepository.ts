import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../models/ticket';

const store = new Map<string, Ticket>();

export const ticketRepository = {
  create: (ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Ticket => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const ticket: Ticket = {
      ...ticketData,
      id,
      created_at: now,
      updated_at: now,
      resolved_at: null,
      assigned_to: null,
      tags: ticketData.tags || [],
      metadata: ticketData.metadata || { source: 'api' },
    } as Ticket;
    store.set(id, ticket);
    return ticket;
  },

  findById: (id: string): Ticket | undefined => {
    return store.get(id);
  },

  findAll: (filters: Record<string, any> = {}): Ticket[] => {
    const tickets = Array.from(store.values());

    if (Object.keys(filters).length === 0) {
      return tickets;
    }

    return tickets.filter(ticket => {
      for (const [key, value] of Object.entries(filters)) {
        if ((ticket as any)[key] !== value) {
          return false;
        }
      }
      return true;
    });
  },

  update: (id: string, changes: Partial<Ticket>): Ticket | undefined => {
    const ticket = store.get(id);
    if (!ticket) {
      return undefined;
    }

    const updated: Ticket = {
      ...ticket,
      ...changes,
      updated_at: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  delete: (id: string): boolean => {
    return store.delete(id);
  },

  clear: (): void => {
    store.clear();
  },
};
