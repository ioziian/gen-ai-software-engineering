export type TicketCategory = 'account_access' | 'technical_issue' | 'billing_question' | 'feature_request' | 'bug_report' | 'other';
export type TicketPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TicketStatus = 'new' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  tags: string[];
  metadata: {
    source: 'web_form' | 'email' | 'api' | 'chat' | 'phone';
    browser?: string;
    device_type?: 'desktop' | 'mobile' | 'tablet';
  };
  classification?: {
    confidence: number;
    reasoning: string;
    keywords: string[];
  };
}
