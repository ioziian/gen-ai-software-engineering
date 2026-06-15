import { TicketCategory, TicketPriority } from '../models/ticket';

export interface ClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  keywords_found: string[];
}

export function classify(subject: string, description: string): ClassificationResult {
  const text = (subject + ' ' + description).toLowerCase();
    
  const CATEGORY_KEYWORDS: Record<TicketCategory, string[]> = {
    account_access: ['login', 'password', '2fa', 'sign in', 'sign out', 'locked', 'account', 'authentication', 'access denied'],
    technical_issue: ['error', 'crash', 'bug', 'not working', 'broken', 'exception', 'timeout', 'slow', 'performance', 'fail'],
    billing_question: ['payment', 'invoice', 'charge', 'refund', 'subscription', 'billing', 'price', 'cost', 'receipt'],
    feature_request: ['would like', 'request', 'suggest', 'enhance', 'add', 'new feature', 'improvement', 'wish'],
    bug_report: ['reproduce', 'steps to reproduce', 'expected', 'actual', 'regression', 'defect', 'version'],
    other: [],
  };

  const PRIORITY_KEYWORDS: Record<TicketPriority, string[]> = {
    urgent: ["can't access", 'critical', 'production down', 'security'],
    high: ['important', 'blocking', 'asap'],
    medium: [],
    low: ['minor', 'cosmetic', 'suggestion'],
  };

  let selectedCategory: TicketCategory = 'other';
  let maxCount = 0;
  let keywordsFound: string[] = [];

  for (const [category, keywordsList] of Object.entries(CATEGORY_KEYWORDS) as [TicketCategory, string[]][]) {
    let count = 0;
    for (const kw of keywordsList) {
      if (text.includes(kw)) {
        count++;
        if (!keywordsFound.includes(kw)) keywordsFound.push(kw);
      }
    }
    if (count > maxCount) {
      maxCount = count;
      selectedCategory = category;
    }
  }

  let priority: TicketPriority = 'medium';
  for (const [prio, keywordsList] of Object.entries(PRIORITY_KEYWORDS) as [TicketPriority, string[]][]) {
    for (const kw of keywordsList) {
      if (text.includes(kw)) {
        priority = prio;
        break;
      }
    }
    if (priority !== 'medium') break;
  }

  return {
    category: selectedCategory,
    priority,
    confidence: maxCount > 0 ? Math.min(maxCount / 5, 1.0) : 0,
    reasoning: `Classification based on keyword matching.`,
    keywords_found: keywordsFound
  };
}

export class ClassificationService {
  async classify(subject: string, description: string): Promise<ClassificationResult> {
    return classify(subject, description);
  }
}
