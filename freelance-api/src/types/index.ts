export interface User {
  id: string;
  email: string;
  full_name: string;
  plan: 'free' | 'pro';
  monthly_goal: number | null;
  tax_rate: number | null;
  se_tax_rate: number | null;
  timezone: string;
  password_hash?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  revoked: boolean;
  expires_at: Date;
  created_at: Date;
}

export interface Tokens {
  access: string;
  refresh: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[] | null;
  hourly_rate: number | null;
  status: 'active' | 'inactive' | 'lead';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  invoice_count?: number;
  total_earned?: number;
  invoices?: any[];
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold' | 'planned';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  deadline: Date | null;
  budget: number | null;
  created_at: Date;
  updated_at: Date;
  client_name?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  tax_rate: number;
  total_amount: number;
  tax_amount: number;
  issue_date: Date;
  due_date: Date | null;
  paid_at: Date | null;
  notes: string | null;
  line_items: InvoiceLineItem[];
  pdf_url: string | null;
  stripe_payment_link: string | null;
  created_at: Date;
  updated_at: Date;
  client_name?: string;
  client_email?: string;
  client_company?: string;
  client_address?: string;
  project_name?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  expense_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}
