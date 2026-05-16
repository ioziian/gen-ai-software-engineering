import { TicketCategory, TicketPriority } from '../models/ticket';

export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  keywords: string[];
}

export class ClassificationService {
  async classify(subject: string, description: string): Promise<ClassificationResult> {
    const text = (subject + ' ' + description).toLowerCase();
    
    let category: TicketCategory = 'other';
    let priority: TicketPriority = 'medium';
    let keywords: string[] = [];
    let reasoning = 'Classification based on keyword matching.';

    // Priority Rules
    if (text.match(/can't access|critical|production down|security/)) {
      priority = 'urgent';
      keywords.push('critical');
    } else if (text.match(/important|blocking|asap/)) {
      priority = 'high';
      keywords.push('high');
    }

    // Category Rules
    if (text.match(/login|password|2fa|account/)) {
      category = 'account_access';
    } else if (text.match(/error|crash|bug|fail/)) {
      category = 'technical_issue';
    } else if (text.match(/payment|invoice|refund|billing/)) {
      category = 'billing_question';
    }

    return {
      category,
      priority,
      confidence: 0.85,
      reasoning,
      keywords
    };
  }
}
