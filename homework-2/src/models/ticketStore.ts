import { Ticket } from './ticket';

class TicketStore {
  private tickets: Ticket[] = [];

  getAll(): Ticket[] {
    return this.tickets;
  }

  getById(id: string): Ticket | undefined {
    return this.tickets.find(t => t.id === id);
  }

  create(ticket: Ticket): void {
    this.tickets.push(ticket);
  }

  update(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const index = this.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    this.tickets[index] = { ...this.tickets[index], ...updates, updated_at: new Date().toISOString() };
    return this.tickets[index];
  }

  delete(id: string): boolean {
    const initialLength = this.tickets.length;
    this.tickets = this.tickets.filter(t => t.id !== id);
    return this.tickets.length < initialLength;
  }

  clear(): void {
    this.tickets = [];
  }
}

export const ticketStore = new TicketStore();
